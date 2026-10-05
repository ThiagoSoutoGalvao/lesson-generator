<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\ActivityAttempt;
use App\Models\StudentAssignment;
use App\Models\User;
use App\Services\StudentHomeworkService;
use App\Services\StudentProgressService;
use App\Support\Credentials;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Teacher-facing management of student accounts.
 *
 * A student is a `users` row with role='student', linked to the creating
 * teacher via teacher_id and to one trilha at a time. Teachers set the
 * password directly (test phase); an email set-password flow can be added
 * later without rework.
 */
class StudentController extends Controller
{
    private function guardTeacher(): void
    {
        abort_unless(auth()->user()?->isTeacher(), 403, 'Teachers only.');
    }

    public function index()
    {
        $this->guardTeacher();

        return User::where('teacher_id', auth()->id())
            ->where('role', 'student')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'trilha', 'is_active', 'created_at']);
    }

    public function store(Request $request)
    {
        $this->guardTeacher();

        // Clean before validating so "min 8" counts the real password, not trailing spaces.
        $request->merge([
            'email'    => Credentials::email($request->input('email')),
            'password' => Credentials::password($request->input('password')),
        ]);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'trilha'   => ['required', Rule::in(['Lights', 'Glow', 'Radiant'])],
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        $student = new User();
        $student->name       = $data['name'];
        $student->email      = $data['email'];
        $student->password   = Hash::make($data['password']);
        $student->role       = 'student';
        $student->trilha     = $data['trilha'];
        $student->teacher_id = auth()->id();
        $student->is_active  = true;
        $student->save();

        return response()->json(
            $student->only(['id', 'name', 'email', 'trilha', 'is_active', 'created_at']),
            201,
        );
    }

    public function update(User $student, Request $request)
    {
        $this->guardTeacher();

        abort_unless(
            $student->role === 'student' && $student->teacher_id === auth()->id(),
            403,
            'Not your student.',
        );

        if ($request->has('password')) {
            $request->merge(['password' => Credentials::password($request->input('password'))]);
        }

        $data = $request->validate([
            'trilha'    => ['sometimes', Rule::in(['Lights', 'Glow', 'Radiant'])],
            'is_active' => ['sometimes', 'boolean'],
            'password'  => ['sometimes', 'string', 'min:8', 'max:100'],
        ]);

        if (array_key_exists('trilha', $data))    $student->trilha = $data['trilha'];
        if (array_key_exists('is_active', $data)) $student->is_active = $data['is_active'];
        if (array_key_exists('password', $data))  $student->password = Hash::make($data['password']);
        $student->save();

        return response()->json($student->only(['id', 'name', 'email', 'trilha', 'is_active', 'created_at']));
    }

    /**
     * Permanently remove one of this teacher's students, with their attempts, homework
     * assignments and login sessions (a phone that is signed in is signed out). The teacher's
     * activities are untouched. For "pause, keep the history" use is_active instead.
     *
     * DELETE /api/students/{student}
     */
    public function destroy(User $student)
    {
        $this->guardTeacher();
        $this->guardOwnStudent($student);

        DB::transaction(function () use ($student) {
            // Explicit rather than relying on the foreign keys' ON DELETE CASCADE.
            ActivityAttempt::where('student_id', $student->id)->delete();
            StudentAssignment::where('student_id', $student->id)->delete();
            if (Schema::hasTable('sessions')) {
                DB::table('sessions')->where('user_id', $student->id)->delete();
            }
            $student->delete();
        });

        return response()->json(['ok' => true]);
    }

    /**
     * One student's progress — per-lesson done/total + a recent-activity feed
     * (Phase S5). Same builder the student's own /api/student/progress uses.
     *
     * GET /api/students/{student}/progress
     */
    public function progress(User $student)
    {
        $this->guardTeacher();
        $this->guardOwnStudent($student);

        return response()->json(StudentProgressService::build($student));
    }

    /**
     * Record a "Use it!" speaking check the teacher ticked live in class (Aurora Lessons Phase 1, step 2):
     * which target-language items the student used during one speaking activity. Stored as an attempt
     * with `recorded_by` set — score = items used, max_score = items on the list — so it reaches the
     * progress screens without ever counting as the student's own (homework) practice.
     *
     * POST  /api/students/{student}/speaking-checks             { activity_id, targets: [{label, used}] }
     * PATCH /api/students/{student}/speaking-checks/{attempt}    { targets }   (more ticks later in the same lesson)
     */
    public function recordSpeaking(User $student, Request $request)
    {
        $this->guardTeacher();
        $this->guardOwnStudent($student);

        $data = $request->validate(['activity_id' => ['required', 'integer']] + $this->speakingTargetRules());

        $activity = Activity::where('id', $data['activity_id'])->where('user_id', auth()->id())->first();
        abort_unless($activity && in_array($activity->type, Activity::SPEAKING_CHECK_TYPES, true), 404);

        $attempt = ActivityAttempt::create($this->speakingCheckFields($data['targets']) + [
            'student_id'   => $student->id,
            'activity_id'  => $activity->id,
            'recorded_by'  => auth()->id(),
            'completed_at' => now(),
        ]);

        return response()->json(['id' => $attempt->id, 'used' => $attempt->score, 'total' => $attempt->max_score], 201);
    }

    public function updateSpeaking(User $student, ActivityAttempt $attempt, Request $request)
    {
        $this->guardTeacher();
        $this->guardOwnStudent($student);
        abort_unless($attempt->student_id === $student->id && $attempt->recorded_by === auth()->id(), 404);

        $data = $request->validate($this->speakingTargetRules());
        $attempt->update($this->speakingCheckFields($data['targets']) + ['completed_at' => now()]);

        return response()->json(['id' => $attempt->id, 'used' => $attempt->score, 'total' => $attempt->max_score]);
    }

    private function speakingTargetRules(): array
    {
        return [
            'targets'         => ['required', 'array', 'min:1', 'max:12'],
            'targets.*.label' => ['required', 'string', 'max:120'],
            'targets.*.used'  => ['required', 'boolean'],
        ];
    }

    private function speakingCheckFields(array $targets): array
    {
        $targets = array_map(fn ($t) => ['label' => trim($t['label']), 'used' => (bool) $t['used']], $targets);

        return [
            'score'     => count(array_filter($targets, fn ($t) => $t['used'])),
            'max_score' => count($targets),
            'answers'   => ['kind' => 'speaking_check', 'targets' => $targets],
        ];
    }

    /**
     * This student's assigned activities (Phase H2). Same builder the
     * student's own GET /api/student/homework uses.
     *
     * GET /api/students/{student}/assignments
     */
    public function assignments(User $student)
    {
        $this->guardTeacher();
        $this->guardOwnStudent($student);

        return response()->json(['homework' => StudentHomeworkService::build($student)]);
    }

    /**
     * Assign one of the teacher's own activities to this student, independent
     * of trilha — the mechanism a one-off activity (no trilha at all) uses to
     * reach a student for the first time. Re-assigning the same activity
     * updates the note instead of erroring (unique on student_id+activity_id).
     *
     * POST /api/students/{student}/assignments
     */
    public function assign(User $student, Request $request)
    {
        $this->guardTeacher();
        $this->guardOwnStudent($student);

        $data = $request->validate([
            'activity_id' => ['required', 'integer'],
            'note'        => ['nullable', 'string', 'max:255'],
        ]);

        // Only an activity this teacher actually owns can be handed to a
        // student — otherwise any teacher could assign any other teacher's
        // (or the shared Aurora trilha's) content by guessing an id.
        $activity = Activity::where('user_id', auth()->id())->findOrFail($data['activity_id']);

        $assignment = StudentAssignment::updateOrCreate(
            ['student_id' => $student->id, 'activity_id' => $activity->id],
            ['note' => $data['note'] ?? null],
        );

        return response()->json($assignment, 201);
    }

    /**
     * Unassign — the student loses access unless some other path (trilha)
     * still grants it. Their past attempts on it are untouched.
     *
     * DELETE /api/students/{student}/assignments/{assignment}
     */
    public function unassign(User $student, StudentAssignment $assignment)
    {
        $this->guardTeacher();
        $this->guardOwnStudent($student);

        abort_unless($assignment->student_id === $student->id, 404);

        $assignment->delete();

        return response()->json(['ok' => true]);
    }

    private function guardOwnStudent(User $student): void
    {
        abort_unless(
            $student->role === 'student' && $student->teacher_id === auth()->id(),
            403,
            'Not your student.',
        );
    }
}
