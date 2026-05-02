<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class ClaudeService
{
    public function generate(string $documentText, string $prompt): string
    {
        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 2048,
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => "Here is the course book text:\n\n{$documentText}\n\n{$prompt}",
                ],
            ],
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Claude API error: ' . $response->body());
        }

        return $response->json('content.0.text');
    }

    public function generateQuiz(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 2048,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildQuizPrompt($documentText, $prompt),
                ],
            ],
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Claude API error: ' . $response->body());
        }

        $text = $response->json('content.0.text');
        $data = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Claude returned invalid JSON: ' . $text);
        }

        return $data;
    }

    public function generateFlashcards(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 2048,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildFlashcardsPrompt($documentText, $prompt),
                ],
            ],
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Claude API error: ' . $response->body());
        }

        $text = $response->json('content.0.text');
        $data = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Claude returned invalid JSON: ' . $text);
        }

        return $data;
    }

    private function buildFlashcardsPrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "flashcards",
  "topic": "<1-2 word topic keyword in English for an image search, e.g. 'travel' or 'cooking'>",
  "cards": [
    {
      "word": "<vocabulary word or phrase>",
      "definition": "<clear, student-friendly definition>",
      "example": "<a natural example sentence using the word in context>",
      "keyword": "<1-2 word visual image search term specific to this word>"
    }
  ]
}

Rules:
- Definitions must be simple and clear for B1-B2 English learners — avoid complex words in the definition itself
- Example sentences should feel natural and contextual, not textbook-stiff
- Each card's keyword must be visually distinct from the others (different image per card)
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateUnjumble(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 2048,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildUnjumblePrompt($documentText, $prompt),
                ],
            ],
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Claude API error: ' . $response->body());
        }

        $text = $response->json('content.0.text');
        $data = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Claude returned invalid JSON: ' . $text);
        }

        return $data;
    }

    private function buildUnjumblePrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "unjumble",
  "topic": "<1-2 word topic keyword in English for an image search>",
  "sentences": [
    {
      "sentence": "<the complete correct sentence as a string>",
      "words": ["<word1>", "<word2>", "<word3>"],
      "keyword": "<1-2 word visual image search term specific to this sentence>"
    }
  ]
}

Rules:
- "sentence" is the full correct sentence
- "words" is the sentence split into individual words IN THE CORRECT ORDER — the app will shuffle them
- Each word in "words" must include any attached punctuation (e.g. "morning." not "morning")
- Joining all "words" with a single space must reproduce "sentence" exactly
- Sentences should be B1-B2 level English and 6-10 words long
- Each sentence's keyword must be visually distinct from the others
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    private function sanitizeUtf8(string $text): string
    {
        $clean = iconv('UTF-8', 'UTF-8//IGNORE', $text);
        return $clean !== false ? $clean : '';
    }

    private function buildQuizPrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "quiz",
  "topic": "<1-2 word topic keyword in English for an image search, e.g. 'travel' or 'cooking'>",
  "questions": [
    {
      "question": "<question text>",
      "keyword": "<1-2 word visual image search term specific to this question, e.g. 'airport' or 'suitcase'>",
      "answers": [
        { "text": "<answer text>", "correct": true },
        { "text": "<answer text>", "correct": false },
        { "text": "<answer text>", "correct": false },
        { "text": "<answer text>", "correct": false }
      ]
    }
  ]
}

Rules:
- Each question must have exactly 4 answers
- Exactly one answer per question must have "correct": true; the rest must have "correct": false
- Randomise the position of the correct answer — do not always place it first
- Each question's keyword must be a concrete visual noun or phrase that represents the specific question content, different from the other questions' keywords
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }
}
