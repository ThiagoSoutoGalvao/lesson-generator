# ActivityController — Handles activity generation requests from the frontend

## Overview

This is a Laravel controller that receives HTTP requests from the React frontend when the teacher submits a generation prompt. It validates the input (checking that a document exists and the prompt is not empty), retrieves the document's extracted text from the database, calls the ClaudeService to generate activity content via the Claude API, and returns the response to the frontend as JSON.

A "controller" in Laravel is a class that handles HTTP requests. It receives data from the frontend, performs business logic (or delegates to services), and sends back a response.

## File Location
`app/Http/Controllers/ActivityController.php`

## Dependencies & Imports

- `App\Models\Document` — The Document model, used to retrieve document records from the database
- `App\Services\ClaudeService` — The Claude API service class that generates activity content
- `Illuminate\Http\Request` — Laravel's request object, containing data from the HTTP request (form inputs, query parameters, etc.)

## Methods

### `generate(Request $request, ClaudeService $claude): JsonResponse`

**What it does:** Validates the incoming request, fetches the document's extracted text from the database, asks the ClaudeService to generate activity content, and returns the response as JSON.

**Parameters:**
- `$request` — The HTTP request object containing the form data from the frontend. Should include:
  - `document_id` (required): The ID of the PDF document to use
  - `prompt` (required): The teacher's natural language instruction
- `$claude` — An instance of ClaudeService, automatically injected by Laravel's dependency injection system. You do not pass this yourself; Laravel provides it.

**Returns:** A JSON response object. On success, the JSON body looks like:
```json
{
  "response": "Claude's generated content here..."
}
```

**Side effects:**
- Validates the request (throws HTTP 422 if validation fails)
- Queries the database to fetch the Document record
- Makes an HTTPS request to the Claude API (via ClaudeService)
- If Claude API fails, the exception bubbles up and Laravel returns a 500 error to the frontend

**Validation rules:**
- `document_id` must be present, must be a number, and must exist in the `documents` table (checked with the `exists:documents,id` rule)
- `prompt` must be present, must be a string, and must not exceed 1000 characters

**How it works (step-by-step):**

1. Validates the incoming request using Laravel's validation system. If any rule fails, it throws an exception and sends a 422 response with error messages.
2. Retrieves the Document record from the database using `Document::findOrFail($request->document_id)`. If the document doesn't exist, this throws an exception (404 not found).
3. Extracts the `extracted_text` field from the document (this was populated during PDF upload in Phase 2).
4. Calls `$claude->generate()` with the document text and the teacher's prompt, getting back Claude's response as a string.
5. Wraps the response in a JSON object with a `response` key and sends it back to the frontend.

## How It Fits Into the App

**GeneratePage.jsx** (the React component) calls this controller:
1. Teacher selects a document from the dropdown and types a prompt
2. Teacher clicks the "Generate" button
3. GeneratePage calls `POST /api/generate` via axios, sending the document ID and prompt
4. ActivityController receives the request, validates it, and processes it
5. ActivityController returns the Claude-generated content as JSON
6. GeneratePage displays the response (raw in Phase 3, or formatted in Phase 4+)

This controller is the entry point for activity generation. Later phases will extend it to handle different activity types (quiz, flashcard, unjumble) and possibly add save/load functionality.
