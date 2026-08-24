---
name: Phase D & E new features
description: Question mode for flashcards (Phase D) and client-side file size check for uploads (Phase E)
type: project
---

## Phase D: Flashcard Question Mode

Added a toggle button in the FlashcardActivity header that switches between two study modes:
- **Word → Definition** (normal): front shows word, back shows definition + example
- **Definition → Word** (question mode): front shows definition + example with "What's the word?" hint, back shows word

The mode button is styled with purple (`bg-purple-500/30`, `text-purple-200`) when active. Toggling the mode resets the current card to unflipped state.

**Why:** Gives teachers and students two ways to study the same deck — both cementing vocabulary from different angles within a single session without needing to regenerate content.

**How to apply:** When documenting flashcard-related changes or new activity features, note if they should support multi-directional study modes.

## Phase E: Browser-Side File Size Check

Added client-side validation to UploadPage that checks file size *before* sending to server. Files over 500 MB immediately show an amber warning banner (not red error) with direct links to two PDF splitting tools:
- ilovepdf.com/split_pdf
- smallpdf.com/split-pdf

This prevents bandwidth waste and server errors for oversized files.

**Why:** Users get immediate, actionable feedback with direct tools to solve the problem, rather than waiting for an upload to fail on the server.

**How to apply:** When adding other file uploads or size-constrained features, implement browser-side checks first with helpful remediation links where possible.
