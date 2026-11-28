<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WritingSubmission;
use Illuminate\Http\Request;

/**
 * Cambridge Writing exam mode (2026-11-28). The student hands in both parts; the teacher reads them on the Students
 * page and corrects them live in class. Nothing here marks or rewrites the text.
 */
class WritingSubmissionController extends Controller
{
    /** POST /api/student/writing — the signed-in student hands in an exam. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'exam'                => ['required', 'in:b2-first'],
            'parts'               => ['required', 'array', 'min:1', 'max:2'],
            'parts.*.part'        => ['required', 'integer', 'in:1,2'],
            'parts.*.task_id'     => ['required', 'string', 'max:60'],
            'parts.*.genre'       => ['required', 'string', 'max:40'],
            'parts.*.prompt'      => ['required', 'string', 'max:2000'],
            'parts.*.text'        => ['present', 'nullable', 'string', 'max:8000'],
            'seconds_used'        => ['nullable', 'integer', 'min:0', 'max:36000'],
            'timed_out'           => ['nullable', 'boolean'],
        ]);

        $parts = array_map(function (array $p) {
            $text = (string) ($p['text'] ?? '');
            return [
                'part'    => (int) $p['part'],
                'task_id' => $p['task_id'],
                'genre'   => $p['genre'],
                'prompt'  => $p['prompt'],
                'text'    => $text,
                'words'   => self::words($text),
            ];
        }, $data['parts']);

        $s = WritingSubmission::create([
            'student_id'   => $request->user()->id,
            'exam'         => $data['exam'],
            'parts'        => $parts,
            'seconds_used' => $data['seconds_used'] ?? null,
            'timed_out'    => (bool) ($data['timed_out'] ?? false),
        ]);

        return response()->json(['id' => $s->id], 201);
    }

    /** GET /api/students/{student}/writing — the teacher's own student's handed-in exams, newest first. */
    public function index(User $student)
    {
        abort_unless(auth()->user()?->isTeacher(), 403, 'Teachers only.');
        abort_unless($student->role === 'student' && $student->teacher_id === auth()->id(), 403, 'Not your student.');

        return response()->json([
            'writing' => WritingSubmission::where('student_id', $student->id)->latest()->limit(50)
                ->get(['id', 'exam', 'parts', 'seconds_used', 'timed_out', 'created_at']),
        ]);
    }

    /** Words as a student would count them: anything between spaces that has a letter or digit. */
    public static function words(string $text): int
    {
        return count(array_filter(preg_split('/\s+/u', trim($text)) ?: [], fn ($w) => preg_match('/[\p{L}\p{N}]/u', $w)));
    }
}
