# ClaudeService — Sends document text and teacher prompts to the Claude AI API

## Overview

This is a Laravel service class that handles all communication with the Anthropic Claude API. It takes two inputs — extracted text from a PDF document and a natural language prompt from the teacher — combines them into a single message, and sends it to Claude via HTTP. The Claude API responds with AI-generated activity content (which will later be parsed into quizzes, flashcards, etc.).

A "service class" in Laravel is a helper class that encapsulates business logic and can be injected into controllers or other classes. By putting the Claude API call in its own service, we keep the code organised and make it easy to test or swap out the API later.

## File Location
`app/Services/ClaudeService.php`

## Dependencies & Imports

- `Illuminate\Support\Facades\Http` — Laravel's HTTP client, used to make POST requests to external APIs
- `RuntimeException` — A built-in PHP exception class, used to signal errors when the Claude API call fails

## Methods

### `generate(string $documentText, string $prompt): string`

**What it does:** Sends a request to the Claude API containing the extracted PDF text and the teacher's prompt, waits for Claude to respond, and returns the response as a plain text string.

**Parameters:**
- `$documentText` — The full text extracted from the uploaded PDF document (this is the "context" that Claude uses to generate answers). For example, a chapter or unit from a textbook.
- `$prompt` — The teacher's natural language instruction, like "Give me 5 quiz questions about vocabulary from this text". This describes what activity Claude should create.

**Returns:** A string containing Claude's response. In Phase 3, this is raw text (not yet parsed). Later phases will expect this to be structured JSON that can be converted into quiz questions, flashcards, or unjumble sentences.

**Side effects:**
- Makes an HTTPS POST request to `https://api.anthropic.com/v1/messages` (the Claude API endpoint)
- Throws a `RuntimeException` if the API request fails (e.g. bad API key, network error, rate limit, invalid parameters). The error message includes details from the API response.

**How it works (detailed):**

1. Reads the Claude API key from Laravel's config (`config('services.anthropic.key')`). This key must be set in the `.env` file as `ANTHROPIC_API_KEY`.
2. Makes a POST request to Claude's API with two headers:
   - `x-api-key`: The API key for authentication
   - `anthropic-version`: Tells Claude which API version to use (2023-06-01 is a stable older version)
3. In the request body, sends:
   - `model`: "claude-sonnet-4-6" — the AI model to use
   - `max_tokens`: 2048 — the maximum length of Claude's response
   - `messages`: An array with one user message combining the document text and the prompt
4. Checks if the response was successful; if not, throws an error
5. Extracts and returns the text from the response (Claude's answer)

## How It Fits Into the App

**ActivityController** calls this service when the teacher submits a generation request:
1. Teacher fills in the GeneratePage form (select a document + type a prompt)
2. Form is posted to `POST /api/generate`
3. ActivityController validates the form data
4. ActivityController calls `$claude->generate($documentText, $prompt)`
5. ClaudeService makes the API call and returns Claude's response
6. ActivityController sends the response back to the React frontend as JSON
7. GeneratePage displays the raw response (Phase 3) or a formatted activity (Phase 4+)

This service is the bridge between the Lesson Generator's backend and the Anthropic API. It is stateless — each call is independent and does not remember previous calls.
