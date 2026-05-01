# Document — Model representing an uploaded course book PDF

## Overview

This is a Laravel Eloquent model that represents a single row in the `documents` database table. In Laravel, models are classes that map to database tables — they provide a convenient way to query and manipulate data without writing raw SQL.

The Document model is simple: it just maps the table columns to object properties and defines which columns are safe to fill (assign) when creating or updating records. It does not contain any complex business logic — it is purely a data container.

## File Location
`app/Models/Document.php`

## Properties (Database Columns)

The `$fillable` array tells Laravel which columns can be mass-assigned (set all at once using `Document::create()`). This is a security feature — it prevents accidental overwriting of sensitive columns like `id` or `created_at`.

The columns that can be filled are:
- `original_name` — String: the filename the teacher uploaded (e.g., "Speak Out Unit 1.pdf")
- `stored_path` — String: the filesystem path where the PDF is stored (e.g., "documents/abc123.pdf")
- `extracted_text` — Text: the complete text content extracted from the PDF. Uses `longText` in the migration, so it can hold very large amounts of text.

Additional columns (not in `$fillable`) managed by Laravel automatically:
- `id` — Auto-incrementing primary key
- `created_at` — Timestamp of when the record was created
- `updated_at` — Timestamp of when the record was last modified

## How It Fits Into the App

The Document model is used by `DocumentController::store()` to create new document records:

```php
$document = Document::create([
    'original_name' => $file->getClientOriginalName(),
    'stored_path'   => $path,
    'extracted_text' => $text,
]);
```

And by `DocumentController::index()` to fetch all documents for display in the teacher's library.

In later phases, other models and services will retrieve Document records and use their `extracted_text` to generate activities. For example, the `ClaudeService` (Phase 3) will load a Document, extract relevant text based on a unit/topic, and send it to the Claude API.

## Notes on Design

- **No relationships defined yet** — In Phase 7 (Save & Library), the `Activity` model will likely have a foreign key back to Document (one document can have many activities). When that happens, this model can be updated with a `hasMany('Activity')` relationship.
- **No validation** — The actual file validation happens in `DocumentController::store()` before the Document is created. The model does not duplicate this validation.
