<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\ActivityAttempt;
use App\Models\User;

/**
 * Builds one student's progress snapshot — shared by the student's own
 * GET /api/student/progress and the teacher's GET /api/students/{student}/progress
 * (Phase S5), so both sides always agree on what "done" means.
 */
class StudentProgressService
{
    /** How many recent attempts to return (most recent first). */
    private const RECENT_LIMIT = 30;

    public static function build(User $student): array
    {
        $activities = Activity::query()
            ->where('trilha', $student->trilha)
            ->where('student_visible', true)
            ->whereNotIn('type', Activity::TEACHER_ONLY_TYPES)
            ->whereNotNull('trilha_lesson')
            ->get(['id', 'trilha_lesson']);

        $attempts = ActivityAttempt::where('student_id', $student->id)
            ->whereIn('activity_id', $activities->pluck('id'))
            ->get(['activity_id']);

        $doneActivityIds = $attempts->pluck('activity_id')->unique();

        $lessons = $activities
            ->groupBy('trilha_lesson')
            ->map(fn ($group, $lesson) => [
                'lesson' => (int) $lesson,
                'total'  => $group->count(),
                'done'   => $group->pluck('id')->intersect($doneActivityIds)->count(),
            ])
            ->values()
            ->sortBy('lesson')
            ->values();

        $recent = ActivityAttempt::where('student_id', $student->id)
            ->whereIn('activity_id', $activities->pluck('id'))
            ->with('activity:id,name,type,trilha_lesson')
            ->orderByDesc('completed_at')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn (ActivityAttempt $a) => [
                'id'            => $a->id,
                'activity_id'   => $a->activity_id,
                'name'          => $a->activity->name,
                'type'          => $a->activity->type,
                'lesson'        => $a->activity->trilha_lesson,
                'score'         => $a->score,
                'max_score'     => $a->max_score,
                'completed_at'  => $a->completed_at,
            ]);

        return [
            'trilha'           => $student->trilha,
            'activities_total' => $activities->count(),
            'activities_done'  => $doneActivityIds->count(),
            'total_attempts'   => $attempts->count(),
            'lessons'          => $lessons,
            'recent'           => $recent,
        ];
    }
}
