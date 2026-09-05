# GeneratePage — Activity generation interface

## Overview

This page is the main entry point for teachers to generate new activities. It displays a form where the teacher selects a PDF document, chooses an activity type (Quiz, Flashcards, Unjumble, Dialog Gap-Fill, Word Categorisation, True/False, or Image Match), optionally selects a page range, adjusts the prompt, and submits the request. While the activity is being generated (up to 20 seconds), a spinner shows. Once complete, the full activity component is rendered in place of the form. The teacher can close the activity to return to the form and generate another.

In Phase A, a pair count selector was added that appears only when the Image Match activity type is selected, allowing the teacher to choose between 4, 6, or 8 word-image pairs.

## File Location

`resources/js/pages/GeneratePage.jsx`

## Props

This is a top-level page component; it takes no props.

## State

- `documents` — Array of document objects fetched from `/api/documents`; each has `id`, `original_name`, and `page_count`; loaded on component mount
- `documentId` — The selected document ID as a string (empty string if none selected); used to fetch the document from the `documents` array and slice its pages
- `activityType` — One of seven activity types: `'quiz'`, `'flashcards'`, `'unjumble'`, `'dialog_gap_fill'`, `'word_categorisation'`, `'true_false'`, or `'image_vocab_match'`; defaults to `'quiz'`
- `prompt` — The teacher's natural language instruction; starts with the default prompt for the selected activity type, but can be edited; when the activity type changes, the prompt is auto-updated to the new default
- `status` — One of `'idle'` (form visible), `'loading'` (generating), `'success'` (activity generated), or `'error'` (generation failed); controls which UI is displayed
- `activity` — The generated activity object returned from `/api/generate`; `null` until generation succeeds; contains the full activity data (questions, flashcards, pairs, etc.)
- `errorMsg` — Error message returned from the API (e.g., "No text could be extracted from the selected pages"); displayed if generation fails
- `pageFrom` — Text input for the starting page of the range (1-indexed); empty string by default; only shown if a document is selected
- `pageTo` — Text input for the ending page of the range (1-indexed); empty string by default; only shown if a document is selected
- `pairCount` — The selected pair count for Image Match activity (4, 6, or 8); defaults to 6; only relevant when `activityType === 'image_vocab_match'`
- `sectionFocus` — The selected section focus (one of `'Vocabulary'`, `'Grammar'`, `'Listening'`, `'Reading'`, or `null`); when set, prepends "Focus specifically on the [section] section" to the prompt sent to Claude; resets when document changes; Phase C addition

## Key Hooks Used

- `useEffect` (lines 46–50) — Fetches the list of documents from `/api/documents` on mount and populates `documents` state; shows an error message if the fetch fails
- `useState` × 10 — One for each state variable above (documents, documentId, activityType, prompt, status, activity, errorMsg, pageFrom, pageTo, pairCount)

## User Interactions

**Document selection:**
- A dropdown menu shows all uploaded documents with their page counts
- Selecting a document sets `documentId` and resets `pageFrom` and `pageTo` (to clear any old page range)
- Changing the document also clears any previous activity/error state
- Required field (form validation checks it)

**Page range (shown only if document is selected):**
- Two text inputs: "From" and "To" for page numbers (1-indexed)
- Both are optional; leaving blank means "use the whole document"
- Helper text shows the total page count for the selected document
- When the document changes, the page range is cleared

**Section focus (Phase C addition; shown only if document is selected):**
- Four pill-shaped buttons: Vocabulary, Grammar, Listening, Reading
- Optional feature; teacher can leave unselected
- Clicking a button toggles it on/off; only one section can be selected at a time
- When selected, the section name is highlighted with a purple background (`bg-purple-500`)
- Unselected buttons are semi-transparent white
- When the document changes, the section focus is cleared (reset to null)
- When a section is selected and the form is submitted, the prompt is automatically prefixed with "Focus specifically on the [section] section of this text."

**Activity type selection (Phase A: single pill buttons):**
- Seven pill-shaped buttons: Quiz, Flashcards, Unjumble, Dialog, Categorise, True / False, Image Match
- Each button takes `flex-1` so they stretch to fill available width
- Clicking a button sets `activityType` and auto-updates `prompt` to the default for that type
- Current selection is highlighted with blue background (`bg-blue-500`)
- Unselected buttons are semi-transparent white

**Pair count selector (Phase A addition, Image Match only):**
- Three pill buttons: 4, 6, 8
- Only visible when `activityType === 'image_vocab_match'`
- Sets `pairCount` and is passed to the backend during generation
- Default is 6; allows flexibility in activity size

**Prompt editing:**
- Large textarea field (4 rows) with a frosted glass background
- Pre-filled with the default prompt for the selected activity type
- Fully editable by the teacher; they can customize the prompt to their needs
- Required field (form validation checks it)

**Form submission:**
- "Generate" button submits the form via POST to `/api/generate`
- Payload includes:
  - `document_id` — Selected document ID
  - `prompt` — Teacher's prompt (edited or default); if a section is focused, the backend prepends "Focus specifically on the [section] section" to this
  - `type` — Selected activity type
  - `page_from` / `page_to` — Page range (null if blank)
  - `pair_count` — Pair count (only sent if activity type is 'image_vocab_match')
  - `section_focus` — Section focus (one of 'Vocabulary', 'Grammar', 'Listening', 'Reading', or undefined if unselected); Phase C addition
- Button is disabled while `status === 'loading'`
- On success: `activity` is set and `status` becomes `'success'` (activity component renders)
- On error: `errorMsg` is set and `status` becomes `'error'` (error message displays below form)

**Loading state:**
- While generating, a `Spinner` component appears with the message "Generating your activity… this can take up to 20 seconds"
- Form is hidden while loading

**Error handling:**
- If generation fails, the error message is displayed in a red-bordered card below the form
- Form remains visible so the teacher can adjust the prompt and try again
- Error message is cleared when the teacher submits again

**Closing the generated activity:**
- When the teacher closes an activity component (via `onClose` callback), `activity` is set to `null` and `status` resets to `'idle'`
- The form reappears, ready to generate another activity

## What It Renders

**Idle state (form visible):**
1. Page heading: "Generate an Activity" with subtext "Select a document, choose an activity type, and describe what you want."
2. A frosted glass card (`bg-white/8 backdrop-blur-md`) containing a form with:
   - **Course book dropdown:** Shows all documents with page counts
   - **Page range inputs (if document selected):** "From" and "To" fields with a "of X" label
   - **Section focus buttons (Phase C addition; if document selected):** Four purple/white toggle buttons (Vocabulary, Grammar, Listening, Reading); optional selection for narrowing Claude's focus
   - **Activity type buttons:** Seven pill buttons (Quiz, Flashcards, Unjumble, Dialog, Categorise, True/False, Image Match)
   - **Pair count buttons (Image Match only):** Three pill buttons (4, 6, 8)
   - **Prompt textarea:** Pre-filled default prompt, fully editable
   - **Generate button:** Submit button (blue, disabled while loading)
3. If `status === 'error'`: A red-bordered error card below the form with the error message

**Loading state:**
- Form hidden
- Spinner displayed with custom message

**Success state (activity generated):**
- Form hidden
- The appropriate activity component is rendered based on `activity.type`:
  - `QuizActivity` for quizzes
  - `FlashcardActivity` for flashcards
  - `UnjumbleActivity` for unjumbles
  - `DialogGapFillActivity` for dialog gap-fills
  - `WordCategorisationActivity` for word categorisation
  - `TrueFalseActivity` for true/false activities
  - `ImageVocabMatchActivity` for image vocab matches
- Activity receives the `activity` data and an `onClose` handler

## How It Fits Into the App

`GeneratePage` is the main production workflow page. Teachers land here after uploading PDFs (which are stored with extracted text in the database via `UploadPage`). From here, they:
1. Select a unit or chapter (PDF)
2. Choose an activity type (what to generate)
3. Describe what they want (custom prompt)
4. Click "Generate"

The page sends a POST request to `/api/generate` (`ActivityController::generate()`), which:
- Fetches the document from the database
- Slices the text to the selected page range (if provided)
- Calls the appropriate `ClaudeService` method (e.g., `generateImageVocabMatch()`)
- Returns the generated activity JSON

The page then displays the activity immediately in fullscreen-capable components. Once satisfied, the teacher can save the activity to the library via `SavePanel` for reuse in future classes.

Default prompts (pre-filled for each activity type) guide the teacher but are fully customizable. The page range feature lets teachers focus on a single unit without sending the entire textbook to Claude. The pair count selector (Phase A) makes Image Match activities flexible in size without requiring regeneration. The section focus buttons (Phase C) allow teachers to guide Claude toward specific content types (vocabulary, grammar, etc.) without editing the prompt manually — the four buttons (Vocabulary, Grammar, Listening, Reading) toggle on/off, and when one is selected, "Focus specifically on the [section] section" is prepended to the final prompt sent to the backend.
