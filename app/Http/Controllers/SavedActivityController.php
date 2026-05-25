<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;

class SavedActivityController extends Controller
{
    public function index()
    {
        return Activity::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->get();
    }

    public function folders()
    {
        return Activity::where('user_id', auth()->id())
            ->whereNotNull('folder')
            ->where('folder', '!=', '')
            ->distinct()
            ->orderBy('folder')
            ->pluck('folder');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'type'    => ['required', 'in:quiz,flashcards,unjumble,dialog_gap_fill,word_categorisation,true_false,image_vocab_match,odd_one_out,cloze,discussion_questions,sentence_transformation,error_correction,grammar_explainer,word_formation,presentation'],
            'content' => ['required', 'array'],
            'tags'    => ['nullable', 'string', 'max:255'],
            'folder'  => ['nullable', 'string', 'max:255'],
            'book'    => ['nullable', 'string', 'max:255'],
            'lesson'  => ['nullable', 'string', 'max:255'],
        ]);

        $activity = Activity::create(array_merge(
            $request->only('name', 'type', 'content', 'tags', 'folder', 'book', 'lesson'),
            ['user_id' => auth()->id()]
        ));

        return response()->json($activity, 201);
    }

    public function destroy(Activity $activity)
    {
        abort_if($activity->user_id !== auth()->id(), 403);
        $activity->delete();
        return response()->json(['ok' => true]);
    }
}
