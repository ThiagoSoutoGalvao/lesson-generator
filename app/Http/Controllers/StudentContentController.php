<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\ActivityAttempt;
use App\Models\StudentAssignment;
use App\Services\StudentHomeworkService;
use App\Services\StudentProgressService;
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
     * The student's own progress snapshot — per-lesson done/total counts and a
     * recent-activity feed (Phase S5). Same shape and builder as the teacher's
     * per-student view.
     *
     * GET /api/student/progress
     */
    public function progress(Request $request)
    {
        return response()->json(StudentProgressService::build($request->user()));
    }

    /**
     * Activities assigned to this student directly by their teacher — kept
     * deliberately separate from the trilha-scoped lessons() list (Aurora
     * Homework Phase H2). Same builder the teacher's per-student view uses.
     *
     * GET /api/student/homework
     */
    public function homework(Request $request)
    {
        return response()->json(['homework' => StudentHomeworkService::build($request->user())]);
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
     * The one visibility gate, shared by every endpoint here. Two independent paths: same trilha
     * as the student (the automatic, whole-class path), or directly assigned to them (Phase H2,
     * a deliberate one-off action) — the latter is how an activity with no trilha at all reaches
     * a student for the first time. 404 (not 403) so we never confirm an activity exists.
     *
     * Teacher-only types are blocked on both paths — EXCEPT `presentation` via the homework path:
     * a teacher can deliberately hand a student a presentation as a take-home reference (2026-09-24),
     * even though presentations stay out of the automatic trilha list (they're built for the teacher
     * to narrate live, and a whole trilha's worth showing up unprompted isn't what was asked for).
     */
    private function assertVisible(Activity $activity, $student): void
    {
        $assigned = StudentAssignment::where('student_id', $student->id)
            ->where('activity_id', $activity->id)
            ->exists();

        $viaTrilha = $activity->trilha === $student->trilha
            && $activity->student_visible
            && ! in_array($activity->type, Activity::TEACHER_ONLY_TYPES, true);

        $viaHomework = $assigned
            && ($activity->type === 'presentation' || ! in_array($activity->type, Activity::TEACHER_ONLY_TYPES, true));

        abort_unless($viaTrilha || $viaHomework, 404);
    }
}
