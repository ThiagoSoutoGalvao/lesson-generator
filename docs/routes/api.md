# API Routes — Defines the HTTP endpoints for document operations

## Overview

This file defines all the HTTP routes for the Lesson Generator's API. In Laravel, routes are URL endpoints that trigger specific controller methods when called.

This Phase 3 version defines three routes: two for document upload/retrieval (Phase 2) and one new route for activity generation via the Claude API. As the project grows (Phases 4–8), more routes will be added here for parsing activities, saving, and display.

## File Location
`routes/api.php`

## Routes Defined

All routes in this file are automatically prefixed with `/api/` by Laravel. So the actual full URLs are `/api/documents` and `/api/documents`, not just `/documents`.

### GET /api/documents

**What it does:** Returns a list of all documents the teacher has uploaded.

**Handler:** `DocumentController@index`

**Returns:** JSON array of documents (see DocumentController documentation for details)

**Example request:**
```
GET /api/documents
```

**Example response:**
```json
[
  {
    "id": 1,
    "original_name": "Speak Out Unit 1.pdf",
    "created_at": "2026-04-30T10:30:00.000000Z"
  },
  {
    "id": 2,
    "original_name": "Speak Out Unit 2.pdf",
    "created_at": "2026-04-30T11:45:00.000000Z"
  }
]
```

### POST /api/documents

**What it does:** Uploads a new PDF file, extracts its text, and saves it to the database.

**Handler:** `DocumentController@store`

**Request format:** `multipart/form-data` with a file field named `pdf`

**Parameters:**
- `pdf` — The PDF file to upload (required, must be a PDF, max 50 MB)

**Returns:** JSON object with upload summary (see DocumentController documentation for details)

**Example request (using axios, as in UploadPage.jsx):**
```javascript
const form = new FormData();
form.append('pdf', file);
axios.post('/api/documents', form, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

**Example response (201 Created):**
```json
{
  "id": 3,
  "original_name": "Speak Out Unit 3.pdf",
  "preview": "Unit 3: The Story of Tom and Elena. Tom is an architect from London. He loves to travel...",
  "char_count": 45230
}
```

### POST /api/generate

**What it does:** Receives a document ID and a natural language prompt from the teacher, sends the document's text and prompt to the Claude API via the ClaudeService, and returns Claude's generated response.

**Handler:** `ActivityController@generate`

**Request format:** JSON (standard `application/json`)

**Parameters:**
- `document_id` — The ID of an uploaded document (integer, required, must exist in the documents table)
- `prompt` — A natural language description of what activity to generate (string, required, max 1000 characters)

**Returns:** JSON object with the raw Claude response

**Example request (using axios, as in GeneratePage.jsx):**
```javascript
axios.post('/api/generate', {
  document_id: 1,
  prompt: 'Give me 5 multiple choice questions about vocabulary from this text'
});
```

**Example response (200 OK):**
```json
{
  "response": "Here are 5 multiple choice questions:\n\n1. Question text...\n\nA) Answer A...\nB) Answer B...\n..."
}
```

**Error responses:**
- **422 Unprocessable Entity** — Validation failed (missing document_id, document doesn't exist, prompt is empty or too long)
- **500 Internal Server Error** — Claude API call failed (bad API key, network error, rate limit, etc.)

## How It Fits Into the App

**UploadPage.jsx** (the React component) calls these endpoints:
- When the teacher uploads a file, it calls `POST /api/documents` and displays the response

**GeneratePage.jsx** (the React component, added in Phase 3) calls these endpoints:
- On page load, it calls `GET /api/documents` to populate the document dropdown
- When the teacher submits a generation prompt, it calls `POST /api/generate` and displays Claude's response

**Later phases** will add more routes:
- Routes for parsing and storing generated activities (Phase 4–6)
- `GET /api/activities` — List saved activities (Phase 7)
- Routes for fullscreen display and presentation modes (Phase 8)
- etc.

## Authentication Notes

Phase 2 does not include authentication yet. These routes are publicly accessible. Phase 9 (Polish & Beta Prep) will add basic auth (probably Laravel Breeze or a simple password check) so only invited users can access the app.

For now, anyone with the app's URL can upload PDFs. This is fine for local development, but must be fixed before production.
