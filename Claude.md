# Lesson Generator — Project Brief & Technical Roadmap

---

## 1. Project Overview

**Lesson Generator** is a web application built for English teachers who teach one-on-one classes online (via Zoom or similar tools). The app allows a teacher to upload a course book in PDF format and use AI to automatically generate interactive classroom activities — such as multiple choice quizzes, flashcards, and sentence unjumble exercises — based on the book's content.

The generated activities are displayed fullscreen in a visually rich interface designed to be shared via screen share during live online classes. Students do not need to install anything or create an account. The teacher drives the activity from their screen.

Activities can be saved and reused across future classes, eliminating the need to regenerate content every session.

---

## 2. The Problem It Solves

Teachers who use platforms like Wordwall spend significant time daily creating exercises manually — writing questions, formatting answers, and adapting content per student or unit. This is repetitive work that AI can automate.

Lesson Generator replaces that manual workflow with a simple prompt: the teacher selects a unit, describes what they want ("10 vocabulary questions from unit 3"), and the app generates a ready-to-use, visually polished activity in seconds.

---

## 3. Target Users

- **V1:** Solo use — the teacher building the app (learning tool + personal productivity)
- **V2:** 5 colleagues invited for beta feedback (no public registration yet)
- **V3:** Potential monetization — subscription model for language teachers

---

## 4. Core Features

### 4.1 PDF Upload & Processing
- Teacher uploads a course book PDF (e.g. Speak Out)
- The app extracts and indexes the text content
- Teacher can select a unit or chapter to focus on

### 4.2 AI Activity Generation
- Teacher types a natural language prompt:
  - *"Generate 5 multiple choice questions about travel vocabulary from unit 3"*
  - *"Create 8 flashcards for the key words in this unit"*
  - *"Make an unjumble activity with 6 sentences about daily routines"*
- The app sends the relevant text + prompt to the Claude API
- Claude returns structured JSON with the activity content
- The app renders it instantly as an interactive activity

### 4.3 Activity Types (V1)
1. **Multiple Choice Quiz** — question displayed large, 4 answer buttons, click to reveal correct/wrong with color feedback, timer, score counter, navigation
2. **Flashcards** — word on front, definition/example on back, tap to flip, mark as known/learning
3. **Unjumble** — scrambled sentence displayed as word tiles, drag or click to reorder, reveal correct answer

### 4.4 Background Images (Unsplash Integration)
- Each activity is displayed over a thematic background image pulled from Unsplash's free API
- Background is chosen automatically based on the topic (e.g. "travel" → travel photo)
- Teacher can refresh to get a different image

### 4.5 Save & Reuse
- After generating an activity, teacher can save it with a name and tag (unit, topic, student name)
- Saved activities appear in a library and can be relaunched at any time
- No need to regenerate — the exact content and settings are preserved

### 4.6 Fullscreen Display Mode
- A dedicated presentation view optimised for Zoom screen sharing
- Large bold text, high contrast, clear answer feedback
- Minimal teacher UI (just prev/next/reveal controls)

---

## 5. Technical Stack

### Frontend
- **React** (Vite) — component-based UI
- **Shadcn/ui** — accessible, customisable component library (built on Radix UI + Tailwind)
- **Tailwind CSS** — utility-first styling
- **React Router** — page navigation

### Backend
- **Laravel (PHP)** — API routes, business logic, database management
- **Laravel Herd** — local development environment
- **MySQL** — database (via Herd)

### AI Integration
- **Anthropic Claude API** (claude-sonnet) — activity generation from PDF content
- **RAG pattern** — PDF text is extracted, chunked, and relevant sections passed to Claude with the teacher's prompt

### PDF Processing
- **spatie/pdf-to-text** (Laravel package) — extract text from uploaded PDFs

### External APIs
- **Unsplash API** (free tier) — background images fetched by topic keyword

### Storage
- **Laravel filesystem** — store uploaded PDFs and saved activity JSON
- **Database** — store activity metadata, tags, and content

### Version Control
- **Git + GitHub** — one commit per completed phase

---

## 6. Development Workflow

**Rule for every phase: Build → Test manually → Commit → Move on.**

Never start the next phase without committing the current one. This keeps Git history clean and makes it easy to roll back if something breaks.

```
git add .
git commit -m "Phase X: [description]"
git push origin main
```

---

## 7. Development Phases

---

### PHASE 1 — Project Setup ✅ COMPLETED
**Goal:** Working Laravel + React app running locally on Herd with a Hello World screen.

Tasks:
- ✅ Create Laravel project via Herd
- ✅ Install and configure Vite + React inside Laravel
- ✅ Install Tailwind CSS and Shadcn/ui
- ✅ Create a basic layout component with header
- ✅ Set up Git repo and push initial commit to GitHub
- ✅ Confirm app loads at local Herd URL

**Test:** App loads in browser, shows layout. No errors in console.
**Commit:** `Phase 1: Project setup — Laravel + React + Tailwind + Shadcn`

**Notes:**
- Laravel 13.6 with SQLite (default) — switch to MySQL when needed
- Shadcn/ui initialised with Radix + Vega preset (Lucide icons, Inter font)
- Entry point: `resources/js/app.jsx` — on Windows, this is case-insensitive with `App.jsx`
- `@viteReactRefresh` directive required in Blade template for React Fast Refresh to work
- `npm run dev` must be running in a terminal for local development

---

### PHASE 2 — PDF Upload
**Goal:** Teacher can upload a PDF and the text is extracted and stored.

Tasks:
- Build upload UI (drag and drop or file picker using Shadcn component)
- Laravel route to receive and store the PDF
- Install and configure `spatie/pdf-to-text`
- Extract text and save to database (table: `documents`)
- Display a success message and basic text preview

**Test:** Upload a real Speak Out PDF page. Confirm text appears in DB.
**Commit:** `Phase 2: PDF upload and text extraction`

---

### PHASE 3 — Claude API Integration (Basic) ✅ COMPLETED
**Goal:** Send a hardcoded prompt + PDF text to Claude and display the raw response.

Tasks:
- ✅ Store Claude API key in `.env`
- ✅ Create a Laravel service class `ClaudeService`
- ✅ Build a simple prompt input UI
- ✅ Send selected document text + teacher prompt to Claude
- ✅ Display raw JSON response on screen (no formatting yet)

**Test:** Type "Give me 3 quiz questions about vocabulary" — Claude responds with JSON.
**Commit:** `Phase 3: Claude API integration — basic prompt and response`

**Notes:**
- Uses Laravel HTTP client (Guzzle) to call Anthropic API directly — no PHP SDK needed
- Model: `claude-sonnet-4-6`
- `ClaudeService` injected via Laravel's service container into `ActivityController`
- API key stored in `.env` as `ANTHROPIC_API_KEY`, referenced via `config('services.anthropic.key')`

---

### PHASE 4 — Quiz Activity ✅ COMPLETED
**Goal:** Generate and display a fully working multiple choice quiz.

Tasks:
- ✅ Define the JSON schema Claude must return for a quiz
- ✅ Update the prompt to enforce the schema
- ✅ Parse Claude's response into a React quiz component
- ✅ Build the quiz UI: large question text, 4 answer buttons, color feedback (green/red), timer, score, navigation
- ✅ Add Unsplash background image based on topic keyword

**Test:** Generate a 5-question travel vocabulary quiz. All interactions work. Background loads.
**Commit:** `Phase 4: Quiz activity — generation, display, and Unsplash background`

**Notes:**
- `ClaudeService::generateQuiz()` uses a `system` prompt to enforce JSON-only output
- Each question includes a `keyword` field — used to fetch a different Unsplash/Picsum background per question
- `BackgroundController` proxies Unsplash API; falls back to Picsum (seed-based) when no key is set
- `sanitizeUtf8()` strips invalid UTF-8 from PDF text before sending to Claude (prevents json_encode errors)
- `UNSPLASH_ACCESS_KEY` stored in `.env`, referenced via `config('services.unsplash.key')`
- Timer was removed in Phase 9 — teachers need time to explain answers without pressure

---

### PHASE 5 — Flashcard Activity ✅ COMPLETED
**Goal:** Generate and display a working flashcard set.

Tasks:
- ✅ Define JSON schema for flashcards
- ✅ Build flashcard component: word front, definition back, flip animation
- ✅ Add "Got it / Still learning" buttons
- ✅ Show progress and end-of-deck summary

**Test:** Generate 8 flashcards from a unit. Flip and marking work correctly.
**Commit:** `Phase 5: Flashcard activity`

**Notes:**
- `ActivityController` now accepts a `type` field (`quiz` | `flashcards`) and routes via `match()`
- `GeneratePage` has a segmented toggle (Quiz | Flashcards); toggle buttons need `e.preventDefault()` inside a form
- Flip animation uses inline `preserve-3d` / `backface-visibility` styles — Tailwind has no built-in 3D transform utilities
- Deck logic: "Still Learning" cards loop back at end of round; "Got It" cards are removed; finishes when all are known
- Per-card Unsplash backgrounds reuse the same `/api/background` endpoint with each card's `keyword`

---

### PHASE 6 — Unjumble Activity ✅ COMPLETED
**Goal:** Generate and display a sentence unjumble exercise.

Tasks:
- ✅ Define JSON schema for unjumble (sentence split into shuffled word tiles)
- ✅ Build unjumble component: word tiles that can be clicked/dragged into order
- ✅ Add reveal answer button
- ✅ Show correct/wrong feedback per sentence

**Test:** Generate 6 unjumble sentences. Reordering and reveal work.
**Commit:** `Phase 6: Unjumble activity`

**Notes:**
- Claude returns `words` in the correct order; the frontend shuffles them (Fisher-Yates)
- Joining `words` with a single space must reproduce `sentence` exactly — punctuation stays attached to words (e.g. "morning." not "morning")
- Drag-and-drop uses HTML5 Drag API; drag source stored in `useRef` to avoid re-renders mid-drag; click also works
- `checkStatus`: idle → correct/wrong → (try again → idle) or (reveal → revealed) → next
- Tiles sized at `px-5 py-3 text-base` for readability on shared screens; `cursor-grab` on draggable tiles

---

### PHASE 7 — Save & Library ✅ COMPLETED
**Goal:** Teacher can save activities and reload them later.

Tasks:
- ✅ Database table: `activities` (name, type, content JSON, tags, created_at)
- ✅ Save button on activity display screen
- ✅ Activity library page: list saved activities by type/tag
- ✅ Load saved activity and display it exactly as generated

**Test:** Save a quiz, close the app, reopen library, relaunch the same quiz.
**Commit:** `Phase 7: Save and activity library`

**Notes:**
- `SavedActivityController` handles GET/POST/DELETE for `/api/activities`
- `SavePanel` component is shared across all three activity types — renders as a frosted overlay in the activity header
- Library page uses a fixed "learning English" Unsplash background with `bg-white/5 backdrop-blur-none` glass cards
- Vite file watcher on Windows has a case-sensitivity issue with `App.jsx` vs `app.jsx` — restart `npm run dev` if route changes don't apply after hard refresh
- `Activity` model casts `content` to array; stores the full Claude-generated JSON so activities relaunch identically

---

### PHASE 8 — Fullscreen Presentation Mode ✅ COMPLETED
**Goal:** A clean fullscreen view optimised for Zoom screen sharing.

Tasks:
- ✅ Fullscreen toggle button on all three activity components
- ✅ Keyboard shortcuts: Space = next/flip, R = reveal (Unjumble), F = toggle fullscreen
- ✅ Browser native fullscreen API (`document.requestFullscreen`)

**Test:** Enter fullscreen, share screen on Zoom, confirm layout looks good.
**Commit:** `Phase 8: Fullscreen presentation mode`

**Notes:**
- `useFullscreen` hook in `resources/js/hooks/useFullscreen.js` — shared across all three activity components
- `fullscreenchange` event keeps button icon in sync with actual state
- Activities already use `fixed inset-0` so they fill the screen before and after fullscreen toggle

---

### PHASE 9 — Polish & Beta Prep ✅ COMPLETED
**Goal:** App is stable and ready to share with 5 colleagues.

Tasks:
- ✅ Page range selector — teacher can target specific pages of a document when generating activities
- ✅ Guard against image-based PDFs — returns a clear error if no text is extracted
- ✅ Upload label corrected to "max 500 MB"
- ✅ Error handling (API failures, bad PDFs, empty responses) — `throwIfFailed()` in ClaudeService returns human-readable messages
- ✅ Loading states and spinners — shared `Spinner` component used across Generate, Upload, and Library pages
- ✅ Basic auth — Laravel Breeze (session-based); all API routes protected with `auth:web`; `EncryptCookies` + `StartSession` added to API middleware group
- ✅ UI cleanup and README written
- ✅ Four new activity templates: Dialog Gap-Fill, Word Categorisation, True/False/Not Given, Image Vocabulary Match
- ✅ Pre-filled default prompts on Generate page — one per activity type, fully editable
- ✅ Global glass UI — full-page background image (Unsplash, "cozy library bookshelves") in Layout; glass navbar; glass form cards on all pages
- ✅ Folder/book/lesson fields — SavePanel accepts book, lesson, and folder (datalist autocomplete); Library shows pill badges and folder filter row
- ✅ Activity type buttons redesigned — individual pill buttons with flex-1 stretch instead of a segmented bar

**Test:** Use the app for a week before deploying. Note friction points.
**Commit:** `Phase 9: Polish, new templates, glass UI, folder/book/lesson`

**Notes:**
- `pages_text` (JSON) and `page_count` added to `documents` table via migration `2026_05_03_000001_add_pages_to_documents_table.php`
- `DocumentController::store()` extracts text per-page using `smalot/pdfparser` `$pdf->getPages()` and sanitizes each page with `iconv('UTF-8', 'UTF-8//IGNORE', ...)`
- `ActivityController::generate()` slices `pages_text` array with `array_slice()` when `page_from`/`page_to` are provided; returns 422 if resulting text is empty
- `GeneratePage` shows page range inputs only after a document is selected; resets range on document change; `min`/`max` removed from HTML inputs to avoid browser native validation popups mid-typing
- Image-based (scanned) PDFs extract no text — character density check (`char_count / page_count < 100`) is a reliable heuristic to detect them
- Herd nginx config (`herd.conf`): `client_max_body_size 600M`, `fastcgi_read_timeout 300`, `fastcgi_send_timeout 300`
- Herd PHP config (`php84/php.ini`): `upload_max_filesize=500M`, `post_max_size=500M`, `memory_limit=512M`, `max_execution_time=300`
- These Herd config changes must be re-applied after a Herd reinstall
- Tailwind v4 (CSS-first via `@tailwindcss/vite`) — NOT PostCSS-based; `tailwind.config.js` is unused; config lives in `resources/css/app.css`
- Laravel Breeze auth: `SESSION_DRIVER=file` in `.env` (not database — no sessions table); CSRF token injected via `<meta name="csrf-token">` in `welcome.blade.php`
- `folder`, `book`, `lesson` columns added to `activities` table via migration `2026_05_04_000001_add_folder_book_lesson_to_activities_table.php`
- `GET /api/folders` returns distinct non-null folder names; used by SavePanel datalist for autocomplete
- Dialog Gap-Fill: 8–14 line dialogue, exactly 3 blanks with 3 options each; Space advances confirmed lines, F = fullscreen
- Word Categorisation: 2–3 categories, 4–6 words each; drag-and-drop + click; Check Answers reveals color-coded feedback
- True/False/Not Given: reading passage (80–150 words) + 6 statements (2T/2F/2NG); P toggles passage panel; Space advances after answering
- Image Vocabulary Match: 6 word–image pairs; images fetched in parallel via `/api/background`; click word then click image; Escape deselects

---

### PHASE 10 — Deployment
**Goal:** App is live on the internet.

Recommended stack:
- **Frontend + Backend:** Railway or Render — both support Laravel PHP apps for free/low cost
- **Database:** Railway MySQL (included) or PlanetScale (free tier)
- **File storage:** Cloudflare R2 or AWS S3 (for PDFs) — free tiers available
- **Domain:** Optional — Namecheap or Cloudflare (~$10/year)

Tasks:
- Set up production environment variables (Claude API key, Unsplash key, DB)
- Configure Laravel for production (cache, queues)
- Deploy and test full flow on live URL
- Share URL with beta users

**Commit:** `Phase 10: Production deployment`

---

## 8. Key Things You Will Learn

By building this project you will gain hands-on experience with:

- **RAG** — how to extract, chunk, and inject document content into an AI prompt
- **Prompt engineering** — structuring prompts to get consistent, parseable JSON from Claude
- **API integration** — calling external APIs (Claude, Unsplash) from a Laravel backend
- **React component architecture** — building reusable, stateful UI components
- **Shadcn/ui** — using a modern component library in a real project
- **Full-stack development** — connecting a React frontend to a Laravel API
- **Git discipline** — committing working increments, not broken code
- **Deployment** — taking a local app live on the internet

---

## 9. Session Context for Claude Code

When starting each phase, begin your session with:

> *"I am working on Lesson Generator, a Laravel + React app for English teachers. I am starting Phase [X]: [name]. Here is the current project structure: [paste tree]. The goal of this phase is [goal]. Let's start with [first task]."*

Keep each Claude Code session scoped to one phase. Do not ask it to jump ahead. Finish, test, commit, then start a new session for the next phase.

### Current Phase
Phases A and B complete. Currently mid-session working on Image Vocab Match improvements. Paused waiting for Unsplash rate limit to reset before continuing testing.

### Improvement Phases (post-Phase 9, pre-deployment)

#### Phase A — UI Fixes ✅ COMPLETED (commit `911a7f4`)
- Quiz: top-level `instruction` field in JSON schema; rendered above question so fill-gap tasks don't repeat the instruction on every card
- True/False: A-/A+ font size toggle (3 steps: text-xl → text-2xl → text-3xl), passage widened to 50% of screen, both passage and statement scale together
- Image Vocab Match: configurable 4/6/8 pair count selector on Generate page; word tiles moved to top of screen; grid adapts (2×2/2×3/2×4)
- Image Vocab Match: Unsplash keywords upgraded — Claude now writes 3-5 word descriptive scene phrases instead of single words

#### Phase B — Better Image Keyword Quality ✅ COMPLETED (commit `156c59c`)
- All prompt builders upgraded: Claude now returns 3-5 word descriptive scene phrases (e.g. "chef cooking pasta kitchen") instead of 1-2 word nouns
- Applied to: Quiz per-question keyword, Flashcards per-card keyword, Unjumble per-sentence keyword, True/False activity background, Word Categorisation background, Dialog Gap-Fill background

#### Image Vocab Match — In-progress fixes (commits `4329394`, `16c9477`, `c35ba38`, `6a5500b`)
- Added number badge (1, 2, 3…) to each image — students say the word and the picture number verbally
- Click-to-match mechanic kept: click word → click correct image → turns green
- Pair count options expanded to 4 / 6 / 8 / 12; grid adapts (2×2 / 2×3 / 2×4 / 4×3)
- Batch image loading: fetches 4 at a time instead of all at once to avoid Unsplash burst rate limit
- `auto-rows-fr` added to grid so rows always have height even before images load
- `BackgroundController`: falls back to Picsum when Unsplash fails or rate-limits (instead of returning null)
- Picsum fallback URL fixed: `rawurlencode()` so multi-word keyword phrases don't break the URL path
- **Known issue / Unsplash rate limit**: free tier allows 50 req/hour; 12-image activities burn through quota quickly during testing. When the limit is hit, Generate may appear to stall. Wait for the hourly reset and test again. Long-term fix: cache image URLs in the database so each keyword only fetches once.

#### Phase C — Section Detection & Targeting (planned)
#### Phase D — Flashcard Question Mode (planned)
#### Phase E — PDF Upload Size Help (planned)
