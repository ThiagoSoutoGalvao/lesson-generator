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
            'document_id'  => ['required', 'exists:documents,id'],
            'prompt'       => ['required', 'string', 'max:1000'],
            'type'         => ['required', 'in:quiz,flashcards,unjumble,dialog_gap_fill,word_categorisation,true_false,image_vocab_match'],
            'page_from'    => ['nullable', 'integer', 'min:1'],
            'page_to'      => ['nullable', 'integer', 'min:1'],
            'pair_count'   => ['nullable', 'integer', 'in:4,6,8,12'],
            'section_text' => ['nullable', 'string'],
        ]);

        $document = Document::findOrFail($request->document_id);

        if ($request->filled('section_text')) {
            $text = $request->section_text;
        } else {
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
        }

        if (empty(trim($text))) {
            return response()->json([
                'message' => 'No text could be extracted from the selected pages. This PDF may be image-based or scanned. Try a different page range or upload a text-based PDF.',
            ], 422);
        }

        try {
            $activity = match ($request->type) {
                'quiz'            => $claude->generateQuiz($text, $request->prompt),
                'flashcards'      => $claude->generateFlashcards($text, $request->prompt),
                'unjumble'        => $claude->generateUnjumble($text, $request->prompt),
                'dialog_gap_fill'      => $claude->generateDialogGapFill($text, $request->prompt),
                'word_categorisation'  => $claude->generateWordCategorisation($text, $request->prompt),
                'true_false'           => $claude->generateTrueFalse($text, $request->prompt),
                'image_vocab_match'    => $claude->generateImageVocabMatch($text, $request->prompt, (int) ($request->pair_count ?? 6)),
            };
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json($activity);
    }
}
