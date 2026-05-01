# UploadPage — React component for uploading PDF course books

## Overview

This React component is the teacher's first interaction with the Lesson Generator. It displays a drag-and-drop upload area, handles file selection, sends the PDF to the Laravel backend, and shows the result (success with text preview, or error message).

It is a page-level component — the entire upload screen. Once a document is successfully uploaded, the teacher would navigate to the next phase (activity generation), but Phase 2 only focuses on getting files into the system.

## File Location
`resources/js/pages/UploadPage.jsx`

## Props

This component takes no props. It manages all its own state and handles the entire upload flow independently.

## State

| State Variable | Type | Purpose | Initial Value |
|---|---|---|---|
| `dragging` | boolean | Tracks whether the user is currently dragging a file over the upload area (used to highlight it) | `false` |
| `status` | string | The current upload state — one of: `'idle'` (waiting for file), `'uploading'` (sending to server), `'success'` (file saved), or `'error'` (upload failed) | `'idle'` |
| `result` | object or null | The response from the server after a successful upload, containing `original_name`, `preview`, and `char_count` | `null` |
| `errorMsg` | string | The error message to display if upload fails (server validation error or network error) | `''` |
| `inputRef` | React ref | A reference to the hidden file input element, so the component can trigger it when the user clicks the upload area | Created by `useRef(null)` |

## Key Hooks Used

### `useState` (4 times)
Manages the upload state, drag state, result data, and error messages. Each piece of state is independent and updates the UI when changed.

### `useRef`
Holds a reference to the hidden file input element. This allows the component to programmatically click it when the user clicks the upload area, triggering the file picker without displaying a native button.

## User Interactions

### Drag and Drop
- **onDragOver**: When the user drags a file over the upload area, set `dragging` to true and highlight the area (blue border, light blue background)
- **onDragLeave**: When the user moves the file out of the area, set `dragging` to false and remove the highlight
- **onDrop**: When the user releases the file, call the `upload()` function with the first file from the drop event. Prevent the browser's default behavior (opening the file in a tab)

### Click to Browse
- **onClick on upload area**: Trigger the hidden file input, opening the system file picker
- **onChange on file input**: When the user selects a file from the picker, call `upload()` with the selected file. Clear the input value so the same file can be selected again if needed

### Upload another
- **onClick button (after success)**: Call `reset()` to clear the success state and return to the idle screen, ready for another upload

## What It Renders

### Before upload (status !== 'success')
A large, clickable upload area with:
- A document icon (SVG)
- Text: "Drop your PDF here or click to browse"
- Subtext: "PDF only · max 50 MB"
- Styling changes on hover and when dragging (border color, background color)
- A hidden file input element

### During upload (status === 'uploading')
The same upload area, but with the text changed to "Uploading…" and the area is not interactive.

### On error (status === 'error')
- The upload area remains visible
- An error message box appears below it with a red background and the error text (from `errorMsg` state)

### On success (status === 'success')
- The upload area is hidden
- A green success box displays:
  - The filename (e.g., "Speak Out Unit 1.pdf")
  - A count of extracted characters (formatted with commas)
  - A text preview (first 500 characters from the server response)
  - An "Upload another" button to reset and upload again

## How It Fits Into the App

**Phase 2 context:** UploadPage is the main UI for Phase 2. The teacher lands here (or navigates to it from a main menu in Phase 9+), uploads a document, and sees confirmation that it worked.

**Data flow:**
1. Teacher selects or drags a PDF
2. UploadPage calls `POST /api/documents` (via axios) with the file
3. DocumentController::store() processes it and returns a summary
4. UploadPage displays the preview and character count
5. Teacher can upload another document or navigate to the activity generation page (Phase 3+)

**Future improvements (Phase 9 — Polish):**
- Show a loading spinner during upload instead of just changing text
- Show upload progress (for large files)
- Allow selecting a unit or section of the document before uploading (instead of uploading the whole book)
- Validate that text extraction actually succeeded before declaring success

## Error Handling

The component catches upload errors in the `try`/`catch` block:
- **Network errors** (e.g., server is down) → Display a generic message
- **Validation errors** (e.g., file is not PDF, too large) → Display the server's error message from `err.response?.data?.message`
- **Extraction errors** (future) → Would show if the server's validation passed but text extraction failed

The component does NOT auto-retry on failure — the user must click "Upload another" to try again. This is simple but could be improved in Phase 9.
