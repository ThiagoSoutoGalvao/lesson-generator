# DocumentController — Handles PDF upload and retrieval

## Overview

This Laravel controller manages the entire lifecycle of document uploads. When a teacher uploads a PDF file, this controller receives the request, validates it, stores the file on disk, extracts all the text from the PDF, and saves the document metadata to the database. It also provides an endpoint to list all uploaded documents so the teacher can see their library of course books.

This is the bridge between the React frontend (where the teacher picks a file) and the database layer (where documents are stored for later use in activity generation).

## File Location
`app/Http/Controllers/DocumentController.php`

## Dependencies & Imports

- **Illuminate\Http\Request** — A class that wraps the incoming HTTP request (form data, files, parameters)
- **App\Models\Document** — The Laravel model representing a document record in the database
- **Illuminate\Support\Facades\Storage** — Laravel's abstraction layer for file storage (allows reading/writing files to disk or cloud)
- **Smalot\PdfParser\Parser** — A third-party PHP library (included via Composer) that reads PDF files and extracts their text content

## Methods

### `store(Request $request): JsonResponse`

**What it does:** Receives a PDF file from the teacher, validates it, extracts its text content, stores both the file and extracted text in the database, and returns a summary of the upload.

**Parameters:**
- `$request` — The HTTP request object, which contains the uploaded PDF file in `$request->file('pdf')`

**Returns:** A JSON response (HTTP 201 Created) containing:
- `id` — The database ID of the newly saved document
- `original_name` — The filename the teacher uploaded (e.g., "Speak Out Unit 1.pdf")
- `preview` — The first 500 characters of the extracted text, so the teacher can verify the extraction worked
- `char_count` — Total number of characters extracted from the PDF (helps the teacher understand how much content they have)

**Side effects:** 
- Validates the uploaded file (must be a PDF, max 50 MB)
- Stores the PDF file on disk in the `storage/app/documents/` folder
- Reads the PDF file from disk using the `PdfParser` library to extract all text
- Writes a new record to the `documents` database table with the filename, file path, and extracted text

**Validation:**
- File is required (cannot be omitted)
- File must be a PDF (MIME type `application/pdf`)
- File must not exceed 50 MB (204800 bytes)

### `index(): JsonResponse`

**What it does:** Returns a list of all documents the teacher has uploaded, ordered by most recent first.

**Parameters:** None

**Returns:** A JSON array of document objects, each containing:
- `id` — Database ID
- `original_name` — The filename
- `created_at` — When the document was uploaded (timestamp)

**Side effects:** None (read-only query)

**Why it's selective:** The method only fetches `id`, `original_name`, and `created_at` — it does NOT fetch the `extracted_text` field. This keeps the response fast because extracted text can be very large. When the teacher needs to actually use a document's content for activity generation, a separate request will fetch the full document.

## How It Fits Into the App

**Phase 2 context:** DocumentController is the backend engine for the PDF Upload phase. Here's the flow:

1. Teacher lands on the Upload page (React component `UploadPage.jsx`)
2. Teacher drags a PDF onto the upload area (or clicks to browse)
3. UploadPage calls `POST /api/documents` (an axios request) with the PDF file
4. DocumentController's `store()` method receives it, extracts text, and saves to the database
5. DocumentController returns a JSON response with the preview and character count
6. UploadPage displays the success message and text preview to the teacher

Later phases (Activity Generation) will call DocumentController indirectly — they will fetch document text via this controller and send it to the Claude API along with the teacher's activity prompt.

The `index()` method is used by Phase 7 (Save & Library) and beyond to show the teacher their document library.

## Error Handling Notes

If validation fails (wrong file type, too large, etc.), Laravel's validation automatically returns a 422 response with error details. The frontend catches this in the catch block and displays it to the teacher.

If the PDF parser fails to extract text from a corrupted or unusual PDF, the `extracted_text` field will be empty or incomplete. Phase 9 (Polish) should add better error handling here (e.g., warning the user that text extraction failed).
