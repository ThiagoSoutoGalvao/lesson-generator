<?php

namespace App\Services;

use App\Models\Activity;
use RuntimeException;

/**
 * Listening activities for Aurora Business lessons (2026-11-26). Four formats:
 *   answer    — listen to the lesson's reading, then True / False statements
 *   who       — the same audio, match sentences to the speaker (dialogues and interviews only)
 *   complete  — the reading's lines with gaps on the target language; each line can be replayed
 *   message   — a NEW short voicemail written from the lesson, then the student fills in a phone-message form
 * Claude writes the questions (and the message script); App\Services\Speech voices every line, one clip per line.
 * The activity's content carries the lines (speaker, text, clip id) plus that format's items.
 */
class ListeningMaker
{
    public const FORMATS = ['answer', 'who', 'complete', 'message'];
    public const LABELS = ['answer' => 'Listen and answer', 'who' => 'Who said it?', 'complete' => 'Listen and complete', 'message' => 'Take the message'];

    private const FEMALE = ['coral', 'sage', 'shimmer', 'nova'];
    private const MALE = ['ash', 'onyx', 'echo', 'verse'];

    public function __construct(private ClaudeService $claude, private Speech $speech) {}

    /** The lesson reading's lines: "Name: …" turns when it is a dialogue, otherwise one line per paragraph. */
    public static function lines(Activity $reading): array
    {
        $out = [];
        foreach ((array) ($reading->content['paragraphs'] ?? []) as $p) {
            $p = trim(str_replace('**', '', (string) $p));
            $parts = preg_split('/(?:^|(?<=[.!?…"”])\s+)([A-ZÀ-Ý][\p{L}\'-]{1,20}):\s+/u', $p, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
            if (count($parts) >= 2 && preg_match('/^[A-ZÀ-Ý][\p{L}\'-]{1,20}$/u', $parts[0])) {
                for ($i = 0; $i + 1 < count($parts); $i += 2) {
                    $out[] = ['who' => $parts[$i], 'text' => trim($parts[$i + 1])];
                }
            } elseif ($p !== '') {
                $out[] = ['who' => 'Narrator', 'text' => $p];
            }
        }
        return $out;
    }

    public static function speakers(array $lines): array
    {
        return array_values(array_unique(array_filter(array_column($lines, 'who'), fn ($w) => $w !== 'Narrator')));
    }

    /** Makes one listening activity's content. $context = the unit plan (cast, company), for the voices and the message. */
    public function make(string $format, Activity $reading, string $level, string $context = ''): array
    {
        if (! in_array($format, self::FORMATS, true)) throw new RuntimeException("Unknown listening format {$format}.");
        $lines = self::lines($reading);
        if (! $lines) throw new RuntimeException('The reading has no text to listen to.');
        if ($format === 'who' && count(self::speakers($lines)) < 2) throw new RuntimeException('“Who said it?” needs a dialogue with two or more people.');

        $script = implode("\n", array_map(fn ($l, $i) => "[{$i}] {$l['who']}: {$l['text']}", $lines, array_keys($lines)));
        $ask = "You write a {$level} listening exercise for a small group of adult Business English students. "
            . ($context ? "Lesson context (cast and company):\n" . mb_substr($context, 0, 1500) . "\n\n" : '')
            . ($format === 'message' ? "This lesson's reading, for the situation and language:\n" : "The recording (numbered lines):\n") . $script . "\n\n"
            . $this->task($format, $level)
            . "\nAlso return \"voices\": an object giving each person who speaks (use \"Narrator\" for a narrator) \"female\" or \"male\", "
            . "chosen from how the lesson presents them; a narrator who speaks as \"I\" takes that person's voice. Plain English, no markdown. Return only the JSON.";

        $d = $this->claude->askJson([['type' => 'text', 'text' => $ask]]);
        if ($format === 'message') {
            $lines = array_values(array_filter(array_map(fn ($l) => ['who' => trim((string) ($l['who'] ?? '')), 'text' => trim((string) ($l['text'] ?? ''))], (array) ($d['lines'] ?? [])), fn ($l) => $l['who'] !== '' && $l['text'] !== ''));
            if (! $lines) throw new RuntimeException('Claude did not write the message.');
        }
        $content = ['type' => 'listening', 'format' => $format, 'level' => $level, 'topic' => mb_substr(trim((string) ($d['title'] ?? self::LABELS[$format])), 0, 120)];
        $content += $this->check($format, $d, $lines);
        $content['lines'] = $this->voice($lines, (array) ($d['voices'] ?? []), $level, $format === 'message');
        return $content;
    }

    private function task(string $format, string $level): string
    {
        return match ($format) {
            'answer' => 'Write 8 True / False statements about what the people SAY in the recording, in the order it is heard. About half true, half false; a false one changes one fact (a day, a time, a frequency, a person). '
                . 'Return JSON {"title": "a short title", "items": [{"statement": "...", "answer": true, "why": "a short quote or fact from the recording that proves it"}]}.',
            'who' => 'Write 8 short sentences quoted word for word from the recording (each 3–12 words, copied exactly from one line), and who said each. Mix the speakers. '
                . 'Return JSON {"title": "a short title", "items": [{"quote": "exact words", "line": 3, "who": "the speaker"}]}.',
            'complete' => 'Choose 8 gaps: short phrases (1–3 words) copied exactly from the recording, each the lesson\'s target language or vocabulary, at most 2 per line, never the speaker\'s name. '
                . 'Return JSON {"title": "a short title", "gaps": [{"line": 3, "answer": "exact words"}]}.',
            'message' => "Write a NEW short phone voicemail (60–90 words) that one person from the lesson leaves for another, about this lesson's situation, at {$level} level. "
                . 'It must contain 5 clear facts to note down (for example who called, a day, a time, a place, a thing to bring, a phone extension or number); say any number slowly and repeat it once. '
                . 'Then write the phone-message form: 5 fields, each ONE short fact, in the order heard. For each field give "accept": 1–4 short forms a student might write (e.g. ["10", "ten", "10:00"]); an answer counts when it contains one of them. '
                . 'Return JSON {"title": "Message from …", "lines": [{"who": "the caller", "text": "the whole voicemail"}], "fields": [{"label": "When is the meeting?", "answer": "Wednesday", "accept": ["wednesday", "wed"]}]}.',
        };
    }

    /** Keeps only items the recording really supports; too few left → error (the builder logs it and moves on). */
    private function check(string $format, array $d, array $lines): array
    {
        $norm = fn ($s) => trim(preg_replace('/\s+/u', ' ', preg_replace('/[^\p{L}\p{N}\' ]+/u', ' ', mb_strtolower((string) $s))));
        $min = 5;
        if ($format === 'answer') {
            $items = [];
            foreach ((array) ($d['items'] ?? []) as $it) {
                if (! is_string($it['statement'] ?? null) || ! is_bool($it['answer'] ?? null)) continue;
                $items[] = ['statement' => trim($it['statement']), 'answer' => $it['answer'], 'why' => trim((string) ($it['why'] ?? ''))];
            }
            if (count($items) < $min) throw new RuntimeException('Too few True / False statements came back.');
            return ['items' => array_slice($items, 0, 10)];
        }
        if ($format === 'who') {
            $speakers = self::speakers($lines);
            $items = [];
            foreach ((array) ($d['items'] ?? []) as $it) {
                $q = trim((string) ($it['quote'] ?? ''), " \"“”");
                $who = (string) ($it['who'] ?? '');
                if ($q === '' || ! in_array($who, $speakers, true)) continue;
                $said = array_filter($lines, fn ($l) => $l['who'] === $who && str_contains($norm($l['text']), $norm($q)));
                if (! $said) continue; // not really said by that person
                $items[] = ['quote' => $q, 'who' => $who];
            }
            if (count($items) < $min) throw new RuntimeException('Too few “Who said it?” sentences matched the recording.');
            return ['items' => array_slice($items, 0, 10), 'speakers' => $speakers];
        }
        if ($format === 'complete') {
            $gaps = []; $perLine = [];
            foreach ((array) ($d['gaps'] ?? []) as $g) {
                $i = (int) ($g['line'] ?? -1);
                $a = trim((string) ($g['answer'] ?? ''));
                if (! isset($lines[$i]) || $a === '' || mb_stripos($lines[$i]['text'], $a) === false) continue;
                if (($perLine[$i] ?? 0) >= 2) continue;
                if (collect($gaps)->contains(fn ($x) => $x['line'] === $i && (mb_stripos($x['answer'], $a) !== false || mb_stripos($a, $x['answer']) !== false))) continue;
                $perLine[$i] = ($perLine[$i] ?? 0) + 1;
                $gaps[] = ['line' => $i, 'answer' => $a];
            }
            if (count($gaps) < $min) throw new RuntimeException('Too few gaps matched the recording.');
            usort($gaps, fn ($x, $y) => $x['line'] <=> $y['line']);
            return ['gaps' => array_slice($gaps, 0, 10)];
        }
        $fields = [];
        foreach ((array) ($d['fields'] ?? []) as $f) {
            $accept = array_values(array_filter(array_map(fn ($x) => $norm($x), (array) ($f['accept'] ?? []))));
            if (! is_string($f['label'] ?? null) || ! $accept) continue;
            $fields[] = ['label' => trim($f['label']), 'answer' => trim((string) ($f['answer'] ?? $accept[0])), 'accept' => array_slice($accept, 0, 6)];
        }
        if (count($fields) < 4) throw new RuntimeException('The message form came back incomplete.');
        return ['fields' => array_slice($fields, 0, 6)];
    }

    /** Voices each line; a person keeps one voice through the activity. */
    private function voice(array $lines, array $voices, string $level, bool $phone): array
    {
        $pick = []; $used = ['female' => 0, 'male' => 0];
        $style = Speech::style($level, $phone ? 'This is a voicemail left on a work phone: a little hurried but clear; say numbers carefully.' : null);
        foreach ($lines as &$l) {
            if (! isset($pick[$l['who']])) {
                $g = ($voices[$l['who']] ?? 'female') === 'male' ? 'male' : 'female';
                $pool = $g === 'male' ? self::MALE : self::FEMALE;
                $pick[$l['who']] = $pool[$used[$g]++ % count($pool)];
            }
            $l['voice'] = $pick[$l['who']];
            $l['clip'] = $this->speech->say(mb_substr($l['text'], 0, 4000), $l['voice'], $style);
        }
        return $lines;
    }
}
