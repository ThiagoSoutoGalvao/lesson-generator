# Lesson Generator — Audio Transcription Feature
## Roadmap & Implementation Brief

---

## Context

This document describes the roadmap for adding audio transcription support to the Lesson Generator app. The core app (Phases 1–10) is already built and tested. This feature is added as a standalone extension — it does not modify any existing functionality.

The problem this solves: many English course books (such as Speak Out) come with companion audio files containing dialogues, listening exercises, and pronunciation tracks. These files are typically 2–5 minutes long. Teachers cannot currently upload audio as a source for activity generation. Large PDF files sometimes fail to upload or extract cleanly. Audio transcription provides an alternative and complementary source of content.

The solution: the teacher uploads an audio file, the app transcribes it using the OpenAI Whisper API, stores the transcription as a document in the existing database, and from that point the transcription flows through the exact same activity generation pipeline as a PDF — Claude reads it and generates quizzes, flashcards, and unjumble exercises from it.

---

## How It Fits Into the Existing App

The existing app has a `documents` table that stores extracted text from PDFs. Each document has a `source_type` field. This feature adds `audio` as a valid source type alongside `pdf`. Once transcribed, an audio document is indistinguishable from a PDF document in the activity generation pipeline — no changes to Claude integration, activity templates, or the save/library system are needed.

New additions to the codebase:
- `TranscriptionService.php` — handles Whisper API communication
- `AudioUploadController.php` — handles audio file uploads
- A new Laravel Queue job: `TranscribeAudioJob.php` — runs transcription in the background
- A new React component: `AudioUploader.jsx` — upload UI with processing state
- A transcription preview component: `TranscriptionPreview.jsx` — shows result before generating activities

---

## Technical Approach

### Transcription API: OpenAI Whisper
- Industry standard for speech-to-text, highly accurate with accented English
- Supports mp3, mp4, m4a, wav, and webm formats
- Pricing: approximately $0.006 per minute — a 5-minute file costs $0.03
- The teacher is already using the Anthropic API (Claude) so adding a second API key for OpenAI is a small addition
- Alternative: run Whisper locally via a Python script on the Laravel server — free but more complex setup. Not recommended for this stage.

### Background Processing: Laravel Queues
- Transcription takes 10–30 seconds for a 5-minute file
- This must run as a background job — the user should not sit on a loading screen waiting for a synchronous HTTP response
- Laravel Queues handle this: the upload completes instantly, a job is dispatched, the frontend polls for completion
- Queue driver: `database` (simplest, no Redis needed, works with existing MySQL setup on Herd and Railway)

### Polling for completion
- After upload, the React frontend polls a status endpoint every 3 seconds
- The endpoint returns the document status: `processing`, `ready`, or `failed`
- When `ready`, the transcription text is shown and the teacher can start generating activities

---

## Development Phases

**Workflow rule: Build → Test manually → Commit → Next phase.**

```
git add .
git commit -m "Audio Phase X: description"
git push origin main
```

---

### AUDIO PHASE 1 — Whisper API Integration (Backend Only)
**Goal:** Laravel can send an audio file to OpenAI Whisper and receive a transcription. No UI yet.

**What to build:**
- Add `OPENAI_API_KEY` to `.env` and `config/services.php`
- Create `app/Services/TranscriptionService.php`
  - Method: `transcribe(string $filePath): string`
  - Sends the audio file to `https://api.openai.com/v1/audio/transcriptions`
  - Uses model `whisper-1`
  - Returns the transcription text as a plain string
- Write a temporary test route in `routes/api.php` that calls the service with a hardcoded audio file path and returns the transcription as JSON
- Test with a real audio file from a Speak Out unit

**Test:** Hit the test route via a tool like Postman or the browser. Confirm the transcription text comes back correctly and matches the audio content. Check that the OpenAI API key is working.

**Commit:** `Audio Phase 1: TranscriptionService — Whisper API integration`

---

### AUDIO PHASE 2 — Background Job Setup
**Goal:** Transcription runs as a background queue job, not a blocking HTTP request.

**What to build:**
- Configure Laravel Queue driver to `database` in `.env`: `QUEUE_CONNECTION=database`
- Run migration to create the jobs table: `php artisan queue:table && php artisan migrate`
- Create `app/Jobs/TranscribeAudioJob.php`
  - Accepts: `document_id` (integer)
  - On handle: retrieves the document, calls `TranscriptionService::transcribe()`, saves the result to the `documents` table, updates `status` to `ready`
  - On failure: updates `status` to `failed`, logs the error
- Add a `status` column to the `documents` table (`processing`, `ready`, `failed`) — write the migration
- Add a `source_type` column to `documents` if not already present (`pdf`, `audio`)
- Start the queue worker locally: `php artisan queue:work`

**Test:** Manually dispatch a `TranscribeAudioJob` from Tinker (`php artisan tinker`) with a real document ID. Confirm the job runs, the transcription is saved to the DB, and the status updates to `ready`. Check the `jobs` table empties after processing.

**Commit:** `Audio Phase 2: TranscribeAudioJob and queue setup`

---

### AUDIO PHASE 3 — Audio Upload Controller & Status Endpoint
**Goal:** The backend can receive an audio file upload, store it, dispatch the transcription job, and report status.

**What to build:**
- Create `app/Http/Controllers/AudioUploadController.php` with two methods:
  - `store(Request $request)` — validates and stores the audio file, creates a `document` record with `status: processing` and `source_type: audio`, dispatches `TranscribeAudioJob`, returns the new `document_id`
  - `status(int $id)` — returns the current `status` and `transcription_text` for a given document ID
- Validation rules for `store`:
  - File must be present
  - Accepted mimetypes: `audio/mpeg`, `audio/mp4`, `audio/wav`, `audio/webm`
  - Max size: 25MB (Whisper API limit)
- Add routes to `routes/api.php`:
  - `POST /api/audio/upload`
  - `GET /api/audio/status/{id}`
- Store audio files in `storage/app/audio/` using Laravel filesystem

**Test:** Use Postman to upload a real audio file to `POST /api/audio/upload`. Confirm the file is stored, a document record is created with `status: processing`, and the job is dispatched. Then hit `GET /api/audio/status/{id}` every few seconds — confirm it transitions from `processing` to `ready`. Check that the transcription text is present in the response when ready.

**Commit:** `Audio Phase 3: AudioUploadController and status endpoint`

---

### AUDIO PHASE 4 — React Upload UI
**Goal:** Teacher can upload an audio file from the browser and see a processing indicator while transcription runs.

**What to build:**
- Create `resources/js/components/AudioUploader.jsx`
  - File input accepting audio formats (mp3, mp4, m4a, wav)
  - Drag and drop support using the existing Shadcn/ui pattern from the PDF uploader
  - Shows file name and duration estimate once selected
  - Upload button triggers `POST /api/audio/upload`
  - After upload, enters a `processing` state — shows a spinner and message: "Transcribing audio, this takes about 20–30 seconds…"
  - Polls `GET /api/audio/status/{id}` every 3 seconds
  - On `ready`: transitions to the transcription preview
  - On `failed`: shows an error message with a retry button
- Add the `AudioUploader` as a second tab or toggle on the existing document upload screen, alongside the PDF uploader

**Test:** Upload a 2-minute audio file. Confirm the spinner appears immediately after upload. Confirm polling happens (visible in browser Network tab). Confirm the component transitions correctly when the job completes.

**Commit:** `Audio Phase 4: AudioUploader React component with polling`

---

### AUDIO PHASE 5 — Transcription Preview & Activity Generation
**Goal:** Teacher can review the transcription and generate activities from it, exactly as they would from a PDF.

**What to build:**
- Create `resources/js/components/TranscriptionPreview.jsx`
  - Displays the full transcription text in a scrollable panel
  - Shows metadata: source file name, duration, word count
  - A "Generate Activity" button that passes this document to the existing activity generation flow
  - An optional "Edit transcription" toggle — lets the teacher correct any transcription errors before generating (simple textarea, saves on blur via `PATCH /api/documents/{id}`)
- Wire the `AudioUploader` to transition into `TranscriptionPreview` once the document status is `ready`
- Confirm the existing `ClaudeService` and activity generation pipeline work without modification when given an audio-sourced document

**Test:** Upload an audio file, wait for transcription, review the preview, click "Generate Activity", and generate a quiz. Confirm the quiz questions are based on the audio content. Edit a word in the transcription and regenerate — confirm the edit is reflected in the new activity.

**Commit:** `Audio Phase 5: TranscriptionPreview and activity generation from audio`

---

### AUDIO PHASE 6 — Library Integration & Polish
**Goal:** Audio-sourced documents and their activities are fully integrated into the existing save/library system.

**What to build:**
- In the activity library, audio-sourced documents show a 🎧 icon instead of 📄
- Filter options in the library: "All", "PDF", "Audio"
- When an audio document is opened from the library, show the transcription preview before the activity — the teacher can regenerate or launch the saved activity
- Error handling: if the Whisper API is unavailable or returns an error, show a clear message and suggest the teacher try again or use PDF instead
- File size validation on the frontend before upload — show a friendly message if the file exceeds 25MB
- Clean up the queue worker setup for Railway deployment — add a `Procfile` worker process

**Test:** Upload 3 audio files, generate and save activities from each, confirm they appear correctly in the library with the audio icon and filter. Simulate an API failure by using a wrong API key temporarily — confirm the error state displays correctly.

**Commit:** `Audio Phase 6: Library integration, error handling, and deployment config`

---

## What You Will Learn From This Feature

- **OpenAI Whisper API** — a second external AI API alongside Claude, showing how different AI services can work together in one app
- **Laravel Queues** — background job processing, one of the most important Laravel concepts for real applications
- **Polling pattern** — how frontends check on long-running backend tasks without blocking the user
- **Database-driven job queue** — running async work without needing Redis or external queue services
- **File validation** — handling different file types and size limits safely
- **Multi-source RAG** — the same AI pipeline working across different content sources (PDF and audio), which is the foundation of more advanced document AI systems

---

## Notes for Claude Code Sessions

Start each session with:

> *"I am working on Lesson Generator, a Laravel + React app for English teachers. The core app (Phases 1–10) is complete and tested. I am now implementing the Audio Transcription feature. I am on Audio Phase [X]: [name]. Here is the current project structure: [paste tree]. The goal of this phase is [goal]. Let's start with [first task]."*

Keep each session scoped to one phase. The existing activity generation pipeline must not be modified — audio transcription feeds into it as a new source type, not a replacement.