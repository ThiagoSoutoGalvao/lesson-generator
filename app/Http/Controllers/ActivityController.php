<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\ClaudeService;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function generate(Request $request, ClaudeService $claude)
    {
        $request->validate([
            'document_id' => ['required', 'exists:documents,id'],
            'prompt'      => ['required', 'string', 'max:1000'],
            'type'        => ['required', 'in:quiz,flashcards,unjumble'],
        ]);

        $document = Document::findOrFail($request->document_id);

        $activity = match ($request->type) {
            'quiz'       => $claude->generateQuiz($document->extracted_text, $request->prompt),
            'flashcards' => $claude->generateFlashcards($document->extracted_text, $request->prompt),
            'unjumble'   => $claude->generateUnjumble($document->extracted_text, $request->prompt),
        };

        return response()->json($activity);
    }
}
