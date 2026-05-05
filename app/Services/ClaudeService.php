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

        $this->throwIfFailed($response);

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

        $this->throwIfFailed($response);

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

        $this->throwIfFailed($response);

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
      "keyword": "<3-5 word descriptive scene phrase that visually illustrates this word for an Unsplash search, e.g. 'chef cooking pasta kitchen' or 'person reading book library'>"
    }
  ]
}

Rules:
- Definitions must be simple and clear for B1-B2 English learners — avoid complex words in the definition itself
- Example sentences should feel natural and contextual, not textbook-stiff
- Each card's keyword must be a descriptive scene phrase (not just the word itself) and visually distinct from the others
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

        $this->throwIfFailed($response);

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
      "keyword": "<3-5 word descriptive scene phrase that visually represents this sentence for an Unsplash search, e.g. 'friends laughing coffee shop' or 'student studying desk lamp'>"
    }
  ]
}

Rules:
- "sentence" is the full correct sentence
- "words" is the sentence split into individual words IN THE CORRECT ORDER — the app will shuffle them
- Each word in "words" must include any attached punctuation (e.g. "morning." not "morning")
- Joining all "words" with a single space must reproduce "sentence" exactly
- Sentences should be B1-B2 level English and 6-10 words long
- Each sentence's keyword must be a descriptive scene phrase and visually distinct from the others
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateTrueFalse(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 1024,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildTrueFalsePrompt($documentText, $prompt),
                ],
            ],
        ]);

        $this->throwIfFailed($response);

        $text = $response->json('content.0.text');
        $data = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Claude returned invalid JSON: ' . $text);
        }

        return $data;
    }

    private function buildTrueFalsePrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "true_false",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the passage topic, e.g. 'students studying library books' or 'tourists exploring city map'>",
  "passage": "<the reading passage students will refer to — 80 to 150 words, copied or lightly adapted from the text>",
  "statements": [
    {
      "text": "<a statement about the passage>",
      "answer": "True",
      "explanation": "<one sentence explaining why, quoting or referencing the passage>"
    },
    {
      "text": "<a statement about the passage>",
      "answer": "False",
      "explanation": "<one sentence explaining why, quoting or referencing the passage>"
    },
    {
      "text": "<a statement about the passage>",
      "answer": "Not Given",
      "explanation": "<one sentence explaining that this information does not appear in the passage>"
    }
  ]
}

Rules:
- Generate exactly 6 statements
- Distribute answers roughly evenly: 2 True, 2 False, 2 Not Given — but vary the order
- "True" means the passage clearly supports the statement
- "False" means the passage clearly contradicts the statement
- "Not Given" means the passage neither confirms nor contradicts it — the information is simply absent
- Statements must be unambiguous — no borderline True/False cases
- Not Given statements must be genuinely absent from the passage, not just implied
- Statements should be full sentences, not questions
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateWordCategorisation(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 1024,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildWordCategorisationPrompt($documentText, $prompt),
                ],
            ],
        ]);

        $this->throwIfFailed($response);

        $text = $response->json('content.0.text');
        $data = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Claude returned invalid JSON: ' . $text);
        }

        return $data;
    }

    private function buildWordCategorisationPrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "word_categorisation",
  "topic": "<short description of the categorisation task, e.g. 'Formal vs Informal'>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the vocabulary theme, e.g. 'office workers formal meeting' or 'street market colourful vegetables'>",
  "categories": [
    {
      "name": "<category name>",
      "words": ["<word>", "<word>", "<word>", "<word>"]
    },
    {
      "name": "<category name>",
      "words": ["<word>", "<word>", "<word>", "<word>"]
    }
  ]
}

Rules:
- Use 2 or 3 categories (never more)
- Each category must have between 4 and 6 words
- All categories must have the same number of words
- Words must be clearly and unambiguously correct for their category — no borderline cases
- Words should be single words or short phrases (max 3 words)
- Suitable categories: Formal/Informal, Countable/Uncountable, Past Simple/Present Perfect, Positive/Negative, Verb/Noun/Adjective, or topic-based groupings
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateImageVocabMatch(string $documentText, string $prompt, int $pairCount = 6): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 1024,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildImageVocabMatchPrompt($documentText, $prompt, $pairCount),
                ],
            ],
        ]);

        $this->throwIfFailed($response);

        $text = $response->json('content.0.text');
        $data = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Claude returned invalid JSON: ' . $text);
        }

        return $data;
    }

    private function buildImageVocabMatchPrompt(string $documentText, string $prompt, int $pairCount = 6): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "image_vocab_match",
  "topic": "<short topic description, e.g. 'hotel vocabulary'>",
  "pairs": [
    {
      "word": "<vocabulary word or short phrase>",
      "keyword": "<3-5 word descriptive Unsplash search phrase that visually illustrates this word, e.g. 'woman drinking coffee cafe' or 'person climbing mountain summit'>"
    }
  ]
}

Rules:
- Generate exactly {$pairCount} pairs
- Each word must be a concrete noun or short noun phrase that can be represented by a photograph
- Each keyword must be a vivid, descriptive scene or image (3-5 words) — not just the word itself — so Unsplash returns a recognisable, relevant photo
- Keywords must be visually distinct from each other — no two pairs should produce similar-looking images
- Words should be B1-B2 level vocabulary relevant to the topic from the text
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateDialogGapFill(string $documentText, string $prompt): array
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
                    'content' => $this->buildDialogGapFillPrompt($documentText, $prompt),
                ],
            ],
        ]);

        $this->throwIfFailed($response);

        $text = $response->json('content.0.text');
        $data = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Claude returned invalid JSON: ' . $text);
        }

        return $data;
    }

    private function buildDialogGapFillPrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "dialog_gap_fill",
  "topic": "<short scene description, e.g. 'hotel check-in' or 'doctor's appointment'>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the dialog setting, e.g. 'hotel lobby reception desk' or 'doctor patient clinic consultation'>",
  "dialog": [
    {
      "speaker": "<speaker name, e.g. 'Agent' or 'Customer'>",
      "line": "<the spoken line>",
      "blank": false
    },
    {
      "speaker": "<speaker name>",
      "line": "<the correct spoken line>",
      "blank": true,
      "options": [
        { "text": "<correct line>", "correct": true },
        { "text": "<plausible wrong option>", "correct": false },
        { "text": "<plausible wrong option>", "correct": false }
      ]
    }
  ]
}

Rules:
- The dialog must have between 8 and 14 lines total
- Mark exactly 3 lines as blank: true — spread them throughout the dialog, not bunched at the end
- Each blank must have exactly 3 options (one correct, two wrong)
- Wrong options must be grammatically correct and plausible in the context, but clearly not the best fit
- The "line" field on a blank item always contains the correct answer text
- Non-blank lines have no "options" field
- Use only two speakers throughout the dialog
- Dialogue must be B1-B2 level English and feel natural, not textbook-stiff
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    private function throwIfFailed($response): void
    {
        if (! $response->failed()) return;

        $type = $response->json('error.type') ?? '';

        $message = match ($type) {
            'rate_limit_error'       => 'Rate limit reached. Please wait a moment and try again.',
            'authentication_error'   => 'Invalid Claude API key. Check your ANTHROPIC_API_KEY in .env.',
            'overloaded_error'       => 'Claude is currently overloaded. Please try again in a few seconds.',
            'invalid_request_error'  => 'The request was too large. Try selecting a smaller page range.',
            default                  => 'Claude API error. Please try again.',
        };

        throw new RuntimeException($message);
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
  "instruction": "<one short task instruction for students, e.g. 'Choose the correct answer.' or 'Choose the correct word to complete the sentence.' — written once here, NOT repeated inside any question>",
  "questions": [
    {
      "question": "<question or sentence text only — never include the instruction here>",
      "keyword": "<3-5 word descriptive scene phrase for an Unsplash background specific to this question, e.g. 'traveller pulling suitcase airport' or 'chef plating dish restaurant'>",
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
- The "instruction" field must contain the task instruction once — do NOT include it inside the "question" field of any question
- When a question has multiple blanks and an answer fills more than one blank, separate the parts with " / " (e.g. "has / left", "will / be going")
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }
}
