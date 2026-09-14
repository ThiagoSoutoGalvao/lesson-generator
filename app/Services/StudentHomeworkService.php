<?php

namespace App\Services;

use App\Models\ActivityAttempt;
use App\Models\StudentAssignment;
use App\Models\User;

/**
 * Builds one student's homework list — activities assigned to them directly
 * (Aurora Homework Phase H2), independent of trilha. Shared by the student's
 * own GET /api/student/homework and the teacher's
 * GET /api/students/{student}/assignments, same split as StudentProgressService.
 *
 * Completion is read off activity_attempts (student_id + activity_id), not
 * stored on the assignment itself — an assigned activity that's played
 * through StudentActivityPlayer already records an attempt the normal way,
 * so there's nothing homework-specific to keep in sync.
 */
class StudentHomeworkService
{
    public static function build(User $student): array
    {
        $assignments = StudentAssignment::where('student_id', $student->id)
            ->with('activity:id,name,type')
            ->orderByDesc('created_at')
            ->get();

        $doneActivityIds = ActivityAttempt::where('student_id', $student->id)
            ->whereIn('activity_id', $assignments->pluck('activity_id'))
            ->distinct()
            ->pluck('activity_id');

        return $assignments
            // An assignment whose activity was deleted has nothing left to show.
            ->filter(fn (StudentAssignment $a) => $a->activity !== null)
            ->map(fn (StudentAssignment $a) => [
                'id'          => $a->id,
                'activity_id' => $a->activity_id,
                'name'        => $a->activity->name,
                'type'        => $a->activity->type,
                'note'        => $a->note,
                'assigned_at' => $a->created_at,
                'done'        => $doneActivityIds->contains($a->activity_id),
            ])
            ->values()
            ->all();
    }
}
