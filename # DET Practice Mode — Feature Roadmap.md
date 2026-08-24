# DET Practice Mode — Feature Roadmap

## Scope Guard

**In scope (7 question types):**
- Read and Select
- Fill in the Blanks
- Read and Complete
- Interactive Reading (5 linked sub-tasks: complete the sentence, complete the passage, highlight the answer, identify the idea, title the passage)
- Speak About the Photo ("Describe the Photo")
- Read, Then Speak
- Interactive Speaking

**Explicitly out of scope:**
- Listen and Type
- Interactive Listening
- Write About the Photo
- Interactive Writing
- Writing Sample
- Speaking Sample
- Any DET scoring, subscore estimation, or adaptive difficulty engine
- Any DET branding, logos, or verbatim reproduction of their prompts/passages — content is original, built to match the *format*, not the source

**Goal:** Give the student the exact rhythm of the real question types — read-time, speak-time, blank-filling under light time pressure — but self-paced and teacher-controlled in Zoom, so practice doesn't feel like a countdown-panic simulator. Speaking types are practiced live: the app shows the prompt and runs the timer, the teacher listens over Zoom and gives feedback directly. **No audio is recorded, captured, or stored anywhere.**

**Priority:** the student struggled most with vocabulary and reading on her last attempt, so Part A (Read and Select, Fill in the Blanks, Read and Complete, Interactive Reading) is the higher-value build. Speaking practice (Part B) matters too but is lower urgency and much simpler to build now that there's no recording involved.

---

## Part A — Text/Static Practice (Phases 1–4)

### Phase 1: Question Bank Data Model
- Define a JSON schema per question type (mirrors the pronunciation feature's local JSON approach — no database needed for content)
- `read_select.json`: arrays of real words + plausible non-words, difficulty tag
- `fill_blank.json`: sentence, target word, partially-revealed letters, distractors (optional)
- `read_complete.json`: paragraph text with blank markers, options per blank
- `interactive_reading.json`: passage + array of 5 sub-tasks with type, prompt, options/target
- Build a small content-authoring helper (script or admin page) so you can generate/paste new sets without touching code

### Phase 2: Read and Select + Fill in the Blanks Components
- Read and Select: word grid, click-to-toggle, optional per-item soft timer (5s reference, adjustable/disable-able)
- Fill in the Blanks: sentence render with an editable blank, letter-count hint, immediate or end-of-set feedback toggle
- Shared "practice session" wrapper: progress indicator, pause, redo

### Phase 3: Read and Complete + Interactive Reading
- Read and Complete: paragraph with multiple dropdown/choice blanks, submit-all-then-reveal pattern
- Interactive Reading: passage pane + sequential sub-task pane (5 tasks), including the "highlight the answer" interaction (click/drag to select passage text) as the one genuinely new UI pattern here
- Reuse PDF-to-content pipeline where useful: a teacher-supplied passage could seed Interactive Reading content instead of hand-authoring every passage

### Phase 4: Zoom Presentation Mode for Static Types
- Fullscreen teacher-controlled view (matches existing Lesson Generator presentation mode)
- Teacher controls: reveal timer or go untimed, advance/reset, show/hide answers
- End-of-set summary screen (no scoring, just "here's what we covered")

---

## Part B — Live Speaking Practice (Phases 5–7)

No microphone capture, no storage, no playback — the app is just a prompt + timer display. The teacher hears the student directly through the normal Zoom call audio, same as any live conversation.

### Phase 5: Speaking Timer Component
- Shared two-phase timer: **read-time** (silent countdown, matches real DET timing e.g. ~20s) → **speak-time** (visible countdown, e.g. 30–90s depending on type)
- On speak-time end, just moves to "done" state — no capture step at all
- This single component is reused by all three speaking types below

### Phase 6: Speak About the Photo + Read, Then Speak
- Photo prompt bank (curated/teacher-uploaded images) and text prompt bank, each feeding the Phase 5 timer
- Functionally near-identical — the only difference is an image vs. a text prompt before the timer starts
- Good first build since it's the simplest content shape

### Phase 7: Interactive Speaking
- Chained sequence of 6–8 prompts, each running its own read/speak cycle from Phase 5
- Teacher advances through the sequence in Zoom mode same as the other question types; student answers live each time
- No session state to manage beyond "which prompt are we on" — much lighter than a recording-based version would've been

---

## Suggested Build Order

1. Phase 1 → 2 → 3 → 4 (vocabulary/reading types first — matches where the student actually struggled, and is the fastest path to something usable in the next class)
2. Phase 5 → 6 → 7 (speaking practice — simple once Phase 5's timer exists)

## Open Questions to Resolve Before Building
- Should difficulty/content sets be reusable across students, or built per-student session?
- For Interactive Reading's "highlight the answer" — text-selection UI or click-a-sentence simplification?