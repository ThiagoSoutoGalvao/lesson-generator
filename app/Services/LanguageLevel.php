<?php

namespace App\Services;

/**
 * The CEFR level a teacher picks on /generate, as ClaudeService's prompt
 * builders need it.
 *
 * B1 is the default and reproduces, word for word, the prompts the app used
 * before the selector existed (they were hard-coded "B1-B2"), so leaving the
 * selector alone changes nothing. Every other level swaps the level wording,
 * scales the pinned passage lengths, and appends one LEVEL rule to the prompt.
 */
final class LanguageLevel
{
    private const TAIL = ' Apart from the specific language the task asks to practise, this level rule takes priority over any other level or difficulty mentioned above.';

    private function __construct(
        public readonly string $code,
        /** How prompts name the level: "B1-B2", "beginner (A1)". */
        public readonly string $cefr,
        /** The level for "natural English at ___ level". */
        public readonly string $top,
        /** "a B1-B2 student", with the right article. */
        public readonly string $student,
        /** Sentence length for Unjumble. */
        public readonly string $unjumbleWords,
        /** Passage length for Reading Comprehension. */
        public readonly string $readingWords,
        /** Multiplier for the other pinned passage lengths (see span()). */
        private readonly float $scale,
        /** One extra prompt rule, starting with a newline. Empty at B1. */
        public readonly string $rules,
    ) {}

    public static function from(?string $code): self
    {
        return match ($code) {
            'A1' => new self(
                'A1', 'beginner (A1)', 'A1', 'a beginner (A1) student', '3-6', '80 to 140', 0.65,
                "\n- LEVEL — beginner (A1): use only the most common everyday words and very short, simple sentences (mostly 3 to 8 words) in the present simple, \"to be\", \"can\" and simple imperatives; no idioms, phrasal verbs or abstract vocabulary. If a word is too hard for this level, replace it with an easier one." . self::TAIL,
            ),
            'A2' => new self(
                'A2', 'elementary (A2)', 'A2', 'an elementary (A2) student', '5-8', '140 to 240', 0.85,
                "\n- LEVEL — elementary (A2): use common everyday vocabulary and short sentences (mostly 5 to 10 words), mainly the present and past simple, \"going to\", comparatives and \"can\" / \"have to\"; almost no idioms, and only the most common phrasal verbs (such as \"get up\" or \"come back\")." . self::TAIL,
            ),
            'B2' => new self(
                'B2', 'B2-C1', 'C1', 'a B2-C1 student', '8-14', '300 to 450', 1.25,
                "\n- LEVEL — upper-intermediate to advanced (B2-C1): use natural, idiomatic English with a wide vocabulary — collocations, phrasal verbs and less common words — and complex sentences with subordinate clauses." . self::TAIL,
            ),
            default => new self('B1', 'B1-B2', 'B2', 'a B1-B2 student', '6-10', '220 to 380', 1.0, ''),
        };
    }

    /** One pinned length (e.g. the most words in a short text), scaled for the level (unchanged at B1). */
    public function scaled(int $n): int
    {
        if ($this->scale === 1.0) {
            return $n;
        }

        return max(5, (int) round($n * $this->scale / 5) * 5);
    }

    /** A "min-max" passage-length range, scaled for the level (unchanged at B1). */
    public function span(int $min, int $max, string $sep = '-'): string
    {
        if ($this->scale === 1.0) {
            return $min . $sep . $max;
        }

        $round = fn (float $n) => max(5, (int) (round($n / 5) * 5));

        return $round($min * $this->scale) . $sep . $round($max * $this->scale);
    }
}
