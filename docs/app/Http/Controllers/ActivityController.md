# ActivityController — Routes activity generation requests to the correct Claude method

## Overview

This is a Laravel controller that receives HTTP requests from the React frontend when the teacher submits an activity generation prompt. It validates the input (checking that a document exists, a prompt is provided, and an activity type is specified), retrieves the document's extracted text from the database, and calls the appropriate ClaudeService method (`generateQuiz`, `generateFlashcards`, or `generateUnjumble`) based on the requested activity type. The structured JSON response from Claude is returned directly to the frontend.

A "controller" in Laravel is a class that handles HTTP requests. It receives data from the frontend, performs business logic (or delegates to services), and sends back a response.

## File Location
`app/Http/Controllers/ActivityController.php`

## Dependencies & Imports

- `App\Models\Document` — The Document model, used to retrieve document records from the database
- `App\Services\ClaudeService` — The Claude API service class that generates quiz and flashcard content
- `Illuminate\Http\Request` — Laravel's request object, containing data from the HTTP request (form inputs, query parameters, etc.)

## Methods

### `generate(Request $request, ClaudeService $claude): JsonResponse`

**What it does:** Validates the incoming request, fetches the document's extracted text, and uses a PHP `match` statement to route to the correct generation method based on the activity type. Returns the structured activity JSON directly to the frontend.

**Parameters:**
- `$request` — The HTTP request object containing form data from the frontend. Must include:
  - `document_id` (required): The ID of the PDF document to use
  - `prompt` (required): The teacher's natural language instruction
  - `type` (required): One of "quiz", "flashcards", or "unjumble"
- `$claude` — An instance of ClaudeService, automatically injected by Laravel's dependency injection system. You do not pass this yourself; Laravel provides it.

**Returns:** A JSON response containing the complete activity data. The structure depends on the activity type:
- For quiz: `{ type: "quiz", topic: "...", questions: [...] }`
- For flashcards: `{ type: "flashcards", topic: "...", cards: [...] }`
- For unjumble: `{ type: "unjumble", topic: "...", sentences: [...] }`

**Side effects:**
- Validates the request (throws HTTP 422 if validation fails)
- Queries the database to fetch the Document record
- Makes an HTTPS request to the Claude API (via ClaudeService method)
- If Claude API fails, the exception bubbles up and Laravel returns a 500 error to the frontend

**Validation rules:**
- `document_id` — must be present, must exist in the `documents` table
- `prompt` — must be present, must be a string, max 1000 characters
- `type` — must be present, must be one of: "quiz", "flashcards", or "unjumble"

**How it works (step-by-step):**

1. Validates the request using Laravel's validation system. If any validation rule fails, an HTTP 422 response is returned with error details.
2. Retrieves the Document record from the database. If not found, throws 404 not found.
3. Uses a PHP `match` expression (a newer, cleaner version of `switch`) to route to the appropriate method:
   - If `type === 'quiz'`, calls `$claude->generateQuiz()`
   - If `type === 'flashcards'`, calls `$claude->generateFlashcards()`
   - If `type === 'unjumble'`, calls `$claude->generateUnjumble()`
4. Returns the generated activity array as JSON. The activity includes `type`, `topic`, and activity-specific content (`questions`, `cards`, or `sentences`) depending on the type.

## How It Fits Into the App

**GeneratePage.jsx** (the React component) calls this controller:
1. Teacher selects a document from the dropdown, chooses an activity type (quiz, flashcards, or unjumble), and types a prompt
2. Teacher clicks the "Generate" button
3. GeneratePage calls `POST /api/generate` via axios, sending the document ID, prompt, and activity type
4. ActivityController receives the request, validates it, and determines which ClaudeService method to call based on the `type` parameter
5. ActivityController returns the structured activity JSON to the frontend
6. GeneratePage receives the response and mounts the corresponding activity component (QuizActivity, FlashcardActivity, or UnjumbleActivity)

This controller is the routing hub for activity generation. It accepts a single POST endpoint that handles multiple activity types, keeping the API simple while delegating type-specific logic to ClaudeService.
