<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class ClaudeService
{
    public function detectSections(string $documentText): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildDetectSectionsPrompt($documentText),
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

    private function buildDetectSectionsPrompt(string $documentText): string
    {
        return <<<EOT
Here is the text from a course book page range:

{$documentText}

Identify the distinct content sections in this text. Course books typically contain sections such as: Vocabulary, Grammar, Reading, Listening, Speaking, Pronunciation, Dialogue/Conversation, Writing, or topic-based activities.

Return a JSON array with EXACTLY this structure:
[
  {
    "name": "<short section name, e.g. 'Vocabulary', 'Grammar', 'Dialogue'>",
    "text": "<the complete verbatim text of this section, copied exactly from the source>"
  }
]

Rules:
- Only include sections that are genuinely identifiable — do not invent sections
- Each section's "text" must be copied verbatim from the source text
- If the text has no clear distinct sections, return a single entry: {"name": "Full page", "text": "<all the text>"}
- Aim for 2–6 sections — do not over-fragment
- Return ONLY the raw JSON array — no markdown backticks, no explanation
EOT;
    }

    public function generate(string $documentText, string $prompt): string
    {
        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
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
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
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
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
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
      "example2": "<a second natural example sentence using the word in a different context>",
      "keyword": "<3-5 word descriptive scene phrase that visually illustrates this word for an Unsplash search, e.g. 'chef cooking pasta kitchen' or 'person reading book library'>"
    }
  ]
}

Rules:
- Definitions must be simple and clear for B1-B2 English learners — avoid complex words in the definition itself
- Both example sentences should feel natural and contextual, not textbook-stiff; each should show the word used differently
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
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
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
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
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

    public function generateWordFormation(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildWordFormationPrompt($documentText, $prompt),
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

    private function buildWordFormationPrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "word_formation",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the topic>",
  "instruction": "Use the word in capitals to form a word that fits in the gap.",
  "items": [
    {
      "root": "<THE ROOT WORD IN CAPITALS>",
      "sentence": "<a sentence with ___ marking the gap where the formed word goes>",
      "answer": "<the correctly formed word that fills the gap>",
      "form": "<the word class of the answer, e.g. noun, verb, adjective, adverb>"
    }
  ]
}

Rules:
- Generate the number of items specified in the task above
- Each root word must come from key vocabulary in the text
- The answer must be a real derivative of the root: use prefixes, suffixes, or both (e.g. SUCCESS → successful, successfully, unsuccessful)
- The sentence must make the required word class clear from context — students should be able to work out the form from the grammar of the sentence
- Cover a variety of word classes across the items: nouns, verbs, adjectives, and adverbs
- Each root word must be different — do not reuse the same root
- The gap marked as ___ must have exactly one correct answer
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateOddOneOut(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildOddOneOutPrompt($documentText, $prompt),
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

    private function buildOddOneOutPrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "odd_one_out",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the vocabulary theme>",
  "groups": [
    {
      "words": ["<word1>", "<word2>", "<word3>", "<word4>"],
      "odd_one": "<the word that does not belong>",
      "reason": "<one clear sentence explaining why the odd word doesn't belong and what connects the other three>"
    }
  ]
}

Rules:
- Generate exactly 6 groups
- Each group must have exactly 4 words: 3 that share a clear connection and 1 odd one out
- The odd word must be clearly and unambiguously different — no borderline cases
- The reason must explain both why the odd word doesn't fit AND what connects the other three
- Words should be B1-B2 level English vocabulary from the text
- Vary the position of the odd word across groups — do not always put it last
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateCloze(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildClozePrompt($documentText, $prompt),
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

    private function buildClozePrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "cloze",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the topic>",
  "instruction": "<one short task instruction, e.g. 'Fill in the blanks using the words in the box.'>",
  "word_bank": ["<word>", "<word>", "<word>"],
  "parts": [
    { "text": "<text before first blank>" },
    { "blank": "<missing word>" },
    { "text": "<text between blanks>" },
    { "blank": "<missing word>" },
    { "text": "<remaining text>" }
  ]
}

Rules:
- The "parts" array alternates between text segments and blanks — every blank must be surrounded by text parts
- The "word_bank" array must contain exactly the same words as all the "blank" entries, in a different (shuffled) order
- Generate 6 to 8 blanks spread naturally across the passage
- The full passage (all text and blank values joined) should be 60–120 words
- Remove words that test key vocabulary or grammar — not trivial words like articles or prepositions
- Each blank should be clearly answerable from the surrounding context
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateDialogGapFill(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
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

    public function generateDiscussionQuestions(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildDiscussionQuestionsPrompt($documentText, $prompt),
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

    private function buildDiscussionQuestionsPrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "discussion_questions",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the topic, e.g. 'two people talking cafe table' or 'students discussing classroom group'>",
  "questions": [
    {
      "question": "<an open-ended discussion question>",
      "follow_ups": ["<a short follow-up prompt>", "<another follow-up prompt>"]
    }
  ]
}

Rules:
- Generate exactly 6 questions
- Questions must be genuinely open-ended — no yes/no questions
- Each question should invite students to share opinions, experiences, or ideas related to the text
- Each question must have exactly 2 follow-up prompts — short phrases to keep the conversation going (e.g. "Why do you think so?", "Can you give an example?", "Have you ever experienced this?")
- Questions should be B1-B2 level and feel natural in conversation, not academic
- Vary the type: some personal ("Have you ever…?"), some opinion ("Do you think…?"), some hypothetical ("What would you do if…?")
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateSentenceTransformation(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildSentenceTransformationPrompt($documentText, $prompt),
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

    private function buildSentenceTransformationPrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "sentence_transformation",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the topic>",
  "instruction": "Complete the second sentence so that it has a similar meaning to the first sentence, using the word given. Do not change the word given.",
  "items": [
    {
      "original": "<the first sentence>",
      "key_word": "<THE KEY WORD IN CAPITALS>",
      "stem": "<the beginning of the second sentence, up to and including the gap — end with '...' to show where students complete it>",
      "answer": "<the complete second sentence with the key word used correctly>"
    }
  ]
}

Rules:
- Generate exactly 6 items
- Each item tests a distinct grammar structure from the text: tense changes, passive voice, reported speech, modal verbs, conditionals, comparatives, or phrasal verbs
- The key word must appear in the answer and cannot be modified (no inflection changes)
- The "stem" gives students the start of the second sentence to anchor their answer — it should end naturally at the gap point, followed by "..."
- Both sentences must be natural English at B2 level
- Each item must test a different grammar point — do not repeat structures
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateErrorCorrection(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildErrorCorrectionPrompt($documentText, $prompt),
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

    private function buildErrorCorrectionPrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "error_correction",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the topic>",
  "instruction": "Each sentence contains one mistake. Find and correct it.",
  "items": [
    {
      "sentence": "<a sentence containing exactly one deliberate grammar or vocabulary error>",
      "error": "<the incorrect word or phrase as it appears in the sentence>",
      "correction": "<the correct word or phrase that replaces it>",
      "explanation": "<one clear sentence explaining the grammar rule or reason for the correction>"
    }
  ]
}

Rules:
- Generate the number of items requested in the task — typically 6–12
- Each sentence must contain EXACTLY one error — no more, no less
- Errors must be realistic mistakes that B1-B2 learners commonly make: wrong tense, subject-verb agreement, wrong preposition, incorrect article, wrong word form, or vocabulary confusion
- The "error" field must match the incorrect text exactly as it appears in the sentence
- The "correction" replaces only the erroneous part — the rest of the sentence stays the same
- Each item must test a different type of error — do not repeat error categories
- Sentences should feel natural and relate to topics from the text
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateGrammarExplainer(string $documentText, string $prompt): array
    {
        $documentText = $this->sanitizeUtf8($documentText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildGrammarExplainerPrompt($documentText, $prompt),
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

    private function buildGrammarExplainerPrompt(string $documentText, string $prompt): string
    {
        return <<<EOT
Here is the course book text:

{$documentText}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "grammar_explainer",
  "topic": "<the grammar topic, e.g. 'Present Perfect' or 'Modal Verbs'>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits a classroom or study context, e.g. 'student writing notes library'>",
  "slides": [
    {
      "title": "<short slide title, e.g. 'Positive Form' or 'When to Use It'>",
      "rule": "<clear explanation of the grammar rule — use **double asterisks** to bold key grammar terms or important words>",
      "form": "<optional: the grammatical formula, e.g. 'Subject + **have/has** + **past participle**' — use **double asterisks** to bold the key parts; omit this field if not applicable>",
      "examples": [
        "<a natural example sentence — use **double asterisks** to bold the grammar structure being illustrated>",
        "<another example sentence>"
      ],
      "color": "<one of: blue, purple, green, orange, teal, rose — assign a distinct color per slide>"
    }
  ]
}

Rules:
- Generate 4 to 6 slides — each covering a distinct aspect: form, usage, examples, common mistakes, comparison with similar structures, etc.
- Use **double asterisks** around key grammar terms in rules, forms, and examples — these render as colored bold text
- The "form" field is optional — include it for slides that show a grammatical formula, omit it for usage/meaning slides
- Each slide should have 2 to 3 example sentences
- Assign a different color to each slide — cycle through blue, purple, green, orange, teal, rose
- Keep explanations concise and student-friendly — B1-B2 level language
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
