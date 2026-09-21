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

    public function generateQuiz(string $source, string $prompt, ?string $level = null): array
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
                    'content' => $this->buildQuizPrompt($source, $prompt, LanguageLevel::from($level)),
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

    public function generateFlashcards(string $source, string $prompt, ?string $level = null): array
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
                    'content' => $this->buildFlashcardsPrompt($source, $prompt, LanguageLevel::from($level)),
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

    private function buildFlashcardsPrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- Definitions must be simple and clear for {$lv->cefr} English learners — avoid complex words in the definition itself
- Both example sentences should feel natural and contextual, not textbook-stiff; each should show the word used differently
- Pronunciation must be standard IPA notation wrapped in forward slashes (broad/phonemic transcription, not narrow), using RP or General American consistently
- Each card's keyword must be a descriptive scene phrase (not just the word itself) and visually distinct from the others{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateUnjumble(string $source, string $prompt, ?string $level = null): array
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
                    'content' => $this->buildUnjumblePrompt($source, $prompt, LanguageLevel::from($level)),
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

    private function buildUnjumblePrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- Sentences should be {$lv->cefr} level English and {$lv->unjumbleWords} words long
- Each sentence's keyword must be a descriptive scene phrase and visually distinct from the others{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateTrueFalse(string $source, string $prompt, ?string $level = null): array
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
                    'content' => $this->buildTrueFalsePrompt($source, $prompt, LanguageLevel::from($level)),
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

    private function buildTrueFalsePrompt(string $source, string $prompt, LanguageLevel $lv): string
    {
        return <<<EOT
{$source}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "true_false",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the passage topic, e.g. 'students studying library books' or 'tourists exploring city map'>",
  "passage": "<the reading passage students will refer to — {$lv->span(80, 150, ' to ')} words, copied or lightly adapted from the text>",
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
- Statements should be full sentences, not questions{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateWordFormation(string $source, string $prompt, ?string $level = null): array
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
                    'content' => $this->buildWordFormationPrompt($source, $prompt, LanguageLevel::from($level)),
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

    private function buildWordFormationPrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- The gap marked as ___ must have exactly one correct answer{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateOddOneOut(string $source, string $prompt, ?string $level = null): array
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
                    'content' => $this->buildOddOneOutPrompt($source, $prompt, LanguageLevel::from($level)),
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

    private function buildOddOneOutPrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- Words should be {$lv->cefr} level English vocabulary from the text
- Vary the position of the odd word across groups — do not always put it last{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateCloze(string $source, string $prompt, ?string $level = null): array
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
                    'content' => $this->buildClozePrompt($source, $prompt, LanguageLevel::from($level)),
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

    private function buildClozePrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- The full passage (all text and blank values joined) should be {$lv->span(60, 120, '–')} words
- Remove words that test key vocabulary or grammar — not trivial words like articles or prepositions
- Each blank should be clearly answerable from the surrounding context{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateDialogGapFill(string $source, string $prompt, ?string $level = null): array
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
                    'content' => $this->buildDialogGapFillPrompt($source, $prompt, LanguageLevel::from($level)),
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

    private function buildDialogGapFillPrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- Dialogue must be {$lv->cefr} level English and feel natural, not textbook-stiff{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateDiscussionQuestions(string $source, string $prompt, ?string $level = null): array
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
                    'content' => $this->buildDiscussionQuestionsPrompt($source, $prompt, LanguageLevel::from($level)),
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

    private function buildDiscussionQuestionsPrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- Questions should be {$lv->cefr} level and feel natural in conversation, not academic
- Vary the type: some personal ("Have you ever…?"), some opinion ("Do you think…?"), some hypothetical ("What would you do if…?"){$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateSentenceTransformation(string $source, string $prompt, ?string $level = null): array
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
                    'content' => $this->buildSentenceTransformationPrompt($source, $prompt, LanguageLevel::from($level)),
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

    private function buildSentenceTransformationPrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- Generate the number of items requested in the task — 6 if none is given, never fewer than 3 or more than 20
- Each item tests a distinct grammar structure from the text: tense changes, passive voice, reported speech, modal verbs, conditionals, comparatives, or phrasal verbs
- The key word must appear in the answer and cannot be modified (no inflection changes)
- The "stem" gives students the start of the second sentence to anchor their answer — it should end naturally at the gap point, followed by "..."
- Both sentences must be natural English at {$lv->top} level
- Vary the grammar points as much as you can — repeat a structure only when there are more items than distinct structures that suit the level{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateErrorCorrection(string $source, string $prompt, ?string $level = null): array
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
                    'content' => $this->buildErrorCorrectionPrompt($source, $prompt, LanguageLevel::from($level)),
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

    private function buildErrorCorrectionPrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- Errors must be realistic mistakes that {$lv->cefr} learners commonly make: wrong tense, subject-verb agreement, wrong preposition, incorrect article, wrong word form, or vocabulary confusion
- The "error" field must be copied character-for-character from the sentence — same spelling, spacing, and capitalization — since it is matched verbatim against the sentence text (and, in passage mode, against the passage text)
- The "correction" replaces only the erroneous part — the rest of the sentence stays the same
- Each item must test a different type of error — do not repeat error categories
- Sentences should feel natural and relate to the topic
- In passage mode, keep the passage coherent and readable — a real short text, not a list of unrelated sentences
- Before writing each item, first think of the fully correct sentence, then change exactly one word or phrase to create the error — never submit a sentence that is already grammatically correct with no real mistake in it
- After writing each item, verify: (1) the "error" text appears in the "sentence" text exactly as written (and in "passage" in passage mode), (2) "error" and "correction" are different, (3) replacing "error" with "correction" produces a natural, fully correct sentence — discard and rewrite any item that fails this check{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateOpenCloze(string $source, string $prompt, ?string $level = null): array
    {
        $data = $this->requestJson($this->buildOpenClozePrompt($this->sanitizeUtf8($source), $prompt, LanguageLevel::from($level)));

        $data['parts'] = $this->cleanClozeParts($data['parts'] ?? [], false);
        if (! $this->hasBlank($data['parts'])) {
            throw new RuntimeException('Claude did not return any valid gaps — please try generating again.');
        }

        return $data;
    }

    private function buildOpenClozePrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- Joining all the text values and blank values in order must read as one natural, connected passage of {$lv->span(80, 140)} words
- Generate 6 to 10 gaps
- Each gap must be ONE common grammatical or functional word — articles, prepositions, auxiliary or modal verbs, pronouns, relative pronouns, conjunctions, quantifiers, or words in fixed phrases. NOT topic vocabulary (that would need a word bank)
- Each gap must have exactly one clearly correct answer {$lv->student} can find from the surrounding context — never a gap where several different words work equally well
- Never put two gaps next to each other with no words between them{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateMcCloze(string $source, string $prompt, ?string $level = null): array
    {
        $data = $this->requestJson($this->buildMcClozePrompt($this->sanitizeUtf8($source), $prompt, LanguageLevel::from($level)));

        $data['parts'] = $this->cleanClozeParts($data['parts'] ?? [], true);
        if (! $this->hasBlank($data['parts'])) {
            throw new RuntimeException('Claude did not return any valid gaps — please try generating again.');
        }

        return $data;
    }

    private function buildMcClozePrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- Joining all the text values and each gap's "blank" value in order must read as one natural, connected passage of {$lv->span(90, 150)} words
- Generate 6 to 10 gaps
- Each gap has EXACTLY 4 options; exactly one is correct and is repeated verbatim as "blank"
- The three wrong options must be the same part of speech and look plausible on a quick read — the gap should test collocation, phrasal verbs, easily-confused words, linking words, or fixed expressions, NOT basic meaning
- Options are single words or very short phrases (2 words maximum)
- Never put two gaps next to each other with no words between them{$lv->rules}
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
        return $this->hasBlankKey($parts, 'blank');
    }

    public function generateMcReading(string $source, string $prompt, ?string $level = null): array
    {
        $data = $this->requestJson($this->buildMcReadingPrompt($this->sanitizeUtf8($source), $prompt, LanguageLevel::from($level)));

        $data['questions'] = array_values(array_filter($data['questions'] ?? [], function ($q) {
            $text    = $q['text']    ?? '';
            $answer  = $q['answer']  ?? '';
            $options = array_values(array_filter($q['options'] ?? [], fn ($o) => is_string($o) && trim($o) !== ''));

            return is_string($text) && trim($text) !== ''
                && is_string($answer) && trim($answer) !== ''
                && count($options) >= 2
                && in_array($answer, $options, true);
        }));

        if (empty($data['questions']) || empty(trim($data['passage'] ?? ''))) {
            throw new RuntimeException('Claude did not return a valid reading passage with questions — please try again.');
        }

        return $data;
    }

    private function buildMcReadingPrompt(string $source, string $prompt, LanguageLevel $lv): string
    {
        return <<<EOT
{$source}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "mc_reading",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the passage topic>",
  "passage": "<the reading passage — {$lv->readingWords} words, written for {$lv->cefr} learners>",
  "questions": [
    {
      "text": "<a comprehension question about the passage>",
      "options": ["<option A>", "<option B>", "<option C>", "<option D>"],
      "answer": "<the correct option, copied verbatim from this question's options>",
      "explanation": "<one sentence explaining why, referencing the passage>"
    }
  ]
}

Rules:
- Generate exactly 6 questions
- Each question has EXACTLY 4 options; exactly one is correct and is repeated verbatim as "answer"
- Mix question types: main idea, specific detail, vocabulary in context, inference, and the writer's purpose or opinion
- Wrong options must be plausible and drawn from the passage's topic — not obviously silly
- The passage must actually contain (or clearly imply, for inference questions) the information each question tests{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateReadComplete(string $source, string $prompt, ?string $level = null): array
    {
        $data = $this->requestJson($this->buildReadCompletePrompt($this->sanitizeUtf8($source), $prompt, LanguageLevel::from($level)));

        $clean = [];
        foreach ($data['parts'] ?? [] as $part) {
            if (isset($part['text']) && is_string($part['text'])) {
                $clean[] = ['text' => $part['text']];
                continue;
            }
            $given  = isset($part['given'])  && is_string($part['given'])  ? trim($part['given'])  : '';
            $answer = isset($part['answer']) && is_string($part['answer']) ? trim($part['answer']) : '';
            // keep only well-formed gaps: a real prefix that's shorter than the whole word
            if ($given === '' || $answer === '' || mb_strlen($given) >= mb_strlen($answer)
                || mb_strtolower(mb_substr($answer, 0, mb_strlen($given))) !== mb_strtolower($given)) {
                continue;
            }
            $clean[] = ['given' => $given, 'answer' => $answer];
        }

        // Claude sometimes drops the space between a word and an adjacent gap
        // ("gets" + "dressed" -> "getsdressed"). Re-insert a separating space
        // wherever a plain-text part butts a gap letter-to-letter.
        $count = count($clean);
        foreach ($clean as $i => $part) {
            if (! isset($part['answer'])) {
                continue;
            }
            if ($i > 0 && isset($clean[$i - 1]['text'])) {
                $prev = $clean[$i - 1]['text'];
                if ($prev !== '' && ctype_alnum(mb_substr($prev, -1))) {
                    $clean[$i - 1]['text'] = $prev . ' ';
                }
            }
            if ($i + 1 < $count && isset($clean[$i + 1]['text'])) {
                $next = $clean[$i + 1]['text'];
                if ($next !== '' && ctype_alnum(mb_substr($next, 0, 1))) {
                    $clean[$i + 1]['text'] = ' ' . $next;
                }
            }
        }

        $data['parts'] = array_values($clean);

        if (! $this->hasBlankKey($data['parts'], 'answer')) {
            throw new RuntimeException('Claude did not return any valid gapped words — please try generating again.');
        }

        return $data;
    }

    private function buildReadCompletePrompt(string $source, string $prompt, LanguageLevel $lv): string
    {
        return <<<EOT
{$source}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "read_complete",
  "topic": "<short topic description>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the topic>",
  "instruction": "Complete each missing word. The first letters are given.",
  "parts": [
    { "text": "Every morning she quickly gets " },
    { "given": "dre", "answer": "dressed" },
    { "text": " and leaves the " },
    { "given": "hou", "answer": "house" },
    { "text": " by eight o'clock." }
  ]
}

Rules:
- Concatenating, in order, every "text" value and each gap's full "answer" with NOTHING added between them must reproduce the passage exactly — so each "text" part MUST include the spaces and punctuation that surround the gap (note the leading/trailing spaces in the example above)
- The passage must be one natural, connected passage of {$lv->span(60, 120)} words
- Gap 10 to 14 words across the passage
- "given" must be the exact first letters of "answer" (same spelling), and must be strictly shorter than "answer" — about half the letters, rounded up (e.g. "disc" for "discovery", "im" for "important", "wea" for "weather")
- Gap content words {$lv->student} can recover from context — nouns, verbs, adjectives, adverbs — not tiny function words
- Never gap two words in a row with no plain text between them{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    private function hasBlankKey(array $parts, string $key): bool
    {
        foreach ($parts as $part) {
            if (isset($part[$key])) {
                return true;
            }
        }

        return false;
    }

    public function generateImageVocabMatch(string $source, string $prompt, ?string $level = null): array
    {
        $data = $this->requestJson($this->buildImageVocabMatchPrompt($this->sanitizeUtf8($source), $prompt, LanguageLevel::from($level)));

        // Keep only complete pairs, each word once — a repeated word would make two
        // pictures match the same tile, which the screen can't tell apart.
        $pairs = [];
        $seen  = [];
        foreach ($data['pairs'] ?? [] as $pair) {
            $word    = trim((string) ($pair['word'] ?? ''));
            $keyword = trim((string) ($pair['keyword'] ?? ''));
            if ($word === '' || $keyword === '' || isset($seen[mb_strtolower($word)])) {
                continue;
            }
            $seen[mb_strtolower($word)] = true;
            $pairs[] = ['word' => $word, 'keyword' => $keyword];
        }

        if (count($pairs) < 3) {
            throw new RuntimeException('Claude did not return enough word and picture pairs — please try generating again.');
        }

        $data['type']  = 'image_vocab_match';
        $data['pairs'] = array_slice($pairs, 0, 8);

        return $data;
    }

    private function buildImageVocabMatchPrompt(string $source, string $prompt, LanguageLevel $lv): string
    {
        return <<<EOT
{$source}

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
- Generate the number of pairs requested in the task — 6 if none is given, never fewer than 4 or more than 8
- Each word must be a concrete noun or short noun phrase that a photograph can show clearly (a job, an object, a place, a food, an item of clothing) — nothing abstract
- Each keyword must be a vivid, descriptive scene or image (3-5 words) — not just the word itself — so Unsplash returns a recognisable, relevant photo
- Keywords must be visually distinct from each other — no two pairs should produce similar-looking images
- Words should be {$lv->cefr} level vocabulary relevant to the topic
- Each word must appear only once{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateWordCategorisation(string $source, string $prompt, ?string $level = null): array
    {
        $data = $this->requestJson($this->buildWordCategorisationPrompt($this->sanitizeUtf8($source), $prompt, LanguageLevel::from($level)));

        // The screen places a word by its text, so a word in two categories (or an
        // empty or one-sided task) can't be scored — refuse it rather than ship it.
        $categories = [];
        $seen       = [];
        foreach ($data['categories'] ?? [] as $category) {
            $name  = trim((string) ($category['name'] ?? ''));
            $words = [];
            foreach ($category['words'] ?? [] as $word) {
                $word = trim((string) $word);
                if ($word === '') {
                    continue;
                }
                if (isset($seen[mb_strtolower($word)])) {
                    throw new RuntimeException('Claude put the same word in two categories — please try generating again.');
                }
                $seen[mb_strtolower($word)] = true;
                $words[] = $word;
            }
            if ($name !== '' && count($words) >= 3) {
                $categories[] = ['name' => $name, 'words' => $words];
            }
        }

        if (count($categories) < 2) {
            throw new RuntimeException('Claude did not return at least two usable categories — please try generating again.');
        }

        $data['type']       = 'word_categorisation';
        $data['categories'] = array_slice($categories, 0, 3);

        return $data;
    }

    private function buildWordCategorisationPrompt(string $source, string $prompt, LanguageLevel $lv): string
    {
        return <<<EOT
{$source}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "word_categorisation",
  "topic": "<short description of the categorisation task, e.g. 'Food or drink?'>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the vocabulary theme, e.g. 'street market colourful vegetables' or 'cafe table coffee cake'>",
  "categories": [
    {
      "name": "<category name>",
      "words": ["<word>", "<word>", "<word>", "<word>", "<word>"]
    },
    {
      "name": "<category name>",
      "words": ["<word>", "<word>", "<word>", "<word>", "<word>"]
    }
  ]
}

Rules:
- Use 2 or 3 categories (never more)
- Each category must have between 4 and 6 words — 5 if the task gives no number
- All categories must have the same number of words
- Words must be clearly and unambiguously correct for their category — no borderline cases
- No word may appear in more than one category
- Words should be single words or short phrases (max 3 words)
- Words should be {$lv->cefr} level vocabulary
- Suitable categories: food / drink, clothes / things you carry, jobs / places, positive / negative adjectives, Formal / Informal, Countable / Uncountable, Verb / Noun / Adjective, or topic-based groupings — choose ones that fit the level and the task{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateMatchPairs(string $source, string $prompt, ?string $level = null): array
    {
        $data = $this->requestJson($this->buildMatchPairsPrompt($this->sanitizeUtf8($source), $prompt, LanguageLevel::from($level)));

        // A pair is only usable if both halves are unique: a repeated right-hand item
        // would have two possible partners and the screen could not score the match.
        $pairs     = [];
        $seenLeft  = [];
        $seenRight = [];
        foreach ($data['pairs'] ?? [] as $pair) {
            $left  = trim((string) ($pair['left'] ?? ''));
            $right = trim((string) ($pair['right'] ?? ''));
            if ($left === '' || $right === '' || isset($seenLeft[mb_strtolower($left)]) || isset($seenRight[mb_strtolower($right)])) {
                continue;
            }
            $seenLeft[mb_strtolower($left)]   = true;
            $seenRight[mb_strtolower($right)] = true;
            $pairs[] = ['left' => $left, 'right' => $right];
        }

        if (count($pairs) < 4) {
            throw new RuntimeException('Claude did not return enough matching pairs — please try generating again.');
        }

        $data['type']  = 'match_pairs';
        $data['pairs'] = array_slice($pairs, 0, 8);

        return $data;
    }

    private function buildMatchPairsPrompt(string $source, string $prompt, LanguageLevel $lv): string
    {
        return <<<EOT
{$source}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "match_pairs",
  "topic": "<short description of what is being matched, e.g. 'Countries and nationalities'>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image that fits the topic, e.g. 'world map travel desk'>",
  "pairs": [
    { "left": "<the item shown on the left>", "right": "<its one partner, shown on the right>" }
  ]
}

Rules:
- Generate the number of pairs requested in the task — 6 if none is given, never fewer than 4 or more than 8
- Every left item has exactly ONE correct partner on the right, and no right item could reasonably match a different left item
- All left items are the same kind of thing and all right items are the same kind of thing (for example digits and number words, countries and nationalities, words and short definitions, words and their opposites, base verbs and past forms)
- Keep every item short — a word or a short phrase of at most 6 words; a definition must be simple and use easier words than the word it defines
- No item may appear twice, on either side
- Words should be {$lv->cefr} level{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generateSignsNotices(string $source, string $prompt, ?string $level = null): array
    {
        $data = $this->requestJson($this->buildSignsNoticesPrompt($this->sanitizeUtf8($source), $prompt, LanguageLevel::from($level)));

        // Keep only items with a text, a question, three distinct options and an answer
        // that points at one of them — anything else can't be marked.
        $items = [];
        foreach ($data['items'] ?? [] as $item) {
            $text     = trim((string) ($item['text'] ?? ''));
            $question = trim((string) ($item['question'] ?? ''));
            $options  = array_values(array_map(fn ($o) => trim((string) $o), (array) ($item['options'] ?? [])));
            $answer   = is_numeric($item['answer'] ?? null) ? (int) $item['answer'] : null; // "1" counts as 1

            if ($text === '' || $question === '' || count($options) !== 3 || in_array('', $options, true)
                || count(array_unique(array_map('mb_strtolower', $options))) !== 3
                || $answer === null || $answer < 0 || $answer > 2) {
                continue;
            }

            $kind    = in_array($item['kind'] ?? '', ['sign', 'notice', 'message'], true) ? $item['kind'] : 'notice';
            $items[] = ['kind' => $kind, 'text' => $text, 'question' => $question, 'options' => $options, 'answer' => $answer];
        }

        if (count($items) < 3) {
            throw new RuntimeException('Claude did not return enough usable texts — please try generating again.');
        }

        $data['type']  = 'signs_notices';
        $data['items'] = array_slice($items, 0, 8);

        return $data;
    }

    private function buildSignsNoticesPrompt(string $source, string $prompt, LanguageLevel $lv): string
    {
        return <<<EOT
{$source}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "signs_notices",
  "topic": "<short description, e.g. 'Signs and notices around town'>",
  "keyword": "<3-5 word descriptive scene phrase for an Unsplash background image, e.g. 'busy city street shops'>",
  "items": [
    {
      "kind": "<'sign', 'notice' or 'message'>",
      "text": "<the text exactly as the student reads it>",
      "question": "<one easy question about it, e.g. 'Where would you see this?' or 'What does it mean?'>",
      "options": ["<option A>", "<option B>", "<option C>"],
      "answer": <0, 1 or 2 — the index of the correct option>
    }
  ]
}

Rules:
- Generate the number of items requested in the task — 5 if none is given, never fewer than 3 or more than 8
- Use real-life texts: a "sign" is a short public sign (NO PARKING, WET FLOOR, OPEN 9-5), a "notice" is a short notice on a wall or door (opening times, a cancelled class, a rule), a "message" is a short text message or note between two people. Mix the three kinds
- Each text is no more than {$lv->scaled(40)} words and must make sense without any picture
- Every question has exactly 3 options and exactly ONE is correct; the two wrong options must be clearly wrong but plausible; vary which position holds the correct answer
- Keep the questions simple and direct (where would you see this, what does it mean, what must you do, who is it from)
- Use invented names, shops and places — never real brands{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }

    public function generatePicturePrompts(string $source, string $prompt, ?string $level = null): array
    {
        $lv   = LanguageLevel::from($level);
        $data = $this->requestJson($this->buildPicturePromptsPrompt($this->sanitizeUtf8($source), $prompt, $lv));

        $prompts = [];
        foreach ($data['prompts'] ?? [] as $item) {
            $keyword  = trim((string) ($item['keyword'] ?? ''));
            $question = trim((string) ($item['question'] ?? ''));
            if ($keyword === '' || $question === '') {
                continue;
            }

            // Students over-use "I can see…"; the opener bank exists to move them past it,
            // so a starter that begins that way is dropped even if Claude ignored the rule.
            $starters = [];
            foreach ((array) ($item['starters'] ?? []) as $starter) {
                $starter = trim((string) $starter);
                if ($starter !== '' && ! preg_match('/^i\s+(can\s+)?see\b/i', $starter)) {
                    $starters[] = $starter;
                }
            }

            $prompts[] = ['keyword' => $keyword, 'question' => $question, 'starters' => array_slice($starters, 0, 3)];
        }

        if (count($prompts) < 2) {
            throw new RuntimeException('Claude did not return enough picture prompts — please try generating again.');
        }

        $data['type']    = 'picture_prompts';
        $data['level']   = $lv->code; // the screen shows the opener bank for this level
        $data['prompts'] = array_slice($prompts, 0, 6);

        return $data;
    }

    private function buildPicturePromptsPrompt(string $source, string $prompt, LanguageLevel $lv): string
    {
        return <<<EOT
{$source}

Task: {$prompt}

Return a JSON object with EXACTLY this structure:
{
  "type": "picture_prompts",
  "topic": "<short topic, e.g. 'A day at the beach'>",
  "prompts": [
    {
      "keyword": "<3-6 word Unsplash search phrase for a photo that shows people doing something in a clear setting, e.g. 'family picnic park sunny day' or 'friends cooking dinner kitchen'>",
      "question": "<one open question that gets the student describing the photo, e.g. 'What is happening in this picture?'>",
      "starters": ["<a natural opening the student can finish, ending in …>", "<another>", "<a third>"]
    }
  ]
}

Rules:
- Generate the number of prompts requested in the task — 4 if none is given, never fewer than 2 or more than 6
- Each keyword must describe a photo with people, an activity and a clear setting, so a stock-photo search returns something there is plenty to talk about — a different scene for every prompt
- The question is short and open (what / who / where), never yes/no
- Each starter is a natural way to begin a sentence about the photo and ends with "…" (for example "It looks like they are …" or "In the background, there is …")
- NEVER use "I can see" or "I see" in a starter — students over-use it, so give them different ways in
- Vary the starters within a prompt: one about what is happening, one about the setting or objects, one giving a guess or an opinion
- Starters must be {$lv->cefr} level language{$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
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

    private function buildQuizPrompt(string $source, string $prompt, LanguageLevel $lv): string
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
- When a question has multiple blanks and an answer fills more than one blank, separate the parts with " / " (e.g. "has / left", "will / be going"){$lv->rules}
- Return ONLY the raw JSON object — no markdown backticks, no explanation
EOT;
    }
}
