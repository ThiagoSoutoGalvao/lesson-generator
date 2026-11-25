<?php

namespace App\Services;

use App\Support\AnswerOptions;

/**
 * Makes one activity of a type from a source text: the Claude call, then the answer-key check and, for the two
 * photo formats, the photo-first step. Shared by /api/generate and the lesson builder (lessons:build, 2026-11-25).
 * Throws RuntimeException when Claude's result can't be used.
 */
class ActivityMaker
{
    public const TYPES = ['quiz', 'flashcards', 'unjumble', 'dialog_gap_fill', 'word_formation', 'true_false', 'mc_reading', 'odd_one_out', 'cloze', 'open_cloze', 'mc_cloze', 'read_complete', 'discussion_questions', 'sentence_transformation', 'error_correction', 'image_vocab_match', 'word_categorisation', 'match_pairs', 'signs_notices', 'picture_prompts', 'role_play', 'story_builder', 'debate', 'mini_presentation'];

    public function __construct(private ClaudeService $claude, private PhotoMatcher $photos) {}

    /** $userId: the login it's for, so the photo formats can skip photos it has already used. */
    public function make(string $type, string $source, string $prompt, ?string $level, bool $group = false, ?int $userId = null): array
    {
        $c = $this->claude;
        $activity = match ($type) {
            'quiz'                    => $c->generateQuiz($source, $prompt, $level),
            'flashcards'              => $c->generateFlashcards($source, $prompt, $level),
            'unjumble'                => $c->generateUnjumble($source, $prompt, $level),
            'dialog_gap_fill'         => $c->generateDialogGapFill($source, $prompt, $level),
            'word_formation'          => $c->generateWordFormation($source, $prompt, $level),
            'true_false'              => $c->generateTrueFalse($source, $prompt, $level, $group),
            'mc_reading'              => $c->generateMcReading($source, $prompt, $level, $group),
            'odd_one_out'             => $c->generateOddOneOut($source, $prompt, $level),
            'cloze'                   => $c->generateCloze($source, $prompt, $level),
            'open_cloze'              => $c->generateOpenCloze($source, $prompt, $level),
            'mc_cloze'                => $c->generateMcCloze($source, $prompt, $level),
            'read_complete'           => $c->generateReadComplete($source, $prompt, $level),
            'discussion_questions'    => $c->generateDiscussionQuestions($source, $prompt, $level),
            'sentence_transformation' => $c->generateSentenceTransformation($source, $prompt, $level),
            'error_correction'        => $c->generateErrorCorrection($source, $prompt, $level),
            'image_vocab_match'       => $c->generateImageVocabMatch($source, $prompt, $level),
            'word_categorisation'     => $c->generateWordCategorisation($source, $prompt, $level),
            'match_pairs'             => $c->generateMatchPairs($source, $prompt, $level),
            'signs_notices'           => $c->generateSignsNotices($source, $prompt, $level, $group),
            'picture_prompts'         => $c->generatePicturePrompts($source, $prompt, $level),
            'role_play'               => $c->generateRolePlay($source, $prompt, $level, $group),
            'story_builder'           => $c->generateStoryBuilder($source, $prompt, $level),
            'debate'                  => $c->generateDebate($source, $prompt, $level),
            'mini_presentation'       => $c->generateMiniPresentation($source, $prompt, $level),
        };
        // Check the answer key and spread the right answers across A / B / C / D.
        $activity = AnswerOptions::fix($type, $activity);
        // Photo first: Claude looks at real candidate photos and picks / rewrites for them.
        if ($type === 'picture_prompts') {
            $activity = $this->photos->avoidUsedBy($userId)->picturePrompts($activity, LanguageLevel::from($level)->cefr);
        } elseif ($type === 'image_vocab_match') {
            $activity = $this->photos->avoidUsedBy($userId)->imageVocabMatch($activity);
        }
        if (in_array($type, ['picture_prompts', 'image_vocab_match'], true) && $this->photos->limited) {
            // Better no activity than one whose photos weren't checked (2026-11-25).
            throw new \RuntimeException('The photo service has reached its hourly limit — please try this one again in an hour.');
        }
        return $activity;
    }

    /** The note added to a source so a lesson builds on the course's earlier lessons ("Build this lesson"). */
    public static function withEarlier(string $source, ?string $earlier): string
    {
        if (! filled($earlier)) {
            return $source;
        }
        return $source . "\n\nFor reference, what this course's earlier lessons covered:\n" . trim($earlier)
            . "\nWhere it fits naturally, recycle two or three words or structures from those lessons, "
            . "but don't repeat their examples, and keep the focus on this lesson's material.";
    }
}
