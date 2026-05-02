# ClaudeService — Calls the Claude API to generate structured activity content

## Overview

This is a Laravel service class that handles all communication with the Anthropic Claude API. It provides type-specific methods (`generateQuiz()`, `generateFlashcards()`, and `generateUnjumble()`) that send document text and a teacher's prompt to Claude, with detailed instructions that constrain Claude to return structured JSON in a specific format. Each method builds a custom prompt (with a JSON schema), calls Claude's API, validates the response is valid JSON, and returns a PHP array containing the activity data.

A "service class" in Laravel is a helper class that encapsulates business logic and can be injected into controllers or other classes. By putting the Claude API calls in their own service, we keep the code organised and make it easy to add new activity types or modify the API communication.

## File Location
`app/Services/ClaudeService.php`

## Dependencies & Imports

- `Illuminate\Support\Facades\Http` — Laravel's HTTP client, used to make POST requests to the Claude API
- `RuntimeException` — A built-in PHP exception class, used to signal errors when the Claude API call fails or returns invalid JSON

## Methods

### `generate(string $documentText, string $prompt): string`

**What it does:** Sends a request to the Claude API with the extracted PDF text and the teacher's prompt, and returns Claude's response as a plain text string. This is a generic method used for free-form responses (not used in Phase 5).

**Parameters:**
- `$documentText` — The full text extracted from the uploaded PDF document
- `$prompt` — The teacher's natural language instruction

**Returns:** A string containing Claude's raw response text.

**Side effects:** Makes an HTTPS POST request to the Claude API. Throws a `RuntimeException` if the API call fails.

---

### `generateQuiz(string $documentText, string $prompt): array`

**What it does:** Generates a multiple choice quiz by sending a structured prompt to Claude that requires a specific JSON format. Parses Claude's response, validates it is valid JSON, and returns the activity data as a PHP array.

**Parameters:**
- `$documentText` — The full text extracted from the uploaded PDF document
- `$prompt` — The teacher's instruction, e.g. "Give me 5 multiple choice questions about travel vocabulary from this text"

**Returns:** A PHP array (decoded from JSON) with this structure:
```php
[
  "type" => "quiz",
  "topic" => "travel",
  "questions" => [
    [
      "question" => "What is...?",
      "keyword" => "airplane",
      "answers" => [
        ["text" => "...", "correct" => true],
        ["text" => "...", "correct" => false],
        ...
      ]
    ],
    ...
  ]
]
```

**Side effects:**
- Sanitizes the document text to remove invalid UTF-8 characters (using `sanitizeUtf8()`)
- Makes an HTTPS POST request to the Claude API
- Throws a `RuntimeException` if:
  - The API call fails (bad API key, network error, rate limit)
  - Claude returns invalid JSON (parsed as `null` by `json_decode()`)

**How it works:**

1. Cleans the document text using `sanitizeUtf8()` to remove any UTF-8 encoding issues
2. Calls `buildQuizPrompt()` to construct a detailed system prompt that includes the JSON schema Claude must follow
3. Makes a POST request to Claude's API with:
   - Model: "claude-sonnet-4-6"
   - Max tokens: 2048
   - System message: Instructions that Claude is a teaching assistant and must return only valid JSON
   - User message: The prompt built by `buildQuizPrompt()`
4. Extracts the text from Claude's response
5. Parses it as JSON using `json_decode(..., true)` (the `true` converts to a PHP array, not an object)
6. Checks for JSON errors; throws an exception if parsing failed
7. Returns the array

---

### `generateFlashcards(string $documentText, string $prompt): array`

**What it does:** Generates a flashcard deck by sending a structured prompt to Claude that requires a specific JSON format. Parses and validates the response, then returns the activity data as a PHP array.

**Parameters:**
- `$documentText` — The full text extracted from the uploaded PDF document
- `$prompt` — The teacher's instruction, e.g. "Create 8 flashcards for the key vocabulary words in this text"

**Returns:** A PHP array with this structure:
```php
[
  "type" => "flashcards",
  "topic" => "vocabulary",
  "cards" => [
    [
      "word" => "serendipity",
      "definition" => "the occurrence of good events by chance",
      "example" => "Meeting her there was pure serendipity.",
      "keyword" => "luck"
    ],
    ...
  ]
]
```

**Side effects:**
- Sanitizes the document text
- Makes an HTTPS POST request to the Claude API
- Throws a `RuntimeException` if the API fails or Claude returns invalid JSON

**How it works:** Same pattern as `generateQuiz()`:

1. Sanitizes the document text
2. Calls `buildFlashcardsPrompt()` to construct the system prompt with JSON schema
3. Makes the API request with the system and user messages
4. Parses the JSON response and validates it
5. Returns the array

---

### `generateUnjumble(string $documentText, string $prompt): array`

**What it does:** Generates an unjumble activity by sending a structured prompt to Claude that requires a specific JSON format. Parses and validates the response, then returns the activity data as a PHP array.

**Parameters:**
- `$documentText` — The full text extracted from the uploaded PDF document
- `$prompt` — The teacher's instruction, e.g. "Create 6 unjumble sentences about daily routines from this text"

**Returns:** A PHP array with this structure:
```php
[
  "type" => "unjumble",
  "topic" => "daily routines",
  "sentences" => [
    [
      "sentence" => "I wake up at seven o'clock every morning.",
      "words" => ["I", "wake", "up", "at", "seven", "o'clock", "every", "morning."],
      "keyword" => "alarm clock"
    ],
    ...
  ]
]
```

**Side effects:**
- Sanitizes the document text
- Makes an HTTPS POST request to the Claude API
- Throws a `RuntimeException` if the API fails or Claude returns invalid JSON

**How it works:** Same pattern as `generateQuiz()`:

1. Sanitizes the document text
2. Calls `buildUnjumblePrompt()` to construct the system prompt with JSON schema
3. Makes the API request with the system and user messages
4. Parses the JSON response and validates it
5. Returns the array

---

### Private Methods

#### `buildQuizPrompt(string $documentText, string $prompt): string`

**What it does:** Constructs a detailed multi-line prompt that tells Claude exactly what JSON structure to return for a quiz activity.

**Parameters:**
- `$documentText` — The extracted PDF text
- `$prompt` — The teacher's instruction

**Returns:** A string containing the formatted prompt. Includes the document text, the teacher's task, a JSON schema with detailed field descriptions, and rules (e.g. "Exactly one answer per question must be correct", "Randomise the position of the correct answer").

**Rules enforced by the prompt:**
- Each question must have exactly 4 answers
- Exactly one answer per question is correct
- The correct answer position is randomised
- Each question's keyword is a concrete visual term specific to that question

---

#### `buildFlashcardsPrompt(string $documentText, string $prompt): string`

**What it does:** Constructs a detailed multi-line prompt that tells Claude exactly what JSON structure to return for a flashcard activity.

**Parameters:**
- `$documentText` — The extracted PDF text
- `$prompt` — The teacher's instruction

**Returns:** A string containing the formatted prompt. Includes the document text, the teacher's task, a JSON schema, and rules (e.g. "Definitions must be simple for B1-B2 learners", "Example sentences must feel natural", "Each card's keyword must be visually distinct").

---

#### `buildUnjumblePrompt(string $documentText, string $prompt): string`

**What it does:** Constructs a detailed multi-line prompt that tells Claude exactly what JSON structure to return for an unjumble activity.

**Parameters:**
- `$documentText` — The extracted PDF text
- `$prompt` — The teacher's instruction

**Returns:** A string containing the formatted prompt. Includes the document text, the teacher's task, a JSON schema with field descriptions, and important rules about word order and punctuation.

**Key rules enforced by the prompt:**
- The "sentence" field is the complete, correct sentence as a string
- The "words" field is an array of individual words in the CORRECT ORDER — the frontend will shuffle them
- Each word must include attached punctuation (e.g. "morning." not "morning")
- Joining the words with spaces must exactly reproduce the sentence
- Sentences should be B1-B2 level, 6-10 words long
- Each sentence's keyword is a visually distinct image search term

---

#### `sanitizeUtf8(string $text): string`

**What it does:** Removes invalid UTF-8 characters from text, which can cause issues when sending to the Claude API.

**Parameters:**
- `$text` — A string that may contain broken UTF-8 encoding

**Returns:** A cleaned string with invalid UTF-8 sequences removed (or an empty string if all characters are invalid).

**How it works:** Uses PHP's `iconv()` function with the `UTF-8//IGNORE` parameter, which strips characters that cannot be decoded as UTF-8. This prevents `json_encode()` errors later.

## How It Fits Into the App

**ActivityController** calls these methods when the teacher submits a generation request:

1. Teacher selects a document, chooses activity type (quiz, flashcards, or unjumble), and types a prompt on GeneratePage
2. Teacher clicks "Generate"
3. GeneratePage calls `POST /api/generate` with document ID, prompt, and activity type
4. ActivityController validates and routes to this service:
   - If `type === 'quiz'`, calls `$this->generateQuiz()`
   - If `type === 'flashcards'`, calls `$this->generateFlashcards()`
   - If `type === 'unjumble'`, calls `$this->generateUnjumble()`
5. ClaudeService builds the prompt, calls the Claude API, parses the JSON response, and returns the activity array
6. ActivityController returns the array as JSON to the frontend
7. GeneratePage receives the JSON and mounts QuizActivity, FlashcardActivity, or UnjumbleActivity with the data

This service is the engine that powers activity generation. By separating type-specific prompts and parsing logic, it makes it easy to add new activity types in future phases.
