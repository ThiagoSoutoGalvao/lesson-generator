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

### 4.3 Activity Types (current — 14 templates)
1. **Multiple Choice Quiz** — question + 4 answer buttons, color feedback (green/red), score counter, navigation
2. **Flashcards** — word/definition flip cards, "Got it / Still learning" deck logic, question mode toggle
3. **Unjumble** — scrambled sentence word tiles, drag or click to reorder, reveal answer
4. **Dialog Gap-Fill** — scripted dialogue with blanks, 3 A/B/C card options per blank, scroll-to-bottom on advance
5. **True/False/Not Given** — reading passage + 6 statements, P key toggles passage panel
6. **Image Vocabulary Match** — word tiles + image grid, click-to-match, number badges, batch image loading
7. **Word Categorisation** — drag-and-drop words into 2–3 categories, Check Answers color feedback
8. **Word Formation** — root word displayed large, gapped sentence revealed on tap
9. **Odd One Out** — set of word tiles, click the odd one out, explanation revealed
10. **Cloze** — gapped passage with word bank, click blank to reveal answer
11. **Discussion Questions** — large question + follow-up prompts, arrow key navigation
12. **Sentence Transformation** — original sentence + key word + stem, reveal transformed answer
13. **Error Correction** — sentence with underlined error, reveal correct form + explanation
14. **Matching Pairs** — two-column term ↔ definition grid, click-to-match, wrong flash animation

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
Phase 10 deployment — in progress. App is live on Railway but blocked by a Vite manifest error on the login page. See Phase 10 notes below.

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

#### Phase C — Section Focus ✅ COMPLETED (commits `d417a55`, `6e58d72`)
- 4 fixed purple pills on Generate page: **Vocabulary | Grammar | Listening | Reading** (appears when a document is selected)
- Clicking a pill toggles it on/off; clicking again deselects (back to full text)
- When active, prepends "Focus specifically on the [X] section of this text." to the generation prompt
- ActivityController validates `section_focus` and prepends the focus hint to the prompt
- SectionController + `/api/detect-sections` endpoint also exist for future dynamic detection use

#### Phase D — Flashcard Question Mode ✅ COMPLETED (commit `cb85e2a`)
- Toggle button in flashcard header: **Word → Definition** (normal) / **Definition → Word** (question mode)
- In question mode: front shows definition + example with "What's the word?" hint; back reveals the word
- Toggling resets the current card to unflipped; purple styling when active

#### Phase E — PDF Upload Size Help ✅ COMPLETED (commit `cb85e2a`)
- Browser-side file size check runs before upload starts (no wasted server request)
- Files over 500 MB show an amber banner immediately with direct links to ilovepdf.com and smallpdf.com
- Normal error messages (wrong file type, server errors) still use the red banner as before

#### Phase F — New Activity Templates ✅ COMPLETED
Added 7 new activity templates (total now 14):
- **Odd One Out** — set of word tiles, click the odd one out, explanation revealed; `OddOneOutActivity.jsx`
- **Cloze** — gapped passage with shuffled word bank, click blank to reveal (numbered), Reveal All button; `ClozeActivity.jsx`
- **Discussion Questions** — large question cards + follow-up prompts, arrow key / Space navigation; `DiscussionQuestionsActivity.jsx`
- **Sentence Transformation** — original + key word + stem → reveal full transformed answer; `SentenceTransformationActivity.jsx`
- **Error Correction** — sentence with underlined error, reveal strikethrough + correction + explanation; `ErrorCorrectionActivity.jsx`
- **Matching Pairs** — two-column term ↔ definition click-to-match, wrong pair flashes red 600ms, green when matched; `MatchingPairsActivity.jsx`
- **Word Formation** — root word displayed large, sentence with blank, reveal transformed word; `WordFormationActivity.jsx`
- All new templates share the same header pattern: progress counter, A-/A+, Save, fullscreen (F key), close (✕)
- All new templates registered in `ActivityController::generate()` and `GeneratePage` activity type buttons

#### Phase G — Audio Upload ✅ COMPLETED
- Teacher can upload an MP3/WAV audio file (e.g. a listening exercise track) in addition to PDF
- `AudioUploadController` stores the file; `TranscriptionService` calls Whisper API (OpenAI) to transcribe
- `TranscribeAudioJob` runs transcription in the background (Laravel queue); document `status` column tracks `pending → transcribing → ready | failed`
- `GET /api/documents/{id}/status` endpoint polled by frontend until status = `ready`
- `GeneratePage` shows a spinner with "Transcribing audio…" while polling; once ready, the document appears in the selector like a normal PDF
- `OPENAI_API_KEY` in `.env` used for Whisper; model: `whisper-1`
- `documents` table: `type` column (`pdf` | `audio`), `status` column (`ready` | `pending` | `transcribing` | `failed`)

#### Phase H — Local Background Images ✅ COMPLETED
- Layout background replaced: instead of fetching from Unsplash each load, `/public/backgrounds/` folder holds static local photos
- Files: `upload.jpg`, `generate.jpg`, `pic1.jpg`–`pic5.jpg`
- Layout and page-specific components pick from these based on context (upload page uses `upload.jpg`, generate page uses `generate.jpg`, library cycles through `pic1`–`pic5`)
- Removes Unsplash dependency from the main UI shell; activity-level backgrounds still use `/api/background` (Unsplash + Picsum fallback)

#### Phase J — Per-Activity Font Color + Activity UI Polish ✅ COMPLETED
- **Font-color selector** added to 5 activities: DialogGapFill, TrueFalse, DiscussionQuestions, ErrorCorrection, MatchingPairs
  - 5 color swatches in the header (White / Cream / Yellow / Sky / Green); active swatch gets a white ring
  - Applies to main content text; correct/wrong feedback colors are always preserved
- **DialogGapFill**: option cards changed from stacked column to horizontal row (`flex gap-3`, each `flex-1 flex-col items-center`); letter badge on top, text centered below
- **TrueFalse**: font-size selector now correctly applied to option buttons (was hardcoded `text-lg`); passage widened to `md:w-[62%]`; feedback box now uses `${FONT_SIZES[fontSizeIdx]} px-6 py-4` to match option size
- **DiscussionQuestions**: follow-up pills bumped to `['text-lg','text-xl','text-2xl']` and `px-5 py-3`; pills are now clickable buttons — clicking one promotes it to the main question and removes it from the pills row; navigating to next/prev question resets back to original
- **ErrorCorrection**: font sizes bumped to `['text-2xl','text-3xl','text-4xl']`; card now `flex-1 flex flex-col` so it fills the screen; Why panel has `flex-1 pt-8` (more top margin, takes ~40% of card); Why text bumped to `text-lg`
- **MatchingPairs**: `TERM_SIZES`/`DEF_SIZES` merged into single `CARD_SIZES = ['text-sm','text-base','text-lg']`; both columns use `min-h-[72px] py-4 px-4`; grid container is `overflow-y-auto` with centering wrapper so cards scroll instead of clipping; `gap-x-10` → `gap-x-16`

#### Phase I — Navbar Font Control + Per-Activity Font Selectors ✅ COMPLETED
- **Floating `FontTestPanel` removed** — replaced by permanent accessibility control in the navbar
- **Navbar font control** (in `Layout.jsx`):
  - A- / A+ size buttons (4 steps: 1rem / 1.25rem / 1.5rem / 1.875rem); first A+ press jumps to L (1.5rem), first A- to M (1.25rem)
  - 7 color swatches: White / Cream / Yellow / Orange / Green / Sky / Purple
  - Reset ✕ button appears when either size or color is active
  - Mechanism: sets `--tf-family`, `--tf-size`, `--tf-color` CSS custom properties on `document.documentElement` + `body.tf-active` class; CSS in `app.css` uses `!important` to override Tailwind in `.fixed.inset-0` and `main`
  - Comment in `app.css` updated from "Font tester" → "Accessibility font control (Aa button in navbar)"
- **Per-activity A-/A+ selector** added to all 14 activity components (TrueFalseActivity already had it from Phase A):
  - Added to: QuizActivity, FlashcardActivity, UnjumbleActivity, DialogGapFillActivity, ClozeActivity, DiscussionQuestionsActivity, SentenceTransformationActivity, ErrorCorrectionActivity, MatchingPairsActivity, OddOneOutActivity, WordFormationActivity, WordCategorisationActivity, ImageVocabMatchActivity
  - Each uses a local `fontSizeIdx` state (0–2, default=1) with a Tailwind class array; index 1 matches the component's previous hardcoded size so the default appearance is unchanged
  - The two systems coexist: per-activity control changes Tailwind classes; global navbar control applies `!important` CSS vars that override when active
- **UI polish also completed in this phase:**
  - Dialog Gap-Fill: option buttons redesigned as cards with circular A/B/C letter badge; scroll fix — replaced `scrollIntoView` sentinel with direct `scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight })` on the container ref
  - Unjumble: tile font size increased (default now `text-xl`)
  - Cloze: word bank and passage widened from `max-w-2xl` to `max-w-4xl`
  - Discussion Questions: default question size increased to `text-5xl` (from `text-4xl`)
  - Matching Pairs: columns equal width, term text centered with `flex items-center justify-center`, wider gap between columns (`gap-x-10`)
  - GeneratePage: activity type buttons container changed to `justify-center` so pills are always centered

---

### PHASE 10 — Deployment (IN PROGRESS)

**Platform:** Railway (Hobby plan, ~$5/month)
**Stack:** FrankenPHP (via Railpack auto-detection) + Railway MySQL plugin

**What works:**
- Build succeeds: PHP 8.4, Node 22, composer install, npm run build, all artisan cache commands
- FrankenPHP starts and serves on port 8080
- MySQL connected, migrations run successfully
- Custom start command: `php artisan migrate --force && /start-container.sh`

**Current blocker:**
- 500 error on login page: `Unable to locate file in Vite manifest: resources/js/app.js`
- `resources/views/layouts/guest.blade.php` (Breeze auth layout) loads `@vite(['resources/css/app.css', 'resources/js/app.js'])`
- `vite.config.js` previously only had `App.jsx` as entry point (capital A — case mismatch on Linux)
- Fix applied: added `resources/js/app.js` and `resources/js/app.jsx` (lowercase) to `vite.config.js` input array
- Error persists — likely because Railpack is still serving the cached npm build from before the fix

**Environment variables set on Railway web service:**
- `APP_NAME`, `APP_ENV=production`, `APP_KEY`, `APP_DEBUG=false`, `APP_URL`
- `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT=3306`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` (from Railway MySQL plugin)
- `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`, `CACHE_STORE=database`, `FILESYSTEM_DISK=local`
- `LOG_LEVEL=error`, `PORT=8080`
- `ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY`, `OPENAI_API_KEY`

**Railpack behaviour (important):**
- Railway switched from Nixpacks to Railpack — `nixpacks.toml` is detected but Railpack overrides the start command
- Railpack auto-detects PHP + Laravel + Node; uses `dunglas/frankenphp:php8.4` base image
- Build steps are heavily cached by Docker layer; a code change that doesn't touch `package.json` or `package-lock.json` may not invalidate the `npm run build` cache
- To force a full rebuild: change `package.json` (e.g. add a space in a comment field) to bust the npm cache layer
- Config/route/view caching happens at BUILD time with no env vars; `start-container.sh` clears and re-caches at runtime — env vars are always fresh at startup

**Next steps to unblock:**
1. Force Railpack to re-run `npm run build` by busting the cache (touch package.json or add a dummy script)
2. OR fix `guest.blade.php` to not require `app.js` at all — the login page only needs CSS for this app; Alpine.js is unused
3. After login works: create first user via Railway shell → `php artisan tinker`
4. Set up queue worker service for audio transcription (second Railway service, same repo, start command: `php artisan queue:work --tries=3 --timeout=120`)

**Key file locations:**
- `nixpacks.toml` — present but partially overridden by Railpack
- `resources/views/layouts/guest.blade.php` — Breeze auth layout, loads app.js
- `resources/views/welcome.blade.php` — main SPA shell, loads app.jsx
- `vite.config.js` — entry points: `app.css`, `app.js`, `app.jsx`
