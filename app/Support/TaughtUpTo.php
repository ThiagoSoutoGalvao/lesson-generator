<?php

namespace App\Support;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * "Taught up to" (2026-11-28): on an Aurora Business course a student sees lessons only up to the last one
 * their teacher marked as taught ("Mark 4B as taught" on the lesson page) — 1A … 4B, never ahead. Nothing
 * marked yet = 1A only. Business students also see the lesson's reading and presentation, which stay
 * teacher-only on Lights / Glow / Radiant (those courses keep showing the whole trilha, as before).
 *
 * The one place that decides what a student's course list holds — the lessons list, the progress counts and
 * the per-activity gate all use it, so they can't disagree.
 */
final class TaughtUpTo
{
    /** Types a business student may open from their course (on top of the usual student types). */
    public const MATERIAL_TYPES = ['reading_text', 'presentation'];

    public static function applies(?string $trilha): bool
    {
        return in_array($trilha, Trilhas::BUSINESS, true);
    }

    /** The student's mark, defaulting to 1A. */
    public static function mark(User $student): array
    {
        return ['lesson' => (int) ($student->taught_lesson ?: 1), 'part' => $student->taught_part ?: 'A'];
    }

    /** 4B → 42: lesson and part as one comparable number (part NULL = A, as everywhere else). */
    public static function rank(int $lesson, ?string $part): int
    {
        return $lesson * 10 + (ord(strtoupper($part ?: 'A')) - 64);
    }

    /** Is this lesson open to the student? Always true outside business courses. */
    public static function isOpen(User $student, ?int $lesson, ?string $part): bool
    {
        if (! self::applies($student->trilha)) return true;
        if ($lesson === null) return false;
        $m = self::mark($student);
        return self::rank($lesson, $part) <= self::rank($m['lesson'], $m['part']);
    }

    /** Types kept out of this student's course list. */
    public static function hiddenTypes(User $student): array
    {
        return self::applies($student->trilha)
            ? array_values(array_diff(Activity::TEACHER_ONLY_TYPES, self::MATERIAL_TYPES))
            : Activity::TEACHER_ONLY_TYPES;
    }

    /** Every activity the student's course shows them right now (visible, right type, lesson open). */
    public static function courseActivities(User $student, array $columns): Collection
    {
        $columns = array_values(array_unique([...$columns, 'trilha_lesson', 'trilha_part', 'type']));

        return Activity::query()
            ->where('trilha', $student->trilha)
            ->where('student_visible', true)
            ->whereNotIn('type', self::hiddenTypes($student))
            ->whereNotNull('trilha_lesson')
            ->orderBy('trilha_lesson')
            ->orderBy('created_at')
            ->get($columns)
            ->filter(fn (Activity $a) => self::isOpen($student, $a->trilha_lesson, $a->trilha_part))
            ->values();
    }

    /** "4B" → [4, 'B'], or null when it isn't a lesson code. */
    public static function parse(?string $code): ?array
    {
        if (! preg_match('/^\s*(\d{1,2})\s*([ABC])\s*$/i', (string) $code, $m)) return null;
        $lesson = (int) $m[1];
        return $lesson >= 1 ? [$lesson, strtoupper($m[2])] : null;
    }
}
