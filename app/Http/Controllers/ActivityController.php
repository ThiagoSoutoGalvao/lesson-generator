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
            'type'         => ['required', 'in:quiz,flashcards,unjumble,dialog_gap_fill,word_categorisation,true_false,odd_one_out,cloze,discussion_questions,sentence_transformation'],
            'page_from'    => ['nullable', 'integer', 'min:1'],
            'page_to'      => ['nullable', 'integer', 'min:1'],
            'section_focus' => ['nullable', 'string', 'in:Vocabulary,Grammar,Listening,Reading'],
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

        $sectionFocus = $request->input('section_focus');
        $prompt = $sectionFocus
            ? "Focus specifically on the {$sectionFocus} section of this text. " . $request->prompt
            : $request->prompt;

        if (empty(trim($text))) {
            return response()->json([
                'message' => 'No text could be extracted from the selected pages. This PDF may be image-based or scanned. Try a different page range or upload a text-based PDF.',
            ], 422);
        }

        try {
            $activity = match ($request->type) {
                'quiz'                => $claude->generateQuiz($text, $prompt),
                'flashcards'          => $claude->generateFlashcards($text, $prompt),
                'unjumble'            => $claude->generateUnjumble($text, $prompt),
                'dialog_gap_fill'     => $claude->generateDialogGapFill($text, $prompt),
                'word_categorisation' => $claude->generateWordCategorisation($text, $prompt),
                'true_false'          => $claude->generateTrueFalse($text, $prompt),
                'odd_one_out'             => $claude->generateOddOneOut($text, $prompt),
                'cloze'                   => $claude->generateCloze($text, $prompt),
                'discussion_questions'     => $claude->generateDiscussionQuestions($text, $prompt),
                'sentence_transformation' => $claude->generateSentenceTransformation($text, $prompt),
            };
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json($activity);
    }
}
