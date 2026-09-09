<?php

namespace App\Http\Controllers;

use App\Models\Activity;

/**
 * Read-only content API for the student app.
 *
 * The key departure from the rest of the app: activities are filtered by the
 * student's trilha, NOT by owner (auth()->id()). The trilha library is built
 * under the shared Aurora teacher login, so a student never owns any of it.
 *
 * Phase S2 — browse + play only. No progress, no scoring (that's S3).
 */
class StudentContentController extends Controller
{
    /**
     * All student-visible activities for the student's trilha, grouped by
     * lesson number. Metadata only — the content blob is fetched per activity
     * when the player opens it.
     *
     * GET /api/student/lessons
     */
    public function lessons()
    {
        $student = auth()->user();

        $activities = Activity::query()
            ->where('trilha', $student->trilha)
            ->where('student_visible', true)
            ->whereNotIn('type', Activity::TEACHER_ONLY_TYPES)
            ->whereNotNull('trilha_lesson')
            ->orderBy('trilha_lesson')
            ->orderBy('created_at')
            ->get(['id', 'name', 'type', 'trilha_lesson']);

        $lessons = $activities
            ->groupBy('trilha_lesson')
            ->map(fn ($group) => $group->map(fn ($a) => [
                'id'   => $a->id,
                'name' => $a->name,
                'type' => $a->type,
            ])->values());

        return response()->json(['lessons' => $lessons]);
    }

    /**
     * One activity's full content blob, for the player. Guarded to the
     * student's own trilha and the same visibility rules as the list.
     *
     * GET /api/student/activities/{activity}
     */
    public function activity(Activity $activity)
    {
        $student = auth()->user();

        abort_unless(
            $activity->trilha === $student->trilha
                && $activity->student_visible
                && ! in_array($activity->type, Activity::TEACHER_ONLY_TYPES, true),
            404,
        );

        return response()->json([
            'id'            => $activity->id,
            'name'          => $activity->name,
            'trilha_lesson' => $activity->trilha_lesson,
            'content'       => $activity->content,
        ]);
    }
}
