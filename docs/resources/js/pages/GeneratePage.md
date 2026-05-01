# GeneratePage — UI for selecting a document and typing a prompt to generate activities

## Overview

This is a React page component that allows a teacher to generate activities from their uploaded PDF documents. The page displays a form with two fields: a dropdown to select a document and a textarea to type a natural language prompt (like "Give me 5 quiz questions about vocabulary"). When the teacher submits the form, the component calls the backend `/api/generate` endpoint, displays the raw response from Claude, and shows error messages if something goes wrong.

This is Phase 3's minimal UI. In later phases, the raw response will be parsed and rendered as formatted quizzes, flashcards, or unjumble activities.

## File Location
`resources/js/pages/GeneratePage.jsx`

## Props

This component takes no props. It is a page component that manages all its own state and API calls.

## State

This component uses `useState` to track several pieces of information:

- `documents` — Array of document objects fetched from the backend. Each object has an `id` and `original_name`. Initialized as an empty array.
- `documentId` — The ID of the currently selected document in the dropdown. A string. Initialized as an empty string (no selection).
- `prompt` — The text the teacher typed in the prompt textarea. A string. Initialized as an empty string.
- `status` — A simple state machine tracking the form submission state. One of:
  - `'idle'` — Initial state, or after a successful response
  - `'loading'` — Request is in flight to the backend
  - `'success'` — Response received successfully
  - `'error'` — Request failed or backend returned an error
- `response` — The raw text response from Claude's API (only populated if status is 'success'). A string. Initialized as an empty string.
- `errorMsg` — The error message to display to the user (only populated if status is 'error'). A string. Initialized as an empty string.

## Key Hooks Used

**`useEffect` (on mount):** Runs once when the component first renders. It calls the backend's `GET /api/documents` endpoint to fetch the list of available documents and populates the `documents` state. This populates the dropdown menu.

**Form submission (`handleSubmit`):** An async function that:
1. Prevents the browser's default form submission
2. Resets `status` to `'loading'` and clears previous response/error
3. Makes a POST request to `/api/generate` with the selected document ID and prompt
4. On success: sets the response text and status to `'success'`
5. On error: extracts the error message and sets status to `'error'`

## User Interactions

**Document dropdown:** Teacher clicks to select a document. The selection is stored in `documentId`. Validation requires a document to be selected before the form can be submitted.

**Prompt textarea:** Teacher types their prompt here. The text is stored in `prompt`. Validation requires at least some text before submission.

**Generate button:** When clicked, the form's `handleSubmit` function runs. While the request is in flight (`status === 'loading'`), the button is disabled and shows "Generating…" instead of "Generate". This prevents double-submission.

## What It Renders

A two-column centered form layout (max width 2xl, centered horizontally) containing:

1. **Header** — "Generate an Activity" (h2) with a description paragraph
2. **Form with three sections:**
   - **Document selector** — A labeled `<select>` dropdown showing all uploaded documents. Default shows "Select a document…". Teacher must select one.
   - **Prompt textarea** — A labeled `<textarea>` with placeholder text "e.g. Give me 3 quiz questions about vocabulary from this text". 4 rows tall.
   - **Generate button** — Blue submit button, disabled while loading, shows "Generating…" when in flight
3. **Error message box** — A red alert box with rounded corners appears below the form if `status === 'error'`. Shows the error message.
4. **Raw response display** — If `status === 'success'`, displays the raw Claude response in a dark preformatted code block (`<pre>` with monospace font, scrollable, max height 96). This is labeled "Raw response from Claude" so the user knows they're looking at unformatted API output.

All form elements and text use Tailwind CSS utility classes for styling (spacing, colors, borders, focus states).

## How It Fits Into the App

**Route:** This component is rendered at the `/generate` path (loaded by React Router in the main app).

**Workflow:** GeneratePage is the teacher's entry point for activity generation:
1. Teacher uploads PDFs on the UploadPage (Phase 2)
2. Teacher navigates to GeneratePage and selects a document
3. Teacher types a prompt describing what activity they want
4. Teacher clicks Generate
5. The backend (ActivityController + ClaudeService) calls the Claude API
6. The raw response is displayed on this page
7. In Phase 4+, this response will be parsed and displayed as a formatted quiz/flashcard/unjumble activity

This page currently shows the raw JSON/text response from Claude. This serves as a debugging tool and proof-of-concept. Future phases will parse this response and render it as interactive activities.
