# UploadPage — File upload interface for course book PDFs with client-side size validation

## Overview

This page allows a teacher to upload a course book PDF. The component handles file selection via drag-and-drop or file picker, validates the file type and size on the browser before sending to the server, and displays success or error messages. A new browser-side size check (500 MB limit) shows an amber banner with helpful links to PDF splitting tools if the file is too large, preventing unnecessary uploads and server errors.

## File Location

`resources/js/pages/UploadPage.jsx`

## State

- `dragging` — Boolean; true when user is dragging a file over the drop zone
- `status` — String (`idle`, `uploading`, `error`, or `success`); controls which UI section is visible
- `result` — Object containing server response after successful upload (e.g., `original_name`, `char_count`, `preview`)
- `errorMsg` — String; error message from server validation or upload failure (only shown for non-size-related errors)
- `tooLarge` — Boolean; true when the file exceeds 500 MB, triggering the amber warning banner instead of the red error banner
- `inputRef` — Ref to hidden file input element, used to trigger file picker when drop zone is clicked

## User Interactions

### File Selection
- **Click drop zone or drag file over it** — Initiates file upload via the `upload()` function
- **Select file via system file picker** — Clicking the drop zone programmatically opens a file picker; selecting a file calls `upload()`

### File Validation (Browser-Side)
The `upload()` function validates before sending to server:

1. **File type check** — If not a PDF (`file.type !== 'application/pdf'`), sets `status = 'error'` with message "Please select a PDF file." and returns immediately
2. **File size check** — If file exceeds `MAX_MB` (500):
   - Sets `tooLarge = true` and `status = 'error'`
   - The error UI renders an **amber warning banner** instead of the red error banner
   - The banner includes two direct links to PDF splitting tools:
     - **ilovepdf.com/split_pdf** — Opens in new tab
     - **smallpdf.com/split-pdf** — Opens in new tab
   - No server request is made
3. If both checks pass, proceeds to upload

### Upload (Server-Side)
- Sets `status = 'uploading'`, clears previous errors/results, shows spinner with "Uploading and extracting text…"
- Sends POST request to `/api/documents` with PDF as multipart FormData
- On success:
  - `status = 'success'`, displays result card with document name, character count, and text preview
  - Shows "Upload another" button to reset and upload a different file
- On error:
  - `status = 'error'`, displays red banner with server error message (e.g., "Image-based PDF detected")
  - `tooLarge = false`, so the red banner (not amber) is shown

### Reset
- **"Upload another" button** (on success card) — Calls `reset()`, which clears all state back to `idle`

### UI Sections Rendered by Status

| Status | What Shows |
|--------|-----------|
| `idle` or `uploading` | Drop zone (with spinner if uploading) |
| `error` + `tooLarge = true` | Amber banner with PDF splitting tool links; drop zone remains visible to upload another file |
| `error` + `tooLarge = false` | Red error banner; drop zone remains visible to try again |
| `success` | Green success card showing document name, character count, text preview, and "Upload another" button |

## What It Renders

A centered column (`max-w-xl`) containing:

1. **Page heading** — "Upload a Course Book" with explanatory subtext
2. **Drop zone** (when not in success state) — Dashed border box with PDF icon, drag-and-drop area; shows:
   - Normal state: "Drop your PDF here or click to browse" + "PDF only · max 500 MB"
   - Uploading state: spinner + "Uploading and extracting text…"
   - Blue highlight border when dragging over the zone
3. **Error banners** — Only shown when `status = 'error'`:
   - **Amber banner** (if `tooLarge = true`) — "File too large (max 500 MB)" heading, explanation text, two direct links to ilovepdf.com and smallpdf.com split tools
   - **Red banner** (if `tooLarge = false`) — Server error message (e.g., "Image-based PDF detected" or "No text could be extracted")
4. **Success card** (when `status = 'success'`) — Green bordered card showing:
   - Document name and character count
   - Text preview in a scrollable `<pre>` block (max-height, shows first 300 chars)
   - "Upload another" button to reset

## How It Fits Into the App

UploadPage is one of the three main pages in the Lesson Generator app. It appears in the navigation menu and is the entry point for a new teacher: they upload their course book PDF here, and the app extracts the text and stores it in the `documents` table. Once a document is uploaded, the teacher navigates to the Generate page to create activities from it.

The browser-side file size check (Phase E change) prevents unnecessary network requests and server processing when a file is too large. The amber banner with direct links to PDF splitting tools provides a better user experience than a generic red error, guiding the teacher to resolve the issue immediately without leaving the app.

## Notes

- The 500 MB size check is performed **before** the server receives the request, preventing bandwidth waste and server errors.
- `tooLarge` is a separate boolean from `errorMsg` to allow different UI styling (amber vs. red) depending on the error type.
- File input is hidden (`className="hidden"`) and triggered programmatically via `inputRef.current?.click()` when the drop zone is clicked.
- After a successful upload, the hidden input's `value` is cleared (`e.target.value = ''`) so selecting the same file again triggers `onChange` even if the user hasn't browsed to a different file.
- Server errors (e.g., "No text could be extracted" for image-based PDFs) are handled separately from size errors and show the red banner.
- Links to PDF splitting tools open in new tabs (`target="_blank" rel="noreferrer"`), so users can complete the task and return to the app without navigating away.
