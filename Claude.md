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
- Timer is 30s countdown per question; turns red at 10s, auto-reveals answer at 0

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

### PHASE 6 — Unjumble Activity
**Goal:** Generate and display a sentence unjumble exercise.

Tasks:
- Define JSON schema for unjumble (sentence split into shuffled word tiles)
- Build unjumble component: word tiles that can be clicked/dragged into order
- Add reveal answer button
- Show correct/wrong feedback per sentence

**Test:** Generate 6 unjumble sentences. Reordering and reveal work.
**Commit:** `Phase 6: Unjumble activity`

---

### PHASE 7 — Save & Library
**Goal:** Teacher can save activities and reload them later.

Tasks:
- Database table: `activities` (name, type, content JSON, tags, created_at)
- Save button on activity display screen
- Activity library page: list saved activities by type/tag
- Load saved activity and display it exactly as generated

**Test:** Save a quiz, close the app, reopen library, relaunch the same quiz.
**Commit:** `Phase 7: Save and activity library`

---

### PHASE 8 — Fullscreen Presentation Mode
**Goal:** A clean fullscreen view optimised for Zoom screen sharing.

Tasks:
- Fullscreen toggle button on activity display
- Hide all teacher UI except minimal controls (prev/next/reveal)
- Large text, high contrast, centred layout
- Keyboard shortcuts (space = next, R = reveal)

**Test:** Enter fullscreen, share screen on Zoom, confirm layout looks good.
**Commit:** `Phase 8: Fullscreen presentation mode`

---

### PHASE 9 — Polish & Beta Prep
**Goal:** App is stable and ready to share with 5 colleagues.

Tasks:
- Error handling (API failures, bad PDFs, empty responses)
- Loading states and spinners
- Basic auth (simple password or Laravel Breeze) so only invited users can access
- Clean up UI inconsistencies
- Write a short README with setup instructions

**Test:** Ask a colleague to use it without your help. Note friction points.
**Commit:** `Phase 9: Polish and beta prep`

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
**Phase 6 — Unjumble Activity** is next.
