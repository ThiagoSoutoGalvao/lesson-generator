<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Photo first (2026-11-24). Picture Prompts and Image Vocab Match used to write the question / word
 * first and find a photo later, by keyword, when the screen opened — so the photo often didn't show
 * what the question asked about, and a cached keyword could change photo between teachers.
 *
 * Now, at generation: each item gets up to 4 Unsplash candidates, Claude LOOKS at them, picks the one
 * that really shows the word or scene (or none), and — for Picture Prompts — rewrites the question and
 * starters for that exact photo. The chosen photo is saved with the activity (`photo`), so what the
 * teacher reviewed is what the student sees. Items with no fitting photo are dropped.
 *
 * If Unsplash or the look-at-the-photos call fails, the activity comes back as before (no `photo`;
 * the screen falls back to the keyword search) rather than failing the whole generation.
 */
class PhotoMatcher
{
    private const PER_ITEM = 4;

    /** Photo ids already used in this teacher's activities — skipped when anything else fits (2026-11-25). */
    private array $avoid = [];

    public function __construct(private ClaudeService $claude) {}

    /** Prefer photos this login hasn't used yet: the same office photos kept coming back across lessons. */
    public function avoidUsedBy(?int $userId): static
    {
        $this->avoid = [];
        if ($userId === null) {
            return $this;
        }
        $rows = \App\Models\Activity::where('user_id', $userId)->whereIn('type', ['picture_prompts', 'image_vocab_match'])->pluck('content');
        foreach ($rows as $c) {
            $c = is_array($c) ? $c : (json_decode((string) $c, true) ?: []);
            foreach (array_merge($c['prompts'] ?? [], $c['pairs'] ?? []) as $item) {
                if (! empty($item['photo'])) {
                    $this->avoid[self::photoId($item['photo'])] = true;
                }
            }
        }
        return $this;
    }

    /** An Unsplash URL without its size / crop query, so the same photo matches at any size. */
    private static function photoId(string $url): string
    {
        return strtok($url, '?');
    }

    public function picturePrompts(array $data, string $cefr): array
    {
        $prompts = $data['prompts'] ?? [];
        $cands   = $this->candidatesFor(array_column($prompts, 'keyword'));
        if ($cands === null) {
            return $data;
        }

        $content = [['type' => 'text', 'text' => <<<EOT
You are choosing photos for a speaking activity for {$cefr} English learners: the student looks at one photo and answers a question about it.
For each prompt below you get its search phrase, its draft question and up to 4 candidate photos (labelled a, b, c, d).

For each prompt:
- Pick the ONE photo that best shows the scene: people doing something in a clear setting, with plenty to describe. Never pick a photo that is mostly text, a logo, a screenshot, blurred, or that doesn't show the scene.
- Pick a different photo for every prompt. If no candidate fits, use null.
- Rewrite the question so it is answerable by looking at THAT photo: mention only what is really visible (people, what they do, where, how they seem), then invite a guess or an opinion. Keep the language aim of the draft question. Short, open (what / who / where / how), never yes/no.
- Write 3 starters for that photo, each a natural opening ending in "…": one about what is happening, one about the setting or objects, one guess or opinion. NEVER start with "I can see" or "I see". {$cefr} level language.
EOT]];
        foreach ($prompts as $i => $p) {
            $content[] = ['type' => 'text', 'text' => 'Prompt ' . ($i + 1) . ' — search phrase: "' . $p['keyword'] . '" — draft question: "' . $p['question'] . '"'];
            $this->addPhotos($content, $cands[$i]);
        }
        $content[] = ['type' => 'text', 'text' => 'Return ONLY this JSON: {"prompts": [{"prompt": 1, "photo": "a" or null, "question": "…", "starters": ["…", "…", "…"]}]} — one entry per prompt, in order.'];

        $picked = $this->ask($content);
        if ($picked === null) {
            return $data;
        }

        $out  = [];
        $used = [];
        foreach ($prompts as $i => $p) {
            $choice = $picked[$i + 1] ?? null;
            $photo  = $this->photoFor($choice, $cands[$i], $used);
            if ($photo === null) {
                continue; // no photo shows it — a mismatched picture is worse than one prompt fewer
            }
            $question = trim((string) ($choice['question'] ?? '')) ?: $p['question'];
            $starters = array_values(array_filter(
                array_map(fn ($s) => trim((string) $s), (array) ($choice['starters'] ?? [])),
                fn ($s) => $s !== '' && ! preg_match('/^i\s+(can\s+)?see\b/i', $s)
            ));
            $out[] = ['keyword' => $p['keyword'], 'question' => $question, 'starters' => array_slice($starters ?: $p['starters'], 0, 3)] + $photo;
        }

        if (count($out) < 2) {
            throw new RuntimeException('Not enough photos matched these prompts — please try generating again, or try a more concrete topic.');
        }
        $data['prompts'] = $out;

        return $data;
    }

    public function imageVocabMatch(array $data): array
    {
        $pairs = $data['pairs'] ?? [];
        $cands = $this->candidatesFor(array_column($pairs, 'keyword'));
        if ($cands === null) {
            return $data;
        }

        $content = [['type' => 'text', 'text' => <<<EOT
You are choosing photos for a vocabulary game: students match each word to its photo, so each photo must make its word obvious.
For each word below you get up to 4 candidate photos (labelled a, b, c, d).

For each word, pick the ONE photo where that word is clearly the main thing a learner would name — not just somewhere in the background — and that could not be mistaken for another word in this list. Never pick a photo that is mostly text, a logo or a screenshot. Pick a different photo for every word. If no candidate shows the word clearly, use null.
EOT]];
        $words = implode(', ', array_column($pairs, 'word'));
        $content[] = ['type' => 'text', 'text' => "All the words in this game: {$words}."];
        foreach ($pairs as $i => $p) {
            $content[] = ['type' => 'text', 'text' => 'Word ' . ($i + 1) . ': "' . $p['word'] . '"'];
            $this->addPhotos($content, $cands[$i]);
        }
        $content[] = ['type' => 'text', 'text' => 'Return ONLY this JSON: {"words": [{"word": <the word number, e.g. 1>, "photo": "a" or null}]} — one entry per word, in order.'];

        $picked = $this->ask($content, 'words', 'word');
        if ($picked === null) {
            return $data;
        }

        $out  = [];
        $used = [];
        foreach ($pairs as $i => $p) {
            $photo = $this->photoFor($picked[$i + 1] ?? null, $cands[$i], $used);
            if ($photo !== null) {
                $out[] = $p + $photo;
            }
        }

        if (count($out) < 3) {
            throw new RuntimeException('Not enough photos clearly show these words — please try generating again, or choose more concrete words.');
        }
        $data['pairs'] = $out;

        return $data;
    }

    // ── helpers ──────────────────────────────────────────────────────────────────────────────

    /** Candidates per keyword, or null when Unsplash isn't available (local dev, outage). */
    private function candidatesFor(array $keywords): ?array
    {
        $key = config('services.unsplash.key');
        if (! $key || $keywords === []) {
            return null;
        }
        $all = [];
        foreach ($keywords as $kw) {
            $c = $this->search((string) $kw, $key);
            $short = implode(' ', array_slice(preg_split('/\s+/', trim((string) $kw)), 0, 3));
            if (count($c) < 2 && $short !== trim((string) $kw)) {
                $c = array_merge($c, $this->search($short, $key, (string) $kw));
            }
            // Unused photos first; one already used elsewhere only when there aren't enough fresh ones.
            $c = $this->uniqueByUrl($c);
            $fresh = array_values(array_filter($c, fn ($r) => ! isset($this->avoid[self::photoId($r['regular'])])));
            $used  = array_values(array_filter($c, fn ($r) => isset($this->avoid[self::photoId($r['regular'])])));
            $all[] = array_slice(count($fresh) >= 2 ? $fresh : array_merge($fresh, $used), 0, self::PER_ITEM);
        }
        // Nothing at all came back → treat as unavailable rather than dropping every item.
        return array_sum(array_map('count', $all)) === 0 ? null : $all;
    }

    /** Top results, closest description first (same scoring as BackgroundController). */
    private function search(string $query, string $key, ?string $scoreAgainst = null): array
    {
        try {
            $response = Http::timeout(15)->get('https://api.unsplash.com/search/photos', [
                'query' => $query, 'client_id' => $key, 'orientation' => 'landscape',
                'content_filter' => 'high', 'per_page' => 20,
            ]);
        } catch (\Throwable $e) {
            return [];
        }
        if ($response->failed()) {
            return [];
        }
        $words = $this->words($scoreAgainst ?? $query);
        $rows  = [];
        foreach ((array) $response->json('results', []) as $rank => $photo) {
            if (empty($photo['urls']['regular']) || empty($photo['urls']['small'])) {
                continue;
            }
            $described = $this->words(($photo['alt_description'] ?? '') . ' ' . ($photo['description'] ?? ''));
            $rows[] = [
                'score' => count(array_intersect($words, $described)), 'rank' => $rank,
                'small' => $photo['urls']['small'], 'regular' => $photo['urls']['regular'],
                'credit' => trim((string) ($photo['user']['name'] ?? '')),
            ];
        }
        usort($rows, fn ($a, $b) => [$b['score'], $a['rank']] <=> [$a['score'], $b['rank']]);

        return $rows;
    }

    private function uniqueByUrl(array $rows): array
    {
        $seen = [];

        return array_values(array_filter($rows, function ($r) use (&$seen) {
            if (isset($seen[$r['regular']])) {
                return false;
            }

            return $seen[$r['regular']] = true;
        }));
    }

    private function addPhotos(array &$content, array $cands): void
    {
        foreach ($cands as $j => $c) {
            $content[] = ['type' => 'text', 'text' => 'Photo ' . chr(97 + $j) . ':'];
            $content[] = ['type' => 'image', 'source' => ['type' => 'url', 'url' => $c['small']]];
        }
        if ($cands === []) {
            $content[] = ['type' => 'text', 'text' => '(no candidate photos — use null)'];
        }
    }

    /** Claude's answer keyed by item number (1-based), or null if the call failed. */
    private function ask(array $content, string $list = 'prompts', string $num = 'prompt'): ?array
    {
        try {
            $data = $this->claude->askJson($content);
        } catch (\Throwable $e) {
            Log::warning('PhotoMatcher: photo check failed, keeping keyword photos', ['error' => $e->getMessage()]);

            return null;
        }
        $byItem = [];
        // The item number if Claude gave one, else its place in the list ("word": "printer" happens).
        foreach (array_values((array) ($data[$list] ?? [])) as $n => $row) {
            $id = is_numeric($row[$num] ?? null) ? (int) $row[$num] : $n + 1;
            $byItem[$id] = $row;
        }

        return $byItem;
    }

    /** The chosen candidate as ['photo' => url, 'photo_credit' => name], never one already used. */
    private function photoFor(?array $choice, array $cands, array &$used): ?array
    {
        $letter = is_string($choice['photo'] ?? null) ? strtolower(trim($choice['photo'])) : '';
        $idx    = $letter !== '' ? ord($letter[0]) - 97 : -1;
        if ($idx < 0 || ! isset($cands[$idx]) || isset($used[$cands[$idx]['regular']])) {
            return null;
        }
        $used[$cands[$idx]['regular']] = true;

        return array_filter(['photo' => $cands[$idx]['regular'], 'photo_credit' => $cands[$idx]['credit']]);
    }

    private function words(string $text): array
    {
        preg_match_all('/[a-z]{3,}/', strtolower($text), $m);

        return array_values(array_unique(array_map(fn ($w) => preg_replace('/(?<=[a-z]{3})s$/', '', $w), $m[0])));
    }
}
