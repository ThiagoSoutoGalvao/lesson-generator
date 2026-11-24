<?php

namespace App\Http\Controllers;

use App\Services\LessonDrafter;
use App\Support\Trilhas;
use Illuminate\Http\Request;

/**
 * "Build this lesson", step 2 (2026-11-25): when a lesson has no reading or presentation yet, Claude drafts the
 * two prompts (the Reading Text and Presentation form fields) for the teacher to check and edit. The work is in
 * App\Services\LessonDrafter (shared with lessons:build). Aurora Business courses only. Nothing is saved here.
 */
class LessonDraftController extends Controller
{
    public function draft(Request $request, LessonDrafter $drafter)
    {
        $request->validate([
            'trilha'   => ['required', Trilhas::rule()],
            'lesson'   => ['required', 'integer', 'min:1', 'max:30'],
            'part'     => ['nullable', 'in:A,B,C'],
            'syllabus' => ['nullable', 'string', 'max:1000'],
            'earlier'  => ['nullable', 'string', 'max:1500'],
        ]);
        if (! isset(LessonDrafter::BUSINESS[$request->trilha])) {
            return response()->json(['message' => 'Drafting the reading and presentation is for Aurora Business courses.'], 422);
        }

        try {
            return response()->json($drafter->draft(
                auth()->id(), $request->trilha, (int) $request->lesson, $request->input('part') ?? 'A',
                (string) $request->input('syllabus', ''), $request->input('earlier'),
            ));
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
    }
}
