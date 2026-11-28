<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Edit inside the activity (2026-11-28, his groups 1 + 2): the teacher fixes or removes one item on screen — a quiz
 * question, a Categorise word, a role-play card… The request carries the whole list; each item says which saved item it
 * came from (`_from`), and only that type's TEXT fields are taken from it. Everything else (photos, keywords, evidence,
 * level) is kept from the saved item, items can be removed but never added, and each type's rules are checked so the
 * screen can't break (one right answer, no repeated words, the odd one is one of the words…).
 * Gap-fills and Listening are deliberately not here (his call: gap spacing is fragile; listening lines are recorded).
 *
 * PATCH /api/activities/{activity}/items  { content: { <list>: [ { _from, …text fields } ] } }
 */
class ActivityItemsController extends Controller
{
    /** type => [list key, minimum items left] */
    public const TYPES = [
        'quiz'                => ['questions', 1],
        'true_false'          => ['statements', 1],
        'mc_reading'          => ['questions', 1],
        'odd_one_out'         => ['groups', 1],
        'match_pairs'         => ['pairs', 2],
        'word_categorisation' => ['categories', 2],
        'signs_notices'       => ['items', 1],
        'flashcards'          => ['cards', 1],
        'unjumble'            => ['sentences', 1],
        'error_correction'    => ['items', 1],
        'role_play'           => ['cards', 1],
        'debate'              => ['statements', 1],
        'mini_presentation'   => ['topics', 1],
    ];

    public function update(Request $request, Activity $activity)
    {
        abort_if($activity->user_id !== auth()->id(), 403);
        abort_unless(isset(self::TYPES[$activity->type]), 422, 'This activity type cannot be edited here.');
        [$key, $min] = self::TYPES[$activity->type];
        $saved = array_values((array) ($activity->content[$key] ?? []));

        $request->validate([
            'content'           => ['required', 'array'],
            "content.{$key}"    => ['required', 'array', 'min:' . $min, 'max:' . count($saved)],
            "content.{$key}.*"  => ['array'],
            "content.{$key}.*._from" => ['required', 'integer', 'min:0', 'max:' . max(0, count($saved) - 1), 'distinct'],
        ], [
            "content.{$key}.min" => "At least {$min} must stay.",
            "content.{$key}.max" => 'Items cannot be added here.',
        ]);

        $out = [];
        foreach ($request->input("content.{$key}") as $n => $in) {
            $base = $saved[(int) $in['_from']];
            $out[] = $this->item($activity->type, $base, $in, $n + 1, $activity->content);
        }
        $this->checkList($activity->type, $out);
        if ($activity->type === 'word_categorisation' && count($out) !== count($saved)) $this->fail('The groups cannot be removed here.');

        $content = $activity->content;
        $content[$key] = $out;
        $activity->update(['content' => $content]);
        return response()->json(['activity' => $activity->fresh()]);
    }

    // ---------------------------------------------------------------------------------------------------------------

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['content' => [$message]]);
    }

    private static function t($v): string
    {
        return trim(preg_replace('/[ \t]+/u', ' ', str_replace("\r", '', (string) $v)));
    }

    private function need(array $in, string $field, string $label, int $n, int $max = 600): string
    {
        $v = self::t($in[$field] ?? '');
        if ($v === '') $this->fail("{$label} {$n} needs some text.");
        if (mb_strlen($v) > $max) $this->fail("{$label} {$n} is too long.");
        return $v;
    }

    private function opt(array $in, string $field, int $max = 600): ?string
    {
        if (! array_key_exists($field, $in)) return null;
        $v = self::t($in[$field]);
        return mb_strlen($v) > $max ? mb_substr($v, 0, $max) : $v;
    }

    /** A list of strings, tidied, empties dropped. */
    private function lines($v, int $maxEach = 200): array
    {
        return array_values(array_filter(array_map(fn ($s) => mb_substr(self::t($s), 0, $maxEach), (array) $v), fn ($s) => $s !== ''));
    }

    /** Options keep their saved count; every one needs text and they must differ. */
    private function options($v, int $count, string $label, int $n): array
    {
        $o = array_map(fn ($s) => self::t($s), array_values((array) $v));
        if (count($o) !== $count) $this->fail("{$label} {$n} must keep {$count} options.");
        foreach ($o as $s) if ($s === '' || mb_strlen($s) > 300) $this->fail("Every option in {$label} {$n} needs some text.");
        if (count(array_unique(array_map('mb_strtolower', $o))) !== count($o)) $this->fail("The options in {$label} {$n} must be different.");
        return $o;
    }

    private function index($v, int $count, string $label, int $n): int
    {
        if (! is_numeric($v) || (int) $v < 0 || (int) $v >= $count) $this->fail("Choose the right answer for {$label} {$n}.");
        return (int) $v;
    }

    private function setOpt(array &$base, string $field, ?string $v): void
    {
        if ($v === null) return;
        if ($v === '') unset($base[$field]); else $base[$field] = $v;
    }

    private function item(string $type, array $b, array $in, int $n, array $content): array
    {
        switch ($type) {
            case 'quiz':
                $b['question'] = $this->need($in, 'question', 'Question', $n);
                $texts = $this->options($in['options'] ?? [], count($b['answers'] ?? []), 'Question', $n);
                $right = $this->index($in['correct'] ?? null, count($texts), 'question', $n);
                $b['answers'] = array_map(fn ($t, $i) => ['text' => $t, 'correct' => $i === $right], $texts, array_keys($texts));
                $this->setOpt($b, 'explanation', $this->opt($in, 'explanation'));
                return $b;
            case 'true_false':
                $b['text'] = $this->need($in, 'text', 'Statement', $n);
                $a = self::t($in['answer'] ?? '');
                if (! in_array($a, ['True', 'False', 'Not Given'], true)) $this->fail("Choose True, False or Not Given for statement {$n}.");
                $b['answer'] = $a;
                $this->setOpt($b, 'explanation', $this->opt($in, 'explanation'));
                return $b;
            case 'mc_reading':
                $b['text'] = $this->need($in, 'text', 'Question', $n);
                $b['options'] = $this->options($in['options'] ?? [], count($b['options'] ?? []), 'Question', $n);
                $b['answer'] = $b['options'][$this->index($in['correct'] ?? null, count($b['options']), 'question', $n)];
                $this->setOpt($b, 'explanation', $this->opt($in, 'explanation'));
                return $b;
            case 'odd_one_out':
                $b['words'] = $this->options($in['words'] ?? [], count($b['words'] ?? []), 'Group', $n);
                $b['odd_one'] = $b['words'][$this->index($in['odd'] ?? null, count($b['words']), 'group', $n)];
                $this->setOpt($b, 'reason', $this->opt($in, 'reason'));
                return $b;
            case 'match_pairs':
                $b['left'] = $this->need($in, 'left', 'Pair', $n, 300);
                $b['right'] = $this->need($in, 'right', 'Pair', $n, 300);
                return $b;
            case 'word_categorisation':
                $b['name'] = $this->need($in, 'name', 'Group', $n, 120);
                $b['words'] = $this->lines($in['words'] ?? [], 120);
                if (count($b['words']) < 1) $this->fail("Group {$n} needs at least one word.");
                if (count($b['words']) > 15) $this->fail("Group {$n} can have at most 15 words.");
                return $b;
            case 'signs_notices':
                $b['text'] = $this->need($in, 'text', 'Text', $n, 1500);
                $b['question'] = $this->need($in, 'question', 'Question', $n);
                $b['options'] = $this->options($in['options'] ?? [], count($b['options'] ?? []), 'Text', $n);
                $b['answer'] = $this->index($in['correct'] ?? null, count($b['options']), 'text', $n);
                foreach (['from', 'subject'] as $f) $this->setOpt($b, $f, $this->opt($in, $f, 200));
                return $b;
            case 'flashcards':
                $b['word'] = $this->need($in, 'word', 'Card', $n, 120);
                $b['definition'] = $this->need($in, 'definition', 'Card', $n);
                foreach (['pronunciation', 'example', 'example2'] as $f) $this->setOpt($b, $f, $this->opt($in, $f));
                return $b;
            case 'unjumble':
                $b['sentence'] = $this->need($in, 'sentence', 'Sentence', $n, 300);
                $b['words'] = preg_split('/\s+/u', $b['sentence']);
                if (count($b['words']) < 2) $this->fail("Sentence {$n} needs at least two words.");
                return $b;
            case 'error_correction':
                $passage = is_string($content['passage'] ?? null) && trim($content['passage']) !== '';
                if (! $passage) $b['sentence'] = $this->need($in, 'sentence', 'Sentence', $n);
                $b['error'] = $this->need($in, 'error', 'Mistake', $n, 200);
                $b['correction'] = $this->need($in, 'correction', 'Correction', $n, 200);
                $where = $passage ? $content['passage'] : $b['sentence'];
                if (! str_contains($where, $b['error'])) $this->fail("Mistake {$n}: the wrong words must appear exactly like that in the " . ($passage ? 'text.' : 'sentence.'));
                $this->setOpt($b, 'explanation', $this->opt($in, 'explanation'));
                return $b;
            case 'role_play':
                $b['situation'] = $this->need($in, 'situation', 'Card', $n, 800);
                foreach (['role_a', 'role_b', 'role_c'] as $r) {
                    if (! isset($b[$r]) || ! is_array($b[$r])) continue;
                    $b[$r]['name'] = $this->need((array) ($in[$r] ?? []), 'name', strtoupper(substr($r, -1)) . ' role name, card', $n, 120);
                    $b[$r]['brief'] = $this->need((array) ($in[$r] ?? []), 'brief', strtoupper(substr($r, -1)) . ' role brief, card', $n, 800);
                }
                return $b;
            case 'debate':
                $b['statement'] = $this->need($in, 'statement', 'Statement', $n);
                $b['for'] = $this->lines($in['for'] ?? []);
                $b['against'] = $this->lines($in['against'] ?? []);
                return $b;
            case 'mini_presentation':
                $b['title'] = $this->need($in, 'title', 'Topic', $n, 200);
                $steps = array_values((array) ($in['steps'] ?? []));
                if (count($steps) !== count($b['steps'] ?? [])) $this->fail("Topic {$n} must keep its steps.");
                foreach ($b['steps'] as $j => $s) {
                    $b['steps'][$j]['name'] = $this->need((array) $steps[$j], 'name', "Topic {$n}, step", $j + 1, 120);
                    $b['steps'][$j]['hint'] = $this->need((array) $steps[$j], 'hint', "Topic {$n}, step", $j + 1, 300);
                }
                return $b;
        }
        $this->fail('This activity type cannot be edited here.');
    }

    /** Rules across the whole list: the screens find words and pairs by their text, so they can't repeat. */
    private function checkList(string $type, array $items): void
    {
        $dupe = fn (array $xs) => count($xs) !== count(array_unique(array_map(fn ($x) => mb_strtolower($x), $xs)));
        if ($type === 'word_categorisation' && $dupe(array_merge(...array_map(fn ($c) => $c['words'], $items)))) {
            $this->fail('A word appears twice — every word must be different.');
        }
        if ($type === 'match_pairs' && ($dupe(array_column($items, 'left')) || $dupe(array_column($items, 'right')))) {
            $this->fail('Two pairs have the same text — every left and right side must be different.');
        }
    }
}
