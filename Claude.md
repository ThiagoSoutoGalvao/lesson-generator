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
Phase 10 deployment ✅ COMPLETED. App is live at `https://lesson-generator-production-9da7.up.railway.app`. Beta users registered. See Phase 10 notes below for full deployment details.

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

### PHASE 10 — Deployment ✅ COMPLETED

**Platform:** Railway (Hobby plan, ~$5/month)
**Live URL:** `https://lesson-generator-production-9da7.up.railway.app`
**Stack:** FrankenPHP (via Railpack auto-detection) + Railway MySQL plugin

**What works:**
- App is fully live: login, PDF upload, audio upload, activity generation, save/library
- Audio transcription runs in the same container as the web server (queue worker in background)
- All users scoped: documents and activities are private per user account
- 4 beta users registered: Fernando, Sapulha, Daniel, Hianna

**Deployment fixes applied (in order):**
1. `guest.blade.php` — removed `app.js` from `@vite()` (Alpine.js unused on login page; fixes Vite manifest 500)
2. `vite.config.js` — entry point corrected to `resources/js/App.jsx` (capital A — Linux is case-sensitive)
3. `composer.json` — PHP version bumped to `^8.4` to match Railway's installed version
4. `bootstrap/app.php` — `$middleware->trustProxies(at: '*')` added so Railway's reverse proxy passes HTTPS correctly
5. `APP_URL` set to `https://...` in Railway Variables (was `http://`, caused mixed-content asset errors)
6. Queue worker runs inside web container: start command is `php artisan migrate --force && php artisan queue:work --tries=3 --timeout=300 & /start-container.sh` — avoids separate-container filesystem isolation problem

**User scoping (added post-launch):**
- `user_id` added to `documents` and `activities` tables via migrations `2026_05_11_000001` and `2026_05_11_000002`
- Migrations are idempotent (`Schema::hasColumn` guard) — safe to re-run
- `DocumentController`, `AudioUploadController`, `SavedActivityController`, `ActivityController` all scoped to `auth()->id()`
- Existing records with `null` user_id are invisible to all users (orphaned from before scoping was added)

**Registration:**
- Public registration is currently OPEN (routes/auth.php still has register routes)
- Once all beta users have accounts, remove the two `register` routes from `routes/auth.php` and push

**Environment variables on Railway web service:**
- `APP_NAME`, `APP_ENV=production`, `APP_KEY`, `APP_DEBUG=false`
- `APP_URL=https://lesson-generator-production-9da7.up.railway.app`
- `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT=3306`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` (Railway MySQL plugin)
- `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`, `CACHE_STORE=database`, `FILESYSTEM_DISK=local`
- `LOG_LEVEL=error`, `PORT=8080`
- `ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY`, `OPENAI_API_KEY`

**Railpack behaviour (important):**
- Railway uses Railpack (not Nixpacks) — `nixpacks.toml` is present but start command is overridden via Railway service settings
- Railpack auto-detects PHP + Laravel + Node; uses `dunglas/frankenphp:php8.4` base image
- Build steps cached by Docker layer; touching `package.json` busts the npm cache layer
- Config/route/view caching happens at BUILD time; `start-container.sh` clears and re-caches at runtime
- Local disk on Railway is ephemeral (lost on redeploy) — acceptable for beta since PDF text and audio transcripts are stored in MySQL

**Key file locations:**
- `nixpacks.toml` — present but start command overridden in Railway service settings
- `resources/views/layouts/guest.blade.php` — Breeze auth layout, loads CSS only (no app.js)
- `resources/views/welcome.blade.php` — main SPA shell, loads `App.jsx`
- `vite.config.js` — entry points: `app.css`, `app.js`, `App.jsx`
- `bootstrap/app.php` — proxy trust + API session middleware configured here

---

### PHASE 11 — Monetization

**Goal:** Get the first paying customer. Everything in this phase is ordered to reach that goal as fast as possible — build the payment system, validate it with beta users, then gradually expand to the wider market.

---

#### 11.1 — Pricing Model

Three tiers:

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 10 generations/month, no audio upload, no save |
| **Pro** | $12/month | Unlimited generations, all 14 templates, audio upload, save & library |
| **School** | $49/month | Everything in Pro, up to 5 teacher accounts under one subscription |

**Why these numbers:**
- $12 is below the psychological "expensive" threshold for a solo teacher. One saved hour of manual prep per month justifies it.
- $49 for schools targets language schools and academies — a single institutional sale equals 4 individual subscriptions.
- Free tier is generous enough to experience the value but limited enough to hit the wall quickly.

---

#### 11.2 — Technical Setup: Stripe + Laravel Cashier

Stripe is the industry standard for SaaS subscriptions. Laravel Cashier is the official Laravel package that wraps Stripe — it handles subscriptions, billing cycles, invoices, and webhooks automatically.

**Step 1 — Create a Stripe account**
- Go to stripe.com and sign up (free)
- In the Stripe dashboard → Products → create two products:
  - "Pro" — $12/month recurring
  - "School" — $49/month recurring
- Copy the **Price ID** for each (looks like `price_1ABC...`) — you'll need these later

**Step 2 — Install Laravel Cashier**
```bash
composer require laravel/cashier
php artisan vendor:publish --tag="cashier-migrations"
php artisan migrate
```
This adds `subscriptions` and `subscription_items` tables to the database.

**Step 3 — Configure Cashier**
Add to `.env`:
```
STRIPE_KEY=pk_live_...        # Publishable key (from Stripe dashboard → Developers → API keys)
STRIPE_SECRET=sk_live_...     # Secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Generated when you set up a webhook (step 5)
```

Add to `config/services.php`:
```php
'stripe' => [
    'model'   => App\Models\User::class,
    'key'     => env('STRIPE_KEY'),
    'secret'  => env('STRIPE_SECRET'),
    'webhook' => ['secret' => env('STRIPE_WEBHOOK_SECRET'), 'tolerance' => 300],
],
```

**Step 4 — Update the User model**
Add the `Billable` trait:
```php
use Laravel\Cashier\Billable;

class User extends Authenticatable {
    use Billable;
}
```

**Step 5 — Set up a Stripe Webhook**
Webhooks tell your app when a payment succeeds or a subscription is cancelled.
- In Stripe dashboard → Developers → Webhooks → Add endpoint
- URL: `https://lesson-generator-production-9da7.up.railway.app/stripe/webhook`
- Events to listen for: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
- Copy the signing secret → paste as `STRIPE_WEBHOOK_SECRET` in Railway Variables

**Step 6 — Add the webhook route**
In `routes/web.php`:
```php
Route::post('/stripe/webhook', '\Laravel\Cashier\Http\Controllers\WebhookController@handleWebhook');
```
This route must be CSRF-exempt. In `bootstrap/app.php` add it to the CSRF exception list.

**Step 7 — Add generation counting**
Add a `generations_this_month` integer column and `generations_reset_at` date column to the `users` table via a migration. In `ActivityController::generate()`, before generating:
```php
$user = auth()->user();
if (!$user->subscribed('default') && $user->generations_this_month >= 10) {
    return response()->json(['message' => 'Free limit reached. Upgrade to Pro for unlimited generations.'], 403);
}
// after successful generation:
$user->increment('generations_this_month');
```
Reset the counter monthly via a scheduled command (`php artisan schedule:run` added to start command).

**Step 8 — Build the checkout flow**
When a user clicks "Upgrade", redirect them to a Stripe Checkout page (hosted by Stripe — no card form to build yourself):
```php
return $user->newSubscription('default', 'price_1ABC...')
    ->checkout([
        'success_url' => route('billing.success'),
        'cancel_url'  => route('billing.cancel'),
    ]);
```
Stripe handles the entire payment UI. After payment, Stripe redirects back to your `success_url`.

**Step 9 — Add a billing management page**
Let users cancel or update their card via Stripe's hosted portal:
```php
return $user->redirectToBillingPortal(route('home'));
```

---

#### 11.3 — What to Build in the App

**Upgrade prompt (most important UI element)**
When a free user hits 10 generations, show a modal:
> *"You've used your 10 free generations this month. Upgrade to Pro for $12/month and generate unlimited activities."*
With a single "Upgrade now" button that starts the Stripe checkout.

**Pricing page (`/pricing`)**
A simple page (can be a React route) showing the three tiers side by side. Each "Get started" button goes to Stripe Checkout. Link it from the navbar.

**Account/billing page (`/account`)**
Shows: current plan, generations used this month, next billing date, and a "Manage billing" button (opens Stripe portal).

**Badge in navbar**
Show "Free — X/10 generations used" for free users. Disappears on Pro. Constant gentle reminder of the limit.

---

#### 11.4 — Before You Build: Validate First

Before writing any code, do this:

1. Message your 4 beta users individually (not in the group): *"I'm thinking of charging $12/month for full access. Would you pay that?"*
2. If 2 or more say yes → build the payment system immediately.
3. If they all say no → ask why. Fix the product issue before building billing.

This one conversation can save you weeks of development.

---

#### 11.5 — Marketing: Getting the First Strangers to Pay

Do these in order. Each step validates the next.

**Step 1 — Make a 60-second screen recording**
Record yourself: open the app, upload a page, type a prompt, watch the activity generate. No voice needed — just screen + upbeat music. This is your core marketing asset. Use it everywhere.

**Step 2 — Post in Facebook Groups (week 1)**
Search Facebook for: "TEFL teachers", "English teachers abroad", "Online ESL teachers", "EFL teachers". These groups have 10k–100k members each. Post the screen recording with a caption like:
> *"I built a tool that generates classroom activities from any course book in seconds. Free to try — would love feedback from teachers."*
Do NOT post a sales pitch. Lead with the demo and ask for feedback. Include the link.

**Step 3 — Post on Reddit (week 1)**
- r/TEFL (~80k members)
- r/languagelearning (~2M members)
- r/Teachers
Same approach: share the video, ask for feedback, no hard sell.

**Step 4 — Instagram/TikTok Reels (ongoing)**
Short videos (15–30 seconds) in the format: *"POV: you need to make 5 activities before your next class"* → generate them in 10 seconds. This format performs well in teaching niches. Post 3x/week for a month and measure which videos get shares.

**Step 5 — Teachers Pay Teachers / Tes listing (week 2)**
Create a free resource (e.g. "10 free ESL activities for Speak Out B1") and upload it to TPT and Tes. In the description mention Lesson Generator as the tool used to create them. High-intent buyers browse these platforms actively.

**Step 6 — Cold email language schools (month 2)**
Search for "online English school", "online TEFL academy". Find the director's email (usually on the website). Send a short email:
> *"Hi [name], I run a tool that lets English teachers generate classroom activities from course books in seconds — cuts prep time from 30 minutes to 30 seconds. Would you be open to a free trial for your teachers?"*
Target 20 schools per week. Even a 5% response rate gives you leads.

**Step 7 — Find one TEFL YouTuber or blogger (month 2)**
Search YouTube for "TEFL tips", "how to teach English online". Find a creator with 5k–50k subscribers (big enough to matter, small enough to reply to emails). Offer them 3 free months of Pro in exchange for an honest review video or blog post. One good recommendation from a trusted voice is worth 100 ads.

**Step 8 — Product Hunt launch (month 3)**
Product Hunt is a website where people discover new tools. A well-prepared launch can bring 500–2000 visitors in a single day. Prepare a good description, screenshots, and a demo video. Schedule the launch for a Tuesday or Wednesday (highest traffic days). Ask your network to upvote on launch day.

---

#### 11.6 — Revenue Targets (Realistic Timeline)

| Month | Goal | What needs to happen |
|-------|------|----------------------|
| Month 1 | 1st paying user | Beta user converts, payment system live |
| Month 2 | 10 paying users | Facebook/Reddit posts driving signups |
| Month 3 | 25 paying users | First school account or influencer post |
| Month 6 | 50 paying users | $600 MRR — covers Railway + API costs with profit |
| Month 12 | 150 paying users | $1,800 MRR — meaningful side income |

At 150 Pro users ($12) that is $1,800/month recurring. This is achievable within a year for a niche SaaS with a real use case.

---

#### 11.7 — On Copycats

The concern is valid but premature. Copycats only show up when there is money to copy. By the time someone builds a competing product, you will have:
- An established user base with saved activities (switching cost — they lose their library)
- Prompt templates refined over hundreds of real classroom uses
- A brand teachers already trust
- A head start on features they have been requesting

The real moat is iteration speed and user trust, not the code. Keep shipping improvements based on what your users ask for — that is the one thing a copycat starting from scratch cannot fake.

---

#### 11.8 — What to Do This Week (Action List)

1. ✅ Send individual messages to 4 beta users asking if they would pay $12/month
2. ✅ Create a Stripe account and set up the Pro and School products
3. ✅ Install Laravel Cashier and run migrations locally, then push
4. ✅ Record a 60-second screen demo of the app
5. ✅ Post in 3 Facebook TEFL groups and 2 subreddits
6. ✅ Add `STRIPE_KEY` and `STRIPE_SECRET` to Railway Variables

**Commit target:** `Phase 11: Stripe + Cashier setup, pricing page, generation limits`
