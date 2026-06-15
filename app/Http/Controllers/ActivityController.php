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
            'type'         => ['required', 'in:quiz,flashcards,unjumble,dialog_gap_fill,word_formation,true_false,odd_one_out,cloze,discussion_questions,sentence_transformation,error_correction,grammar_explainer'],
            'page_from'    => ['nullable', 'integer', 'min:1'],
            'page_to'      => ['nullable', 'integer', 'min:1'],
            'section_focus' => ['nullable', 'string', 'in:Vocabulary,Grammar,Listening,Reading'],
        ]);

        $document = Document::where('id', $request->document_id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

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
                'word_formation'       => $claude->generateWordFormation($text, $prompt),
                'true_false'          => $claude->generateTrueFalse($text, $prompt),
                'odd_one_out'             => $claude->generateOddOneOut($text, $prompt),
                'cloze'                   => $claude->generateCloze($text, $prompt),
                'discussion_questions'     => $claude->generateDiscussionQuestions($text, $prompt),
                'sentence_transformation' => $claude->generateSentenceTransformation($text, $prompt),
                'error_correction'        => $claude->generateErrorCorrection($text, $prompt),
                'grammar_explainer'       => $claude->generateGrammarExplainer($text, $prompt),
            };
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json($activity);
    }

    public function generatePresentation(Request $request, ClaudeService $claude)
    {
        $request->validate([
            'topic'  => ['required', 'string', 'max:200'],
            'extra'  => ['nullable', 'string', 'max:3000'],
            'slides' => ['nullable', 'integer', 'min:4', 'max:10'],
        ]);

        try {
            $activity = $claude->generatePresentation(
                $request->topic,
                $request->input('extra', ''),
                (int) $request->input('slides', 6)
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json($activity);
    }
}
