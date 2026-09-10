<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\ActivityAttempt;
use Illuminate\Http\Request;

/**
 * Read-only content API for the student app, plus attempt recording (Phase S3).
 *
 * The key departure from the rest of the app: activities are filtered by the
 * student's trilha, NOT by owner (auth()->id()). The trilha library is built
 * under the shared Aurora teacher login, so a student never owns any of it.
 */
class StudentContentController extends Controller
{
    /**
     * All student-visible activities for the student's trilha, grouped by
     * lesson number, each annotated with the student's own progress (done /
     * last score / attempt count). Content blobs are fetched per activity when
     * the player opens one.
     *
     * GET /api/student/lessons
     */
    public function lessons(Request $request)
    {
        $student = $request->user();

        $activities = Activity::query()
            ->where('trilha', $student->trilha)
            ->where('student_visible', true)
            ->whereNotIn('type', Activity::TEACHER_ONLY_TYPES)
            ->whereNotNull('trilha_lesson')
            ->orderBy('trilha_lesson')
            ->orderBy('created_at')
            ->get(['id', 'name', 'type', 'trilha_lesson']);

        // Latest attempt per activity for this student (plus a count for the
        // progress page later). One query for the whole trilha.
        $attempts = ActivityAttempt::query()
            ->where('student_id', $student->id)
            ->whereIn('activity_id', $activities->pluck('id'))
            ->orderBy('completed_at')
            ->get(['activity_id', 'score', 'max_score', 'completed_at'])
            ->groupBy('activity_id');

        $lessons = $activities
            ->groupBy('trilha_lesson')
            ->map(fn ($group) => $group->map(function ($a) use ($attempts) {
                $mine   = $attempts->get($a->id);
                $latest = $mine?->last();

                return [
                    'id'         => $a->id,
                    'name'       => $a->name,
                    'type'       => $a->type,
                    'done'       => $mine !== null,
                    'last_score' => $latest?->score,
                    'last_max'   => $latest?->max_score,
                    'attempts'   => $mine?->count() ?? 0,
                ];
            })->values());

        return response()->json(['lessons' => $lessons]);
    }

    /**
     * One activity's full content blob, for the player. Guarded to the
     * student's own trilha and the same visibility rules as the list.
     *
     * GET /api/student/activities/{activity}
     */
    public function activity(Request $request, Activity $activity)
    {
        $this->assertVisible($activity, $request->user());

        return response()->json([
            'id'            => $activity->id,
            'name'          => $activity->name,
            'trilha_lesson' => $activity->trilha_lesson,
            'content'       => $activity->content,
        ]);
    }

    /**
     * Record a completed attempt. `score` / `max_score` are omitted for
     * completion-only activities. Unlimited retakes — every call inserts a row.
     *
     * POST /api/student/attempts
     */
    public function storeAttempt(Request $request)
    {
        $student = $request->user();

        $data = $request->validate([
            'activity_id' => ['required', 'integer'],
            'score'       => ['nullable', 'integer', 'min:0', 'max:999'],
            'max_score'   => ['nullable', 'integer', 'min:0', 'max:999'],
            'answers'     => ['nullable', 'array'],
        ]);

        $activity = Activity::findOrFail($data['activity_id']);
        $this->assertVisible($activity, $student);

        $attempt = ActivityAttempt::create([
            'student_id'   => $student->id,
            'activity_id'  => $activity->id,
            'score'        => $data['score'] ?? null,
            'max_score'    => $data['max_score'] ?? null,
            'answers'      => $data['answers'] ?? null,
            'completed_at' => now(),
        ]);

        return response()->json(['id' => $attempt->id], 201);
    }

    /**
     * The one visibility gate, shared by every endpoint here: the activity must
     * belong to the student's trilha, be flagged visible, and not be a
     * teacher-only type. 404 (not 403) so we never confirm an activity exists.
     */
    private function assertVisible(Activity $activity, $student): void
    {
        abort_unless(
            $activity->trilha === $student->trilha
                && $activity->student_visible
                && ! in_array($activity->type, Activity::TEACHER_ONLY_TYPES, true),
            404,
        );
    }
}
