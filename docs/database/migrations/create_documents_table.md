# CreateDocumentsTable Migration — Sets up the database table for storing documents

## Overview

This is a Laravel database migration — a version-controlled script that defines the structure of a database table. Migrations let you track schema changes in Git, making it easy to apply the same database structure across development, testing, and production environments.

This specific migration creates the `documents` table, which stores metadata and content for every PDF the teacher uploads.

## File Location
`database/migrations/2026_04_30_204332_create_documents_table.php`

## Table Structure

The migration creates a `documents` table with the following columns:

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | bigInteger (auto-increment) | No | Primary key — uniquely identifies each document |
| original_name | string (255 chars) | No | The filename the teacher uploaded |
| stored_path | string (255 chars) | No | The filesystem path to the stored PDF file |
| extracted_text | longText | Yes (nullable) | The complete text extracted from the PDF. Marked nullable in case extraction fails or is pending. |
| created_at | timestamp | No | When the record was created (set automatically by Laravel) |
| updated_at | timestamp | No | When the record was last updated (set automatically by Laravel) |

## Key Design Decisions

### Why `longText` for extracted text?

Regular `string` columns in MySQL are limited to 255 characters. A typical course book can have thousands of characters of text. Laravel's `longText` type maps to MySQL's `LONGTEXT` data type, which can hold up to 4 GB of text. This is overkill for a course book, but ensures no extracted text will ever be truncated.

### Why is `extracted_text` nullable?

Future error handling (Phase 9 — Polish) might allow saving a document even if text extraction fails temporarily. This nullable field lets that happen. For now, `extracted_text` should always be populated by `DocumentController::store()`.

### Why are `created_at` and `updated_at` included?

These are standard Laravel timestamps. They automatically record when records are created and modified, which is useful for sorting documents by upload date (as `DocumentController::index()` does) and for debugging.

## Migration Methods

### `up()`

**What it does:** Runs when the migration is applied (usually when you run `php artisan migrate`). Creates the `documents` table with the columns listed above.

### `down()`

**What it does:** Runs when the migration is rolled back (usually when you run `php artisan migrate:rollback`). Drops the `documents` table, undoing the schema change. This is essential for development — if you make a mistake, you can roll back and try again without manual SQL.

## How It Fits Into the App

This migration was run as part of Phase 2 setup. Every time a developer clones this project and runs `php artisan migrate`, this migration ensures they have a `documents` table ready to store uploaded PDFs.

The `DocumentController::store()` method writes records to this table. The `DocumentController::index()` method queries it. The Document model maps to it.

In Phase 7 (Save & Library), a new `activities` table will be created that likely has a foreign key reference back to `documents` (so activities can be linked to the document they were generated from).
