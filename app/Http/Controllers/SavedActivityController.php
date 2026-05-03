<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;

class SavedActivityController extends Controller
{
    public function index()
    {
        return Activity::orderByDesc('created_at')->get();
    }

    public function folders()
    {
        return Activity::whereNotNull('folder')
            ->where('folder', '!=', '')
            ->distinct()
            ->orderBy('folder')
            ->pluck('folder');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'type'    => ['required', 'in:quiz,flashcards,unjumble,dialog_gap_fill,word_categorisation,true_false,image_vocab_match'],
            'content' => ['required', 'array'],
            'tags'    => ['nullable', 'string', 'max:255'],
            'folder'  => ['nullable', 'string', 'max:255'],
            'book'    => ['nullable', 'string', 'max:255'],
            'lesson'  => ['nullable', 'string', 'max:255'],
        ]);

        $activity = Activity::create($request->only('name', 'type', 'content', 'tags', 'folder', 'book', 'lesson'));

        return response()->json($activity, 201);
    }

    public function destroy(Activity $activity)
    {
        $activity->delete();
        return response()->json(['ok' => true]);
    }
}
