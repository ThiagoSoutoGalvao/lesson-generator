<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class ClaudeService
{
    public function detectSections(string $source): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildDetectSectionsPrompt($source),
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

    private function buildDetectSectionsPrompt(string $source): string
    {
        return <<<EOT
Here is the text from a course book page range:

{$source}

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

    public function generate(string $source, string $prompt): string
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
                    'content' => "Here is the course book text:\n\n{$source}\n\n{$prompt}",
                ],
            ],
        ]);

        $this->throwIfFailed($response);

        return $response->json('content.0.text');
    }

    public function generateQuiz(string $source, string $prompt): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildQuizPrompt($source, $prompt),
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

    public function generateFlashcards(string $source, string $prompt): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildFlashcardsPrompt($source, $prompt),
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

    private function buildFlashcardsPrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "flashcards",
  "topic": "<1-2 word topic keyword in English for an image search, e.g. 'travel' or 'cooking'>",
  "cards": [
    {
      "word": "<vocabulary word or phrase>",
      "pronunciation": "<IPA transcription of the word, e.g. '/kəmˈpjuːtər/'>",
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
- Pronunciation must be standard IPA notation wrapped in forward slashes (broad/phonemic transcription, not narrow), using RP or General American consistently
- Each card's keyword must be a descriptive scene phrase (not just the word itself) and visually distinct from the others
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateUnjumble(string $source, string $prompt): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildUnjumblePrompt($source, $prompt),
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

    private function buildUnjumblePrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

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

    public function generateTrueFalse(string $source, string $prompt): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildTrueFalsePrompt($source, $prompt),
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

    private function buildTrueFalsePrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

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

    public function generateWordFormation(string $source, string $prompt): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildWordFormationPrompt($source, $prompt),
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

    private function buildWordFormationPrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

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

    public function generateOddOneOut(string $source, string $prompt): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildOddOneOutPrompt($source, $prompt),
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

    private function buildOddOneOutPrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

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

    public function generateCloze(string $source, string $prompt): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildClozePrompt($source, $prompt),
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

    private function buildClozePrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

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

    public function generateDialogGapFill(string $source, string $prompt): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildDialogGapFillPrompt($source, $prompt),
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

    private function buildDialogGapFillPrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

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

    public function generateDiscussionQuestions(string $source, string $prompt): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildDiscussionQuestionsPrompt($source, $prompt),
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

    private function buildDiscussionQuestionsPrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

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

    public function generateSentenceTransformation(string $source, string $prompt): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildSentenceTransformationPrompt($source, $prompt),
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

    private function buildSentenceTransformationPrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

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

    public function generateErrorCorrection(string $source, string $prompt): array
    {
        $source = $this->sanitizeUtf8($source);

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
                    'content' => $this->buildErrorCorrectionPrompt($source, $prompt),
                ],
            ],
        ]);

        $this->throwIfFailed($response);

        $text = $response->json('content.0.text');
        $data = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Claude returned invalid JSON: ' . $text);
        }

        $passage = is_string($data['passage'] ?? null) ? trim($data['passage']) : '';

        $data['items'] = array_values(array_filter($data['items'] ?? [], function ($item) use ($passage) {
            $sentence   = $item['sentence']   ?? '';
            $error      = $item['error']      ?? '';
            $correction = $item['correction'] ?? '';

            return $sentence !== ''
                && $error !== ''
                && $correction !== ''
                && $error !== $correction
                && str_contains($sentence, $error)
                // passage mode: the error must also be locatable in the passage itself,
                // since the frontend highlights it there
                && ($passage === '' || str_contains($passage, $error));
        }));

        if (empty($data['items'])) {
            throw new RuntimeException('Claude did not return any valid error-correction items — please try generating again.');
        }

        if ($passage === '') {
            unset($data['passage']);
        } else {
            $data['passage'] = $passage;
        }

        return $data;
    }

    private function buildErrorCorrectionPrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "error_correction",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the topic>",
  "instruction": "<task instruction for students — see the two modes below>",
  "passage": "<OPTIONAL. Include this field ONLY in passage mode. Omit it entirely in sentence mode.>",
  "items": [
    {
      "sentence": "<the sentence containing exactly one deliberate error — in passage mode, the exact sentence from the passage>",
      "error": "<the incorrect word or phrase as it appears in the sentence>",
      "correction": "<the correct word or phrase that replaces it>",
      "explanation": "<one clear sentence explaining the grammar rule or reason for the correction>"
    }
  ]
}

Two modes — choose based on the task:
- SENTENCE MODE (default): the task asks for separate sentences. OMIT the "passage"
  field. Each item is a standalone sentence. instruction: "Each sentence contains
  one mistake. Find and correct it."
- PASSAGE MODE: the task asks for a text, paragraph, story, or connected passage.
  Write a natural connected "passage" of 1 to 3 short paragraphs. Embed exactly one
  error per item into it. Each item's "sentence" must be the exact sentence from
  "passage" that contains that error (copied verbatim). Every "error" string must
  appear verbatim in "passage". instruction: e.g. "This text contains N mistakes.
  Find and correct each one." (use the real number).

Rules:
- Generate the number of items requested in the task — typically 6–12 (in passage mode, 5–8)
- Each sentence must contain EXACTLY one error — no more, no less
- Errors must be realistic mistakes that B1-B2 learners commonly make: wrong tense, subject-verb agreement, wrong preposition, incorrect article, wrong word form, or vocabulary confusion
- The "error" field must be copied character-for-character from the sentence — same spelling, spacing, and capitalization — since it is matched verbatim against the sentence text (and, in passage mode, against the passage text)
- The "correction" replaces only the erroneous part — the rest of the sentence stays the same
- Each item must test a different type of error — do not repeat error categories
- Sentences should feel natural and relate to the topic
- In passage mode, keep the passage coherent and readable — a real short text, not a list of unrelated sentences
- Before writing each item, first think of the fully correct sentence, then change exactly one word or phrase to create the error — never submit a sentence that is already grammatically correct with no real mistake in it
- After writing each item, verify: (1) the "error" text appears in the "sentence" text exactly as written (and in "passage" in passage mode), (2) "error" and "correction" are different, (3) replacing "error" with "correction" produces a natural, fully correct sentence — discard and rewrite any item that fails this check
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateOpenCloze(string $source, string $prompt): array
    {
        $data = $this->requestJson($this->buildOpenClozePrompt($this->sanitizeUtf8($source), $prompt));

        $data['parts'] = $this->cleanClozeParts($data['parts'] ?? [], false);
        if (! $this->hasBlank($data['parts'])) {
            throw new RuntimeException('Claude did not return any valid gaps — please try generating again.');
        }

        return $data;
    }

    private function buildOpenClozePrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "open_cloze",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the topic>",
  "instruction": "Read the text and think of the word that best fits each gap. Use only ONE word in each gap.",
  "parts": [
    { "text": "<text before the first gap>" },
    { "blank": "<the single word that fills this gap>" },
    { "text": "<text between gaps>" },
    { "blank": "<the single word>" },
    { "text": "<text after the last gap>" }
  ]
}

Rules:
- The "parts" array alternates text and gaps: every { "blank": ... } must sit between two { "text": ... } parts
- Joining all the text values and blank values in order must read as one natural, connected passage of 80-140 words
- Generate 6 to 10 gaps
- Each gap must be ONE common grammatical or functional word — articles, prepositions, auxiliary or modal verbs, pronouns, relative pronouns, conjunctions, quantifiers, or words in fixed phrases. NOT topic vocabulary (that would need a word bank)
- Each gap must have exactly one clearly correct answer a B1-B2 student can find from the surrounding context — never a gap where several different words work equally well
- Never put two gaps next to each other with no words between them
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateMcCloze(string $source, string $prompt): array
    {
        $data = $this->requestJson($this->buildMcClozePrompt($this->sanitizeUtf8($source), $prompt));

        $data['parts'] = $this->cleanClozeParts($data['parts'] ?? [], true);
        if (! $this->hasBlank($data['parts'])) {
            throw new RuntimeException('Claude did not return any valid gaps — please try generating again.');
        }

        return $data;
    }

    private function buildMcClozePrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "mc_cloze",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the topic>",
  "instruction": "For each gap, choose the word or phrase (A, B, C or D) that fits best.",
  "parts": [
    { "text": "<text before the first gap>" },
    { "blank": "<the correct option, copied verbatim from this gap's options>", "options": ["<option>", "<option>", "<option>", "<option>"] },
    { "text": "<text between gaps>" },
    { "blank": "...", "options": ["...", "...", "...", "..."] },
    { "text": "<text after the last gap>" }
  ]
}

Rules:
- The "parts" array alternates text and gaps: every gap object must sit between two { "text": ... } parts
- Joining all the text values and each gap's "blank" value in order must read as one natural, connected passage of 90-150 words
- Generate 6 to 10 gaps
- Each gap has EXACTLY 4 options; exactly one is correct and is repeated verbatim as "blank"
- The three wrong options must be the same part of speech and look plausible on a quick read — the gap should test collocation, phrasal verbs, easily-confused words, linking words, or fixed expressions, NOT basic meaning
- Options are single words or very short phrases (2 words maximum)
- Never put two gaps next to each other with no words between them
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    /**
     * Keep only well-formed cloze parts: { "text": string } or { "blank": string }.
     * When $mc, a blank also needs a non-trivial "options" list that contains the
     * answer (added if Claude left it out); options are de-duped and capped at 4.
     */
    private function cleanClozeParts(array $parts, bool $mc): array
    {
        $clean = [];
        foreach ($parts as $part) {
            if (isset($part['text']) && is_string($part['text'])) {
                $clean[] = ['text' => $part['text']];
                continue;
            }
            $blank = isset($part['blank']) && is_string($part['blank']) ? trim($part['blank']) : '';
            if ($blank === '') {
                continue;
            }
            if (! $mc) {
                $clean[] = ['blank' => $blank];
                continue;
            }
            $options = array_values(array_unique(array_filter(
                array_map(fn ($o) => is_string($o) ? trim($o) : '', $part['options'] ?? []),
                fn ($o) => $o !== '',
            )));
            if (! in_array($blank, $options, true)) {
                array_unshift($options, $blank);
            }
            if (count($options) < 2) {
                continue;
            }
            $clean[] = ['blank' => $blank, 'options' => array_slice($options, 0, 4)];
        }

        return array_values($clean);
    }

    private function hasBlank(array $parts): bool
    {
        foreach ($parts as $part) {
            if (isset($part['blank'])) {
                return true;
            }
        }

        return false;
    }

    /** Shared Claude JSON request used by the newer generators. */
    private function requestJson(string $content): array
    {
        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 4096,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                ['role' => 'user', 'content' => $content],
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

    public function generateReadingText(string $topic, string $vocabulary = '', int $paragraphs = 3, string $extra = ''): array
    {
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
                    'content' => $this->buildReadingTextPrompt($topic, $vocabulary, $paragraphs, $extra),
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

    private function buildReadingTextPrompt(string $topic, string $vocabulary, int $paragraphs, string $extra): string
    {
        $vocabSection = $vocabulary
            ? "\nTarget vocabulary to naturally include in the text: {$vocabulary}. Use every one of these words or phrases at least once, in natural context."
            : "\nSelect 6 to 10 useful vocabulary words or phrases from the text you write, to be listed as a glossary.";
        $extraSection = $extra ? "\nExtra instructions: {$extra}" : '';

        return <<<EOT
Write a reading text for B1-B2 English learners about the following topic: {$topic}{$vocabSection}{$extraSection}

Return a JSON object with EXACTLY this structure:
{
  "type": "reading_text",
  "topic": "<short topic name, 2-5 words>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the topic>",
  "paragraphs": [
    "<paragraph 1 text>",
    "<paragraph 2 text>"
  ],
  "vocabulary": [
    { "word": "<a target vocabulary word or phrase, exactly as it appears in the paragraphs above>", "definition": "<a clear, simple B1-B2 definition>" }
  ]
}

Rules:
- Generate EXACTLY {$paragraphs} paragraph(s) — do not generate more or fewer
- Each paragraph should be 3 to 6 sentences long and flow naturally as a coherent text, not a disconnected list of sentences
- The "word" field in each vocabulary entry MUST appear verbatim (same spelling, any capitalization) somewhere in the paragraphs text, so it can be highlighted
- Provide between 5 and 10 vocabulary entries total
- Definitions must be simple and clear for B1-B2 learners, avoiding complex words in the definition itself
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generatePresentation(string $topic, string $extra = '', int $slides = 6): array
    {
        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 6000,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildPresentationPrompt($topic, $extra, $slides),
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

    private function buildPresentationPrompt(string $topic, string $extra, int $slides): string
    {
        $extraSection = $extra ? "\nExtra instructions / examples from the book: {$extra}" : '';

        return <<<EOT
Create a classroom presentation about the following topic for B1-B2 English learners: {$topic}{$extraSection}

Return a JSON object with EXACTLY this structure:
{
  "type": "presentation",
  "topic": "<short topic name, 2-4 words>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits a classroom or study context, e.g. 'student writing notes library'>",
  "slides": [
    {
      "title": "<short slide title>",
      "rule": "<main content for this slide — use **double asterisks** to bold key terms or important words>",
      "form": "<optional: a formula, structure, or pattern — use **double asterisks** to bold key parts; omit this field entirely if not applicable>",
      "examples": [
        "<an example sentence or point — use **double asterisks** to bold key terms>",
        "<another example>"
      ],
      "color": "<one of: blue, purple, green, orange, teal, rose>"
    }
  ]
}

Rules:
- Generate EXACTLY {$slides} slides — structure them logically (e.g. introduction → key points → examples → common mistakes → summary); do not generate fewer
- Adapt naturally to any topic: grammar structures, vocabulary sets, exam strategies, reading skills, cultural topics, pronunciation, etc.
- Use **double asterisks** around key terms in rules, forms, and examples — these render as colored bold text
- The "form" field is optional — include it only when showing a formula, pattern, or structure
- Each slide should have 4 to 6 examples
- Assign a different color to each slide — cycle through blue, purple, green, orange, teal, rose
- Keep content concise and student-friendly — suitable for classroom display
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateEssayFeedback(string $essayText, string $studentName = '', string $extra = ''): array
    {
        $essayText = $this->sanitizeUtf8($essayText);

        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 6000,
            'system'     => 'You are an English language teaching assistant. Return ONLY valid JSON — no markdown code fences, no explanation, just raw JSON.',
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => $this->buildEssayFeedbackPrompt($essayText, $studentName, $extra),
                ],
            ],
        ]);

        $this->throwIfFailed($response);

        $text = $response->json('content.0.text');
        $data = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new RuntimeException('Claude returned invalid JSON: ' . $text);
        }

        $data['mistakes'] = array_values(array_filter($data['mistakes'] ?? [], function ($item) use ($essayText) {
            $original   = $item['original']   ?? '';
            $suggestion = $item['suggestion'] ?? '';

            return $original !== ''
                && $suggestion !== ''
                && $suggestion !== $original
                && str_contains($essayText, $original);
        }));

        $data['grammar_drills'] = array_values(array_filter($data['grammar_drills'] ?? [], function ($item) {
            $sentence   = $item['sentence']   ?? '';
            $error      = $item['error']      ?? '';
            $correction = $item['correction'] ?? '';

            return $sentence !== ''
                && $error !== ''
                && $correction !== ''
                && $error !== $correction
                && str_contains($sentence, $error);
        }));

        $data['essay_text'] = $essayText;

        return $data;
    }

    private function buildEssayFeedbackPrompt(string $essayText, string $studentName, string $extra): string
    {
        $nameSection  = $studentName ? "\nThe student's name is {$studentName}." : '';
        $extraSection = $extra ? "\nExtra instructions from the teacher: {$extra}" : '';

        return <<<EOT
Here is a student's essay:

{$essayText}
{$nameSection}{$extraSection}

Your task: prepare feedback content for a teacher to go through live, one point at a time, in a one-on-one lesson with this student. Keep the tone plain, warm, and non-technical overall — avoid grammar terminology (don't say "gerund", "subject-verb agreement", "article", "preposition", etc.). However, explanations for language mistakes must be strictly about the language itself: describe how English works or what sounds natural, and never address or refer to the student (no "you", "your", or mentioning what they wrote).

Return a JSON object with EXACTLY this structure:
{
  "type": "essay_feedback",
  "topic": "<a short 3-6 word description of what the essay is about>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image fitting a quiet writing/reflection mood, e.g. 'notebook pen desk sunlight'>",
  "mistakes": [
    {
      "original": "<the exact original sentence from the essay that could sound more natural, copied verbatim>",
      "suggestion": "<a complete rewrite of that same sentence that sounds natural and correct, keeping as close to the original meaning and wording as possible>",
      "explanation": "<one or two short sentences explaining, strictly about the language itself, why the suggested version sounds more natural — no grammar jargon, and never say 'you', 'your', or refer to the student>"
    }
  ],
  "grammar_drills": [
    {
      "sentence": "<a brand-new practice sentence, NOT copied from the essay, containing exactly one deliberate grammar mistake>",
      "error": "<the exact incorrect word or phrase, copied character-for-character from the sentence>",
      "correction": "<the corrected word or phrase>",
      "explanation": "<one short sentence explaining, strictly about the language itself, why the correction is right — no grammar jargon, and never say 'you', 'your', or refer to the student>"
    }
  ],
  "improvements": [
    {
      "suggestion": "<one concrete, actionable suggestion to strengthen the essay's content, structure, or argument>",
      "explanation": "<one plain sentence on why this would make the essay stronger>"
    }
  ]
}

Rules:
- Base "mistakes" ONLY on what is actually written in the essay above — never invent content that isn't there
- Find every sentence genuinely worth revising (grammar, word choice, false friends from other languages, awkward phrasing) — typically 5 to 10 — but never rewrite a sentence that is already natural and correct
- The "original" field must be copied character-for-character from the essay, since it is matched against the essay text verbatim
- The "suggestion" must be a complete, natural-sounding rewrite of the whole sentence — not just one swapped word — and must differ from "original"
- For "grammar_drills": first look at the grammar patterns (not vocabulary or false-friend confusions) behind the mistakes found above — things like verb form, word order, tense, or sentence structure — then write exactly 8 brand-new practice sentences, unrelated in wording to the essay itself, that drill those same grammar patterns so the student gets extra repetition on exactly what tripped them up. Each sentence contains exactly one deliberate grammar error, focused strictly on grammar, not vocabulary or spelling
- The "error" field in "grammar_drills" must be copied character-for-character from its "sentence" field, since it is matched against the sentence text verbatim
- Before writing each "grammar_drills" item, first think of the fully correct sentence, then change exactly one part to create the error — verify the "error" text appears in the sentence exactly as written and that "correction" is different from "error"
- Explanations for "mistakes" and "grammar_drills" describe only the language (e.g. "This is usually followed by..." or "In English, this idea is normally expressed as...") — never "you", "your", or any reference to the student or what they wrote
- Provide 2 to 4 "improvements" focused on argument, structure, or content — not grammar (grammar goes in "mistakes"/"grammar_drills")
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

    private function buildQuizPrompt(string $source, string $prompt): string
    {
        return <<<EOT
{$source}

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
