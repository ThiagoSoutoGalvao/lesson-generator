<?php

namespace App\Support;

use App\Models\Activity;

/**
 * A lesson's core material — a saved Reading Text or Presentation — as plain source text for /api/generate
 * (Aurora Lessons Phase 1, step 5). This replaces the old round trip of downloading the reading as a PDF and
 * uploading it back: the activities are made straight from what the lesson already holds, with its target
 * vocabulary named so the new activity practises the same words.
 */
class LessonMaterial
{
    /** Activity types that can be a source. `grammar_explainer` is the legacy name of a presentation. */
    public const TYPES = ['reading_text', 'presentation', 'grammar_explainer'];

    /** Longest source sent to Claude — a long presentation is cut at a slide boundary rather than mid-sentence. */
    private const MAX_CHARS = 12000;

    public static function sourceFor(Activity $activity): ?string
    {
        $text = self::text($activity);
        if ($text === '') {
            return null;
        }

        $what = $activity->type === 'reading_text' ? 'reading text' : 'presentation';

        return "Here is the lesson's {$what}, \"{$activity->name}\". Base the activity on it: practise the same "
            . "language, reuse its examples, situations and target vocabulary, and keep any topic the student "
            . "already knows from it.\n\n{$text}";
    }

    public static function text(Activity $activity): string
    {
        $c = $activity->content ?? [];

        $parts = $activity->type === 'reading_text'
            ? self::reading($c)
            : self::slides($c);

        $out = '';
        foreach ($parts as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }
            if ($out !== '' && mb_strlen($out) + mb_strlen($part) + 2 > self::MAX_CHARS) {
                break;
            }
            $out .= ($out === '' ? '' : "\n\n") . $part;
        }

        return $out;
    }

    private static function reading(array $c): array
    {
        $parts = [];
        if (! empty($c['topic'])) {
            $parts[] = 'Title: ' . self::plain($c['topic']);
        }
        foreach ((array) ($c['paragraphs'] ?? []) as $p) {
            $parts[] = self::plain($p);
        }
        $vocab = [];
        foreach ((array) ($c['vocabulary'] ?? []) as $v) {
            $word = self::plain($v['word'] ?? '');
            if ($word !== '') {
                $def = self::plain($v['definition'] ?? '');
                $vocab[] = "- {$word}" . ($def !== '' ? " — {$def}" : '');
            }
        }
        if ($vocab) {
            $parts[] = "Target vocabulary:\n" . implode("\n", $vocab);
        }

        return $parts;
    }

    private static function slides(array $c): array
    {
        $parts = [];
        if (! empty($c['topic'])) {
            $parts[] = 'Topic: ' . self::plain($c['topic']);
        }
        foreach ((array) ($c['slides'] ?? []) as $i => $s) {
            $lines = ['Slide ' . ($i + 1) . ': ' . self::plain($s['title'] ?? '')];
            foreach (['rule', 'form'] as $key) {
                if (! empty($s[$key])) {
                    $lines[] = self::plain($s[$key]);
                }
            }
            foreach ((array) ($s['examples'] ?? []) as $ex) {
                $lines[] = '- ' . self::plain($ex);
            }
            $parts[] = implode("\n", $lines);
        }

        return $parts;
    }

    /** Strips the **bold** markers presentations use, and stray whitespace. */
    private static function plain($value): string
    {
        return trim(preg_replace('/[ \t]+/u', ' ', str_replace('**', '', (string) $value)));
    }
}
