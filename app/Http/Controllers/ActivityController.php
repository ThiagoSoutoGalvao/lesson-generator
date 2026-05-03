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
            'page_from'   => ['nullable', 'integer', 'min:1'],
            'page_to'     => ['nullable', 'integer', 'min:1'],
        ]);

        $document = Document::findOrFail($request->document_id);

        $from = $request->input('page_from');
        $to   = $request->input('page_to');

        if ($from && $to && $document->pages_text) {
            $pages = array_slice(
                $document->pages_text,
                $from - 1,
                $to - $from + 1
            );
            $text = implode("\n\n", $pages);
        } else {
            $text = $document->extracted_text;
        }

        if (empty(trim($text))) {
            return response()->json([
                'message' => 'No text could be extracted from the selected pages. This PDF may be image-based or scanned. Try a different page range or upload a text-based PDF.',
            ], 422);
        }

        try {
            $activity = match ($request->type) {
                'quiz'       => $claude->generateQuiz($text, $request->prompt),
                'flashcards' => $claude->generateFlashcards($text, $request->prompt),
                'unjumble'   => $claude->generateUnjumble($text, $request->prompt),
            };
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json($activity);
    }
}
