<?php

namespace App\Support;

use RuntimeException;

/**
 * Checks the answer key of a multiple-choice activity and spreads the right answers evenly across
 * the option positions (2026-11-24). Claude tends to put the right option first, so a lesson came
 * out with every Dialogue Gap-Fill answer on A — asking it to "vary the position" isn't enough.
 *
 * The positions are dealt, not drawn: with 6 questions of 3 options each position holds the right
 * answer exactly twice, in a shuffled order — so no pattern, and never "all A" by chance either.
 */
class AnswerOptions
{
    /** Run on what a generator returned, before it goes back to the browser. */
    public static function fix(string $type, array $data): array
    {
        return match ($type) {
            'quiz'            => self::quiz($data),
            'dialog_gap_fill' => self::dialog($data),
            'mc_reading'      => self::mcReading($data),
            'mc_cloze'        => self::mcCloze($data),
            'signs_notices'   => self::signs($data),
            default           => $data,
        };
    }

    /**
     * One position per item, each position used as evenly as possible, in random order.
     * $sizes = the number of options each item has.
     */
    public static function deal(array $sizes): array
    {
        $n = count($sizes);
        if ($n === 0) {
            return [];
        }
        $k    = max($sizes);
        $deck = [];
        while (count($deck) < $n) {
            $round = range(0, $k - 1);
            shuffle($round);
            array_push($deck, ...$round);
        }
        $deck = array_slice($deck, 0, $n);
        shuffle($deck);

        // An item with fewer options than the widest one can't take a far position.
        foreach ($deck as $i => $pos) {
            $deck[$i] = $sizes[$i] > 0 ? $pos % $sizes[$i] : 0;
        }

        return $deck;
    }

    /** $options with $correct moved to position $pos and the others shuffled around it. */
    private static function place(array $others, mixed $correct, int $pos): array
    {
        shuffle($others);
        array_splice($others, $pos, 0, [$correct]);

        return array_values($others);
    }

    private static function quiz(array $data): array
    {
        $questions = [];
        foreach ($data['questions'] ?? [] as $q) {
            $seen    = [];
            $answers = [];
            foreach ($q['answers'] ?? [] as $a) {
                $text = trim((string) ($a['text'] ?? ''));
                if ($text === '' || isset($seen[mb_strtolower($text)])) {
                    continue;
                }
                $seen[mb_strtolower($text)] = true;
                $answers[] = ['text' => $text, 'correct' => ($a['correct'] ?? false) === true];
            }
            if (count(array_filter($answers, fn ($a) => $a['correct'])) !== 1 || count($answers) < 2) {
                continue; // no right answer, or two — can't be marked
            }
            $q['answers'] = $answers;
            $questions[]  = $q;
        }
        if ($questions === []) {
            throw new RuntimeException('Claude did not return any questions with exactly one right answer — please try generating again.');
        }

        $deal = self::deal(array_map(fn ($q) => count($q['answers']), $questions));
        foreach ($questions as $i => $q) {
            $right  = array_values(array_filter($q['answers'], fn ($a) => $a['correct']))[0];
            $others = array_values(array_filter($q['answers'], fn ($a) => ! $a['correct']));
            $questions[$i]['answers'] = self::place($others, $right, $deal[$i]);
        }
        $data['questions'] = $questions;

        return $data;
    }

    private static function dialog(array $data): array
    {
        $lines  = $data['dialog'] ?? [];
        $blanks = [];
        foreach ($lines as $i => $line) {
            if (empty($line['blank'])) {
                unset($lines[$i]['options']);
                continue;
            }
            $seen    = [];
            $options = [];
            foreach ($line['options'] ?? [] as $o) {
                $text = trim((string) ($o['text'] ?? ''));
                if ($text === '' || isset($seen[mb_strtolower($text)])) {
                    continue;
                }
                $seen[mb_strtolower($text)] = true;
                $options[] = ['text' => $text, 'correct' => ($o['correct'] ?? false) === true];
            }
            $right = array_values(array_filter($options, fn ($o) => $o['correct']));
            if (count($right) !== 1) {
                // Trust the line itself (it always holds the right answer) when the flags are off.
                $lineText = trim((string) ($line['line'] ?? ''));
                $options  = array_map(fn ($o) => ['text' => $o['text'], 'correct' => $o['text'] === $lineText], $options);
                $right    = array_values(array_filter($options, fn ($o) => $o['correct']));
            }
            if (count($right) !== 1 || count($options) < 2) {
                // Can't be marked — show it as an ordinary line instead of a broken gap.
                $lines[$i]['blank'] = false;
                $lines[$i]['line']  = $right[0]['text'] ?? ($line['line'] ?? '');
                unset($lines[$i]['options']);
                continue;
            }
            $lines[$i]['line']    = $right[0]['text'];
            $lines[$i]['options'] = $options;
            $blanks[]             = $i;
        }
        if (count($blanks) < 2) {
            throw new RuntimeException('Claude did not return enough gaps with exactly one right answer — please try generating again.');
        }

        $deal = self::deal(array_map(fn ($i) => count($lines[$i]['options']), $blanks));
        foreach ($blanks as $n => $i) {
            $right  = array_values(array_filter($lines[$i]['options'], fn ($o) => $o['correct']))[0];
            $others = array_values(array_filter($lines[$i]['options'], fn ($o) => ! $o['correct']));
            $lines[$i]['options'] = self::place($others, $right, $deal[$n]);
        }
        $data['dialog'] = array_values($lines);

        return $data;
    }

    /** Questions whose options are strings and whose answer is the right string. */
    private static function mcReading(array $data): array
    {
        $qs   = $data['questions'] ?? [];
        $deal = self::deal(array_map(fn ($q) => count($q['options'] ?? []), $qs));
        foreach ($qs as $i => $q) {
            $others = array_values(array_filter($q['options'], fn ($o) => $o !== $q['answer']));
            $qs[$i]['options'] = self::place($others, $q['answer'], $deal[$i]);
        }
        $data['questions'] = $qs;

        return $data;
    }

    private static function mcCloze(array $data): array
    {
        $parts = $data['parts'] ?? [];
        $gaps  = array_keys(array_filter($parts, fn ($p) => isset($p['blank'], $p['options'])));
        $deal  = self::deal(array_map(fn ($i) => count($parts[$i]['options']), $gaps));
        foreach ($gaps as $n => $i) {
            $others = array_values(array_filter($parts[$i]['options'], fn ($o) => $o !== $parts[$i]['blank']));
            $parts[$i]['options'] = self::place($others, $parts[$i]['blank'], $deal[$n]);
        }
        $data['parts'] = $parts;

        return $data;
    }

    /** Signs & Notices keeps the answer as an index, so it moves with the option. */
    private static function signs(array $data): array
    {
        $items = $data['items'] ?? [];
        $deal  = self::deal(array_map(fn ($it) => count($it['options']), $items));
        foreach ($items as $i => $it) {
            $right  = $it['options'][$it['answer']];
            $others = array_values(array_filter($it['options'], fn ($o, $j) => $j !== $it['answer'], ARRAY_FILTER_USE_BOTH));
            $items[$i]['options'] = self::place($others, $right, $deal[$i]);
            $items[$i]['answer']  = $deal[$i];
        }
        $data['items'] = $items;

        return $data;
    }
}
