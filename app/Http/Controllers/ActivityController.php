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
            'document_id' => ['nullable', 'exists:documents,id'],
            'topic'       => ['nullable', 'string', 'max:200'],
            'source_text' => ['nullable', 'string', 'max:8000'],
            'prompt'      => ['required', 'string', 'max:1000'],
            'type'        => ['required', 'in:quiz,flashcards,unjumble,dialog_gap_fill,word_formation,true_false,mc_reading,odd_one_out,cloze,open_cloze,mc_cloze,read_complete,discussion_questions,sentence_transformation,error_correction'],
            'page_from'   => ['nullable', 'integer', 'min:1'],
            'page_to'     => ['nullable', 'integer', 'min:1'],
        ]);

        $provided = collect(['document_id', 'topic', 'source_text'])
            ->filter(fn ($key) => filled($request->input($key)))
            ->values();

        if ($provided->count() !== 1) {
            return response()->json([
                'message' => 'Provide exactly one source: a document, a topic, or a block of text.',
            ], 422);
        }

        if ($request->filled('document_id')) {
            $document = Document::where('id', $request->document_id)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            $from = $request->input('page_from');
            $to   = $request->input('page_to');

            if ($from && $to && $document->pages_text) {
                $pages = array_slice($document->pages_text, $from - 1, $to - $from + 1);
                $text = implode("\n\n", $pages);
            } else {
                $text = $document->extracted_text;
            }

            if (empty(trim((string) $text))) {
                return response()->json([
                    'message' => 'No text could be extracted from the selected pages. This PDF may be image-based or scanned. Try a different page range or upload a text-based PDF.',
                ], 422);
            }

            $source = "Here is the course book text:\n\n{$text}";
        } elseif ($request->filled('topic')) {
            $topic  = trim($request->input('topic'));
            $source = "The activity should be about this topic: {$topic}\n\n"
                . "Invent suitable, level-appropriate example content about this topic to base the activity on.";
        } else {
            $sourceText = trim($request->input('source_text'));
            $source = "Here is the text to base the activity on:\n\n{$sourceText}";
        }

        $prompt = $request->prompt;

        try {
            $activity = match ($request->type) {
                'quiz'                    => $claude->generateQuiz($source, $prompt),
                'flashcards'              => $claude->generateFlashcards($source, $prompt),
                'unjumble'                => $claude->generateUnjumble($source, $prompt),
                'dialog_gap_fill'         => $claude->generateDialogGapFill($source, $prompt),
                'word_formation'          => $claude->generateWordFormation($source, $prompt),
                'true_false'              => $claude->generateTrueFalse($source, $prompt),
                'mc_reading'              => $claude->generateMcReading($source, $prompt),
                'odd_one_out'             => $claude->generateOddOneOut($source, $prompt),
                'cloze'                   => $claude->generateCloze($source, $prompt),
                'open_cloze'              => $claude->generateOpenCloze($source, $prompt),
                'mc_cloze'                => $claude->generateMcCloze($source, $prompt),
                'read_complete'           => $claude->generateReadComplete($source, $prompt),
                'discussion_questions'    => $claude->generateDiscussionQuestions($source, $prompt),
                'sentence_transformation' => $claude->generateSentenceTransformation($source, $prompt),
                'error_correction'        => $claude->generateErrorCorrection($source, $prompt),
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

    public function generateReadingText(Request $request, ClaudeService $claude)
    {
        $request->validate([
            'topic'      => ['required', 'string', 'max:200'],
            'vocabulary' => ['nullable', 'string', 'max:500'],
            'paragraphs' => ['nullable', 'integer', 'min:1', 'max:8'],
            'extra'      => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $activity = $claude->generateReadingText(
                $request->topic,
                $request->input('vocabulary', ''),
                (int) $request->input('paragraphs', 3),
                $request->input('extra', '')
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json($activity);
    }

    public function generateEssayFeedback(Request $request, ClaudeService $claude)
    {
        $request->validate([
            'essay_text'   => ['required', 'string', 'max:8000'],
            'student_name' => ['nullable', 'string', 'max:100'],
            'extra'        => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $activity = $claude->generateEssayFeedback(
                $request->essay_text,
                $request->input('student_name', ''),
                $request->input('extra', '')
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json($activity);
    }
}
