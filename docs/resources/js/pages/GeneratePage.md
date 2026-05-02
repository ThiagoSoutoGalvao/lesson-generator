# GeneratePage — Activity generation form and display

## Overview

This page is where the teacher creates interactive classroom activities. They select a course book (PDF), choose an activity type (quiz, flashcards, or unjumble), type a natural language prompt describing what they want, and submit the form. The app sends the request to the backend, which uses Claude AI to generate the activity content. Once generated, the activity is displayed fullscreen for immediate use.

This component manages the entire workflow: loading the list of uploaded documents, collecting the teacher's input, handling the API request, displaying loading/error states, and routing to the correct activity display component (QuizActivity, FlashcardActivity, or UnjumbleActivity). The teacher can close the activity and return to the form to generate another one.

## File Location

`resources/js/pages/GeneratePage.jsx`

## Props

This component takes no props. It is a page displayed by the layout when the teacher navigates to the generate route.

## State

- `documents` — Array of uploaded documents fetched from the backend. Each document has an `id` and `original_name` (the filename). Used to populate the dropdown select.
- `documentId` — String. The id of the selected document. Sent to the backend in the POST request. Initially empty (blank option selected).
- `activityType` — String. One of "quiz", "flashcards", or "unjumble". Controls which placeholder text shows in the prompt textarea and which activity component is rendered after generation. Starts as "quiz".
- `prompt` — String. The teacher's natural language instruction, e.g. "Give me 5 multiple choice questions about vocabulary". Sent to the backend and passed to Claude API.
- `status` — String. One of "idle", "loading", "success", or "error". Used to show loading spinner, hide/show error message, and disable the submit button during request. Starts as "idle".
- `activity` — Object (or null). The generated activity data returned by the Claude API. Contains `type`, `topic`, and either `questions` (for quiz), `cards` (for flashcards), or `sentences` (for unjumble). Initially null.
- `errorMsg` — String. Human-readable error message shown to the user if the request fails. Initially empty.

## Key Hooks Used

- `useState` — Manages all form input (documentId, activityType, prompt), loading state (status, errorMsg), and the generated activity result.
- `useEffect` (on mount) — Fetches the list of available documents from `/api/documents` and stores them in the `documents` state. Runs once when the component loads.

## User Interactions

- **Document dropdown** — Select a course book. Updates `documentId` state. Must select one before submitting.
- **Activity type buttons** — Click "Quiz", "Flashcards", or "Unjumble" to change `activityType`. The button styling changes to show which is selected (blue background for active, white for inactive). The prompt placeholder text also changes based on selection.
- **Prompt textarea** — Teacher types their request. Updates `prompt` state. Required before submitting.
- **Generate button** — Submits the form. Disabled while loading. Text changes to "Generating…" during the request. Triggers `handleSubmit`, which sends a POST request to `/api/generate` with documentId, prompt, and type.
- **Close button** (on activity) — After an activity is generated, a close button (✕) is shown by the activity component (QuizActivity or FlashcardActivity). Clicking it calls `onClose`, which hides the activity and returns to this form.
- **Error display** — If the API request fails, a red error banner appears below the form with the error message from the server.

## What It Renders

When no activity is generated (status is "idle" or "loading"):

1. **Title and description** — "Generate an Activity" heading with instructions.
2. **Document select** — Dropdown populated with the list of uploaded documents.
3. **Activity type selector** — Three toggle buttons: "Quiz", "Flashcards", and "Unjumble". Current selection is highlighted in blue.
4. **Prompt textarea** — A 4-row text input. Placeholder text changes based on activity type selection.
5. **Generate button** — Submit button. Disabled and shows "Generating…" while status is "loading".
6. **Error message** (conditional) — Red error box appears below the form if status is "error".

When an activity is generated (status is "success"):
- If `activity.type === "quiz"`, the entire page is replaced by the QuizActivity component.
- If `activity.type === "flashcards"`, the entire page is replaced by the FlashcardActivity component.
- If `activity.type === "unjumble"`, the entire page is replaced by the UnjumbleActivity component.

All activity components receive `activity` data and an `onClose` callback. When closed, they call `onClose`, which resets the activity to null, sets status back to "idle", and returns the form to view.

## How It Fits Into the App

GeneratePage is the main hub after a teacher has uploaded a course book. The teacher lands here to turn PDF content into classroom activities. They submit a prompt, the backend's `ActivityController` receives the request, calls the appropriate `ClaudeService` method (`generateQuiz()`, `generateFlashcards()`, or `generateUnjumble()`) depending on the `type` parameter, and returns the structured activity JSON. GeneratePage then mounts the corresponding activity component (QuizActivity, FlashcardActivity, or UnjumbleActivity) to display the result. When the teacher closes the activity, they return to this page and can immediately generate another one using the same or different document.
