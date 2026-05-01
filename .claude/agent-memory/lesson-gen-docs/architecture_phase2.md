---
name: Phase 2 Architecture — Document Upload
description: PDF upload and text extraction flow; database schema for documents; key service patterns
type: project
---

## Phase 2 Architecture Overview

**Goal:** Teacher uploads PDF, text is extracted, metadata saved to database.

### Data Flow

1. **Frontend (UploadPage.jsx)**
   - Handles drag-and-drop or file picker
   - Sends file to `POST /api/documents` via axios
   - Displays preview (first 500 chars) and character count on success

2. **Backend Route (routes/api.php)**
   - Routes POST/GET requests to DocumentController

3. **Controller (DocumentController.php)**
   - `store()` — validates file, stores on disk, extracts text via SmalotPdfParser, creates Document record
   - `index()` — returns list of uploaded documents

4. **Model (Document.php)**
   - Simple Eloquent model; only maps table columns
   - Fillable: `original_name`, `stored_path`, `extracted_text`
   - No relationships yet (will be added in Phase 7 when Activity model created)

5. **Database (migrations/create_documents_table.php)**
   - Table: `documents`
   - Key columns: `id`, `original_name`, `stored_path`, `extracted_text` (longText), `created_at`, `updated_at`

### Key Design Patterns

- **Validation at controller level** — File type/size checked in DocumentController::store() before model creation
- **PDF parsing on upload** — Text extraction happens immediately (synchronously), not deferred to a queue. This keeps the upload flow simple.
- **Selective response** — `DocumentController::index()` fetches only `id`, `original_name`, `created_at` (not the huge `extracted_text` field) for performance
- **Filesystem + DB** — PDF file stored in `storage/app/documents/`; metadata + text stored in database

### Dependencies

- **spatie/pdf-to-text** is NOT used; instead **Smalot\PdfParser\Parser** is used (included as dependency)
- **axios** on frontend for HTTP requests
- Laravel's Storage facade for file operations

### Known Limitations

- No authentication yet (Phase 9)
- No error handling for malformed PDFs (Phase 9)
- PDF text extraction happens synchronously, which could timeout on very large files (future: move to queue job)
- No progress indication during upload for large files (Phase 9)

### Next Phase (Phase 3)

Phase 3 will add a `ClaudeService` that:
- Takes a Document record
- Extracts a relevant section of the `extracted_text` (e.g., "unit 3")
- Sends it to Claude API with a teacher's activity prompt
- Returns structured JSON (quiz, flashcard, or unjumble schema)
