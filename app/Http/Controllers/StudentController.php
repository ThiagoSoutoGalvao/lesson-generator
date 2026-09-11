<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\StudentProgressService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'trilha'   => ['required', Rule::in(['Lights', 'Glow', 'Radiant'])],
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        $student = new User();
        $student->name       = $data['name'];
        $student->email      = strtolower(trim($data['email']));
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
     * One student's progress — per-lesson done/total + a recent-activity feed
     * (Phase S5). Same builder the student's own /api/student/progress uses.
     *
     * GET /api/students/{student}/progress
     */
    public function progress(User $student)
    {
        $this->guardTeacher();

        abort_unless(
            $student->role === 'student' && $student->teacher_id === auth()->id(),
            403,
            'Not your student.',
        );

        return response()->json(StudentProgressService::build($student));
    }
}
