# Aurora Student App — Feature Roadmap

**Status:** Planning. No code written yet. This doc is the scope guard and phased
build plan — same convention as `PronunciationFeature.md`, `DET Practice Mode —
Feature Roadmap.md`, `CambridgePracticeMode.md`. Build proceeds one phase at a
time with a manual checkpoint between phases.

---

## 1. Overview

A **student-facing** mode inside Lesson Generator. Aurora students log in from
home and work through the exercises for their trilha (Lights / Glow / Radiant),
lesson by lesson, at their own pace. Progress and scores are saved per student.

Today the app is entirely teacher-facing: a teacher generates activities and
presents them fullscreen over Zoom. Nothing is graded, nothing is tracked, and
the whole SPA sits behind a single `auth` gate with every record scoped to the
logged-in teacher's `user_id`. This feature adds a second kind of user on top of
that, reusing the trilha content the Aurora teachers are already building.

## 2. The problem it solves

Aurora's trilha library (the 5 baseline activities per lesson, tagged
`trilha` + `trilha_lesson`) is built for live class use only. Between classes,
students have nothing structured to practise with. This gives them a home for
self-study that mirrors exactly what they're covering in lessons — and, once
they're relying on it, a thing worth paying for.

## 3. Scope guard

### In scope (v1)

- A student **role** and individual student logins — teacher-created, teacher
  sets the password (email invite flow can be added later, no rework)
- A student shell: "My Trilha" → lesson list → lesson view → activity player
- Students see the **practice activities** for their assigned trilha — the
  quiz / vocab / grammar / speaking templates
- **Presentation, Reading Text and Essay Feedback are teacher-only** — delivered
  in the live lesson, never shown in the student app
- **Progress tracking** — per-activity completion and score, saved per student
- A teacher view of their students' progress

### Explicitly NOT in v1

- **Monetization** — no Stripe, no paywall, no trial logic. "Get them used to it
  first." Phase S6 below is a placeholder, deferred until real usage exists.
- **New activity types** — reuse the existing 14 templates as-is plus a progress
  layer. No purpose-built student activities.
- **Self-registration** — no public signup. Teachers create student accounts.
- **Student-authored content, messaging, gamification beyond simple progress**
- **Multi-trilha enrolment** — a student is on exactly one trilha at a time; the
  teacher moves them to the next when they finish.
- **Mobile-native app** — responsive web, no App Store build. But see §3a: the
  student app is **mobile-first**, not "desktop that also works on a phone".

## 3a. Design principle: mobile-first (student app only)

The teacher app stays desktop-first — that's where teachers want it, and Zoom
screen-share is a desktop context. **The student app is the opposite: most
students will use it on their phones.** Every student screen is designed for a
portrait phone first, then allowed to breathe on larger screens.

This has teeth for the "reuse the 14 templates" decision:

| Concern | Impact |
|---------|--------|
| **HTML5 drag-and-drop** (Unjumble, Word Categorisation) | Broken on mobile browsers. These need a tap-to-place interaction or a touch-DnD library before they can go in the student app — or they're dropped from the student experience. |
| **Keyboard shortcuts** (Space/R/P/F across most templates) | No-ops on a phone. Every action needs a visible tap target. |
| **Fullscreen API** | Unreliable on iOS Safari. The student player can't depend on it. |
| **Split-screen layouts** (True/False, Presentation L4, Interactive Reading) | Don't fit portrait. Need a stacked layout + a show/hide toggle for the passage. |
| **Font sizes** | Tuned for a projected Zoom screen — far too large on a phone. Need a mobile type scale. |

**The DET / Cambridge drills are already close to right for mobile** — tap-only,
`PracticeSessionShell` chrome, select → drill → results, built recently. The
student app should lean on *that* pattern as its backbone, and only pull in the
14 teacher templates that are already tap-friendly (Quiz, Flashcards, Cloze,
Dialog Gap-Fill, Odd One Out, Word Formation, Sentence Transformation, Error
Correction, Discussion Questions) — each restyled to a mobile scale. The
drag-and-drop two (Unjumble, Word Categorisation) and the dense grids (Image
Vocab Match, Matching Pairs) get a touch rework or wait.

## 4. Decisions already made (2026-09-03, via AskUserQuestion)

| Question | Decision |
|----------|----------|
| Where does it live? | **Student mode inside lesson-generator** — same codebase, DB, deployment. Reuses trilha data + saved activities + Breeze auth. |
| Student's main loop? | **Self-paced trilha practice** — student follows their trilha lesson by lesson, progress saved. |
| How do students get accounts? | **Individual student logins**, one account each, linked to a teacher + a trilha. Teacher-created, teacher sets the password (test phase). |
| How do activities work solo? | **Reuse the tap-friendly templates + add a progress layer**, with the DET / Cambridge drill pattern as the backbone (see §3a). Drag-and-drop templates need a touch rework first. |
| Design target? | **Mobile-first** for every student screen (§3a). Teacher app stays desktop-first. |

## 5. Architecture

### Roles
- Add `role` to `users`: `'teacher'` (default — every existing account) | `'student'`.
- The React app branches once, at the top of `App.jsx`: `role === 'student'`
  renders the student route tree (`/s/...`), everything else renders the current
  teacher app unchanged. The current user is already available to the SPA — the
  student branch reads `role` from the same place.
- `routes/web.php`'s catch-all stays as-is (whole SPA behind `auth`); the login
  page already works for any role.

### Content visibility — the key departure from current behaviour
Every controller today scopes to `auth()->id()`. Students must see activities
built under the **Aurora shared login** (a different `user_id`), filtered by
trilha, not by owner. **Decision: everything trilha-tagged is auto-visible.** A
student on Glow sees every Glow activity, grouped by lesson — no per-activity
publish step. Read path:

```
Activity::where('trilha', $student->trilha)
        ->where('student_visible', true)   // column defaults to true
        ->get()                            // NOT scoped to $student->id
```

`student_visible` (bool, default **true**) exists purely as an **escape hatch** —
if a teacher ever needs to pull one activity from students (a bad generation, a
draft), they can. No UI for it in v1; the column is settable directly / via a
later toggle. The default behaviour is "all trilha activities visible".

**Type exclusion** — `presentation`, `reading_text`, `essay_feedback` (and the
legacy `grammar_explainer`) are **never** student-visible regardless of the
`student_visible` flag, enforced as a hardcoded type list in the student content
API. These are teacher-delivered in the live lesson. So of a lesson's 5 baseline
slots, the student app surfaces roughly 3 — Vocabulary, Grammar practice,
Speaking — plus any extra practice activities the teacher saved for that lesson.
The trilha's "5 baseline" checklist stays a teacher-side concept; the student's
progress denominator is "student-visible activities in this lesson" (see Open
Question 7).

### New data
- `users` — add `role` (enum), and for students: `trilha` (`Lights|Glow|Radiant`,
  their current one), `teacher_id` (FK → users), `is_active` (bool). No invite
  timestamps in v1 (teacher sets the password directly); add when email invites
  land.
- `activities` — add `student_visible` (bool, default true — the escape hatch above).
- **`activity_attempts`** (new table): `student_id`, `activity_id`, `score`
  (nullable int), `max_score` (nullable int), `completed_at`, `answers` (json,
  nullable — for review later). One row per attempt; latest per activity drives
  the lesson-view badges. Idempotent migration guards, same as every migration
  in this project.

### The progress layer — the real work
The student-facing activity components don't emit a result today. Each needs an
optional `onComplete({ score, maxScore, answers })` prop, called when the student
finishes:
- **Auto-scored** (Quiz, Cloze, Gap-Fill, Matching Pairs, True/False, Word
  Categorisation, Image Vocab Match, Odd One Out, Word Formation, Sentence
  Transformation, Error Correction) — emit the real score. Quiz already tracks
  score internally; most of the rest have a "Check Answers" moment to hook.
- **No score concept** (Discussion Questions, Flashcards, Unjumble) — "completed"
  = reached the end / marked done by the student. `score` stays null; the badge
  shows a checkmark, not a percentage.
- **Not in the student app at all** — Presentation, Reading Text, Essay Feedback.

A thin `StudentActivityPlayer` wraps the existing component, passes `onComplete`,
POSTs to `/api/student/attempts`, then returns to the lesson view. The teacher's
own launch path (Library → relaunch) is untouched — it just never passes
`onComplete`.

## 6. Student experience (screens)

1. **Login** — existing Breeze login. On success, role routes them to `/s`.
2. **My Trilha** (`/s`) — the student's trilha name, a list of its lessons
   (from `TRILHAS` in `resources/js/lib/trilhas.js` — Lights 8, Glow 8,
   Radiant 12), each row showing `n / N done` (N = student-visible activities in
   that lesson) and a progress bar.
3. **Lesson view** (`/s/lesson/:n`) — the lesson's ToC topic (from the
   `trilha_lesson_briefs` target-language/vocab, if filled) and its activities,
   each with a done-badge + last score. All lessons unlocked, free to roam.
4. **Activity player** (`/s/activity/:id`) — `StudentActivityPlayer` renders the
   real component fullscreen, captures completion, returns to the lesson view
   with the badge updated.
5. **Progress** (`/s/progress`) — simple history: activities completed, scores,
   recent activity. No streaks/points in v1.

## 7. Teacher-side additions

- **Students** page (`/students`, teacher app) — list this teacher's students,
  create a new one, move a student to the next trilha, deactivate.
- Student creation (v1): teacher enters name + email + trilha + a password, hands
  the credentials over. Mirror the existing `php artisan user:upsert` pattern for
  a CLI fallback. **Later:** an "email a set-password link" option (Breeze's
  password-reset machinery already ships it) — additive, no rework.
- **Per-student progress** — reachable from the Students page: which lessons /
  activities done, scores, when.

## 7b. Trilha ToC reference in the brief panel — SCOPED DOWN (2026-09-04)

**Problem:** the trilha ToC (what each lesson covers) lives only in the PDFs
under `trilhas/`. Teachers building activities keep another tab open, and the
teachers don't use Git so a repo file is not a usable reference for them.

**Decision (revised):** show the **verbatim ToC text** for each lesson, read-only,
at the top of the coverage-grid brief panel. **No AI-drafted grammar breakdown**
— the teachers define target language / vocabulary / common errors themselves,
as a group, in the existing editable `trilha_lesson_briefs` fields. So:

- **No `trilha_lesson_content` table, no subagents.** The ToC is fixed curated
  text — it belongs in version-controlled static data, like DET / Cambridge /
  Pronunciation content.
- Add `TRILHA_TOC` to `resources/js/lib/trilhas.js` — `{ Lights: { 1: [...], 2:
  [...] }, Glow: {...}, Radiant: {...} }`, each lesson an array of ToC bullet
  strings taken straight from the PDF (wording unchanged; only split into items
  and OCR artefacts like `Ư`→`ff` cleaned).
- `LessonBriefEditor` in `LibraryPage.jsx` renders that list read-only above its
  existing 4 editable fields, visually distinct ("From the ToC" vs the teacher's
  own notes below).
- Later, the student lesson view can show the same `TRILHA_TOC` list as "what
  this lesson covers".

**Found while reading the PDFs:** `trilhas/README.md`'s Lights status-board
topics are wrong — they look copy-pasted from Glow (README says Lights L1 = "to
be / there be (past)"; the actual Lights ToC L1 is personal pronouns + verb
*to be* present). The PDF is the source of truth. Worth fixing the README
separately.

## 8. Monetization (Phase S6 — DEFERRED, placeholder only)

Not built in v1. When usage justifies it:
- Free period (first trilha, or first N days), then a student subscription.
- Phase 11 (`CLAUDE.md` §9) already specs Stripe + Laravel Cashier for teacher
  tiers — the student plan reuses that setup, billed to the student or to the
  teacher/school on the student's behalf.
- Gate: `activity_attempts` insert (or lesson-view load) checks subscription
  once the trial is exhausted.
- Decide later: student pays directly, or Aurora pays per-seat and rebills.

## 9. Phased build plan

Each phase: build → verify with a temp QA user + Playwright (same pattern as
DET / Cambridge / Pronunciation) → commit → checkpoint before the next.

### Phase T — Templates & Generate-Page Overhaul  (see §12 for the full plan)
Whole-app pre-work, before the student shell. Makes `/generate` intuitive enough
that a teacher gets it without a walkthrough, and separates *content* from
*exercise format*. Six sub-phases, each build → verify → commit. **T-0d (trilha
ToC panel) already done** — it was the first slice of this workstream.

### Phase S0d — Trilha ToC reference in the brief panel
See §7b (scoped down: verbatim ToC text, static data, no table, no subagents).
- [x] `TRILHA_TOC` in `resources/js/lib/trilhas.js` — Lights 1–8, Glow 1–8,
      Radiant 1–12, verbatim from the PDFs
- [x] `LessonBriefEditor` renders it read-only above the editable brief fields
- [x] **Checkpoint:** verified via Playwright (aurora@aurora.test + Herd) — Lights
      L03 shows the present-continuous ToC, Radiant L08 shows "Reported speech",
      above the editable fields; zero console errors. `npm run build` clean.
      Not committed yet.

### Phase S0e — Interactive mockup (design review, before S1)

Clickable mobile mockup of the five student screens (login → my trilha → lesson
view → activity → progress), phone-framed, built with the real trilha structure
and the verbatim lesson ToC (student "Marina" on Glow). Same "mock first,
converge, build once" approach used for the branding pass.
**Artifact:** https://claude.ai/code/artifact/cd0f5d1f-b11b-4416-a5d4-4db03a3a6293
Shared with the Aurora teachers for feedback on look + flow. Lock the design
here, then start S1.

### Phase S1 — Roles + student accounts ✅ DONE (2026-09-07)

**Shipped:**
- Migration `2026_09_07_000001_add_role_and_student_fields_to_users_table` —
  `role` (default `'teacher'`, so every existing account becomes a teacher),
  `trilha` (nullable), `teacher_id` (FK → users, nullOnDelete), `is_active`
  (default true). Idempotent `Schema::hasColumn` guards, same as every migration here.
- `User` model — `is_active` bool cast; `isStudent()` / `isTeacher()` helpers;
  `students()` (hasMany where role=student) / `teacher()` (belongsTo) relations.
  `#[Fillable]` left minimal — the controller sets `role`/`trilha`/`teacher_id`
  explicitly, never mass-assigned from a request.
- **Current user reaches the SPA** via `welcome.blade.php`:
  `@php($auroraUser = auth()->user()?->only([...]))` then
  `<script>window.__AURORA_USER__ = @json($auroraUser)</script>`. (The `@json()`
  directive chokes on a nested `only([...])` call — compute into a variable first.)
  `App.jsx` reads `window.__AURORA_USER__` once at module scope and branches:
  `role === 'student'` → `<StudentShell>`, else the existing `<TeacherApp>`.
- `GET /api/me` also returns it (for later client refreshes).
- **`StudentController`** (`/api/students` GET/POST, `/api/students/{student}` PATCH)
  — `guardTeacher()` (`abort_unless(isTeacher(), 403)`) on every action; `store`
  validates name/email/trilha/password and creates the student linked to
  `auth()->id()`; `update` changes trilha / `is_active` / password, guarded to
  the owning teacher.
- **`StudentsPage.jsx`** (`/students`, new nav link in `Layout.jsx`) — create
  form + list with a per-row trilha `<select>` and Deactivate/Reactivate.
- **Student shell** (`resources/js/student/`): `StudentShell.jsx` (own dark
  Aurora-gradient layout, fixed-layer background for mobile, bottom nav My Trilha
  / Progress, own logout); `MyTrilhaPage` (greeting + the trilha's lesson list
  from `TRILHAS`, each row previewing its `TRILHA_TOC`); `LessonPage`
  (`/s/lesson/:n` — the verbatim ToC + a "activities coming soon" placeholder —
  S2 fills this); `ProgressPage` (stub until S3). `*` route → `/s`, so a student
  poking a teacher URL just lands back on their trilha.
- CLI fallback: `php artisan student:create` (`--name --email --trilha --teacher
  --password`), validates the teacher exists and is a teacher.
- **Verified** (`qa_s1.mjs`, temp QA student on Glow, deleted after): teacher
  creates a student via the page → row appears; student logs in → lands on `/s`
  → "Your GLOW trilha" + 8 lesson links → opens Lesson 2 → 3 real ToC bullets →
  Progress tab reachable → `/students` redirects them to `/s`. Zero console
  errors. `npm run build` + PHP lint clean. Migration ran locally.

**Deferred to S2 — both done in S2:** hardening the teacher-only API routes
against a `role=student` caller (now behind `EnsureTeacher`), and blocking a
deactivated student from the content API (`EnsureStudent` checks `is_active`).
Blocking a deactivated student at *login* is still client-side only (the shell's
"paused" notice) — server-side login block is a small later add if wanted.

### Phase S2 — Trilha browse (read-only, no progress) ✅ DONE (2026-09-09)

**Shipped:**
- Migration `2026_09_09_000001_add_student_visible_to_activities_table` —
  `student_visible` (bool, default true) on `activities`. Idempotent guard. No
  toggle UI — settable directly / via a later teacher control. `Activity` model:
  added to `$fillable`, cast to bool, plus `Activity::TEACHER_ONLY_TYPES` const
  (`presentation`, `reading_text`, `essay_feedback`, `grammar_explainer`).
- **`StudentContentController`** (`/api/student/*`):
  - `GET /api/student/lessons` — `{ lessons: { "<n>": [{ id, name, type }] } }`.
    `Activity::where('trilha', $student->trilha)->where('student_visible', true)
    ->whereNotIn('type', TEACHER_ONLY_TYPES)->whereNotNull('trilha_lesson')`,
    grouped by `trilha_lesson`. **Not owner-scoped** — the whole point.
  - `GET /api/student/activities/{activity}` — `{ id, name, trilha_lesson,
    content }`. Same trilha + visibility + type guard; 404 otherwise.
- **API hardening** — new `EnsureTeacher` / `EnsureStudent` middleware.
  `routes/api.php` restructured: `/me` open to both; `/api/student/*` behind
  `EnsureStudent` (also blocks a deactivated student); **everything else** behind
  `EnsureTeacher`. `/api/background` moved out to the shared area (activity
  components on both sides call it, no user data). A `role=student` caller now
  gets 403 from `/api/generate`, `/api/activities`, `/api/students`, etc.
- **Frontend** (`resources/js/student/`):
  - `lib/activityMeta.js` — label + emoji per student-visible type.
  - `lib/useStudentLessons.js` — module-cached fetch of `/api/student/lessons`,
    shared by My Trilha + Lesson view (S3 will add `reload()`).
  - `StudentActivityPlayer.jsx` (route `/s/activity/:id`) — fetches the activity,
    maps `content.type` → the real component (same 17-type map as the teacher
    Library, minus teacher-only), renders it fullscreen with `onClose` →
    `/s/lesson/:trilha_lesson`. **No `onComplete` yet** (S3).
  - `pages/LessonPage.jsx` — the "activities coming soon" placeholder replaced
    with the real tappable activity list (icon + name + type); loading / empty /
    error states.
  - `pages/MyTrilhaPage.jsx` — a coral count pill per lesson row (hidden at 0).
- **Verified** (`scratchpad/qa_s2.mjs`, temp Glow activities seeded + deleted):
  student → `/s` → count pills → Lesson 3 lists quiz + flashcards → opens & plays
  each, close returns to the lesson → Lesson 1's presentation is correctly hidden
  (empty state) → API guards: teacher-only activity 404, `/api/generate` 403,
  `/api/activities` 403, `/api/students` 403, own `/api/student/lessons` 200;
  teacher still gets 200 on their routes and 403 on `/api/student/*`. Zero
  console/page errors. `vite build` + PHP lint clean. Migration ran locally
  (auto-runs on Railway deploy).

**Known S5 (mobile polish) item surfaced:** the split-screen activities
(`TrueFalseActivity`, `McReadingActivity`) render their ✕ close button
off-viewport at 390px — they open and play but are hard to exit on a phone.
Deferred to S5 per §3a (these need a stacked mobile layout anyway). Also still
open: `word_categorisation` / `unjumble` HTML5 drag-and-drop on touch.

**Checkpoint met:** a student can open and play every (tap-friendly) activity for
their trilha. Nothing is saved.

### Phase S3 — Progress layer ✅ DONE (2026-09-11, commit `4e973bf`)
- `activity_attempts` table (`student_id`, `activity_id`, nullable `score` /
  `max_score`, `answers`, `completed_at`) + `POST /api/student/attempts` behind
  `EnsureStudent` and the shared `assertVisible()` trilha gate. Unlimited retakes
  — one row per attempt, latest per (student, activity) drives the UI.
- `GET /api/student/lessons` now annotates each activity with `done` /
  `last_score` / `last_max` / `attempts` (one extra query for the whole trilha).
- **`onComplete({ score, maxScore })` on 8 components, not ~11.** The reveal-only
  templates (Cloze, Open Cloze, Read Complete, Word Formation, Sentence
  Transformation, Error Correction) take no student input — nothing to score.
  **6 emit a real score**: Quiz, True/False, MC Reading, Dialog Gap-Fill, MC
  Cloze, Word Categorisation. **2 record completion only** (score null): Odd One
  Out, Image Vocab Match. Fired once via a `useEffect` on the terminal flag;
  re-fires on replay = a new attempt row.
- `StudentActivityPlayer` holds `RECORDS_ATTEMPT` (the 8 types), passes
  `onComplete`, POSTs, then `reloadStudentLessons()` (new — `useStudentLessons`
  gained a module-cache bust + subscriber so mounted consumers refresh).
- `LessonPage` — green check / `7/10` badge per done row. `MyTrilhaPage` — the
  count pill is now `done / total`, green at all-done.
- **Verified** (`scratchpad/qa_s3.mjs`, temp Glow activities): quiz 2/3 → retake
  3/3, mc-cloze 2/2, word-cat 3/6, odd-one-out completion (null score), My Trilha
  3/4, teacher `POST /api/student/attempts` → 403, zero console errors; attempt
  rows confirmed in the DB.

### Phase S4 — Remaining templates + completion semantics ✅ DONE (2026-09-11, commit `81a2439`)
- `onComplete` wired on the last 9 types — all **17** student-facing templates now
  record an attempt. No new table/endpoint — pure reuse of S3's plumbing.
- **Reveal-only** (no student input → no score, completion only): Cloze, Open
  Cloze, Read Complete fire on `revealed.size === totalBlanks`; Word Formation,
  Sentence Transformation, Error Correction have no end screen at all, so
  completion fires when the student reveals the answer on the **last** item
  (`index === total - 1 && revealed`).
- **Discussion Questions** has no reveal/finish concept whatsoever — the only
  "reached the end" signal available is arriving at the last question
  (`index === total - 1`). Fires on arrival, not on an explicit action.
- **Flashcards** already had a real `finished` state (every card marked "Got
  It" — the deck cycles "still learning" cards back in until none remain) —
  wired straight to completion. No score reported since the deck-cycling
  mechanic means there's no meaningful single-pass score.
- **Reclassification caught mid-build**: Unjumble was assumed no-score per the
  original roadmap wording, but its component actually tracks a real score
  (correct-on-first-`Check`, not incremented by `Reveal`) with its own "You got
  X out of Y correct" results screen — identical shape to Quiz. Moved into the
  scored group instead of completion-only.
- **Checkpoint met:** every student-facing template records a completion.
  Verified via temp Glow lesson (9 seeded activities) + Playwright — all 8
  completion-only types confirmed `score: null` directly in the DB, Unjumble
  confirmed `score: 2, max_score: 2`, My Trilha's pill read `9/9` and turned
  green. Zero console errors.

### Phase S5 — Progress dashboards + polish ✅ DONE (2026-09-11, commit `8cfe1b0`)
- **`app/Services/StudentProgressService.php`** — the one builder behind both
  endpoints below, so the student and teacher views can never disagree about
  what "done" means: per-lesson `{lesson, done, total}` + a recent-attempts
  feed (`{name, type, lesson, score, max_score, completed_at}`, joined from
  `activity_attempts` + `activities`, newest first, capped at 30).
- **`GET /api/student/progress`** (student, own trilha) → `ProgressPage.jsx`
  rewritten from the S1 placeholder: activities-completed stat + a progress
  bar, a "N total attempts — you've retried a few" note when attempts exceed
  distinct activities done, a recent-activity list (icon/name/lesson/score or
  checkmark/relative time), and a "🎉 Trilha complete!" banner.
- **`GET /api/students/{student}/progress`** (teacher, `teacher_id` scoped) →
  `StudentsPage.jsx`'s `StudentRow` gets a "View progress" toggle that lazily
  fetches and shows the same stat + coloured per-lesson pills (`L7 · 2/2`,
  green once full) + a compact recent list, plus a matching completion nudge.
- **"Complete" is checked against every *configured* lesson**
  (`TRILHAS[trilha].lessons` — 8/8/12), not just the lessons that happen to
  have activities today. Computing it off `activities_done ===
  activities_total` alone would read 100% the moment every *existing*
  activity is done, even with half the trilha still unbuilt — a real trap,
  caught before shipping rather than after.
- **Open Question 5 resolved: manual.** No auto-advance — the completion
  banner (both sides) is a visible nudge toward the trilha dropdown that
  already existed on `/students`, not a new mechanism.
- **Mobile bug 1 (real):** `TrueFalseActivity` / `McReadingActivity` headers
  pack Score/DisplayControls/a Hide-Show toggle/Save/Fullscreen/✕ into one
  non-wrapping row — the toggle button is what tips these two over 390px,
  unlike most other activity headers, which share the same header class but
  weren't reported broken. Added `flex-wrap` (identical fix to Phase M8's
  navbar overflow). Verified the ✕ sits fully inside a 390px viewport and
  both templates are still playable end-to-end by tap.
- **Mobile bug 2 (turned out to be a non-issue):** `word_categorisation` and
  `unjumble` both already have `onClick` placement handlers alongside their
  HTML5 `draggable` ones — a tap synthesizes a click on touch devices, so
  the click path already covers touch. Verified both score correctly using
  tap-only interaction (no drag) on a Playwright touch-emulated context. No
  code change needed; the original bug note overstated it as fully broken.
- **Checkpoint met:** teacher and student see a coherent, agreeing progress
  picture. Verified via temp Glow activities + Playwright (cleaned up after):
  3/3 activities + 4 recent rows + correct retry note on the student page;
  teacher panel shows the same 3/3 and correct per-lesson pills; zero console
  errors; existing test suite unaffected.

**Aurora Student App core roadmap (S1–S5) is now complete.**

### Phase S6 — Monetization (DEFERRED)
- Trial logic + Stripe/Cashier per §8. Not started until real usage exists.

## 10. Open questions

### All resolved

1. **Publish granularity** → **everything trilha-tagged is auto-visible.** No
   per-activity publish step. `student_visible` column kept as an escape hatch
   (default true, no UI in v1).
2. **Sequential unlock** → **no.** All lessons open, free to roam.
3. **Retakes** → **unlimited.** Keep every attempt row, show the latest score on
   the badge, full history on the progress page.
4. **Invite delivery** → **teacher sets the password** and hands it over, for the
   test phase. Email set-password link is a later additive enhancement.

5. **Trilha completion / advancement** → **RESOLVED S5: manual.** No
   auto-advance. Both the student's Progress page and the teacher's per-student
   panel show a "trilha complete" nudge once every configured lesson is fully
   done; the teacher still moves the student via the existing trilha dropdown
   on `/students`.
6. **`built_by` attribution** — **resolved in S2: hidden from students.** The
   student content API never returns `built_by` / `user_id`.
7. **Progress denominator** — **RESOLVED S3**: (a) every student-visible activity
   saved for that lesson. `lessonDone()` / `lessonCount()` in `useStudentLessons`.

## 12. Phase T — Templates & Generate-Page Overhaul  (PLAN — nothing built yet except T-0d)

**Decisions (2026-09-04):** keep PDF upload but make `/generate` topic-first;
apply to the **whole app** (not trilha-only); bring in **all four** DET/Cambridge
formats (Key Word Transformation, Open Cloze, MC Reading, Read and Complete).
Driver: the shared Aurora login is being shown to the other teachers, and the
current `/generate` page (flat row of 11 templates + an optional "section focus"
that just prepends a sentence) isn't self-explanatory.

**Through-line:** separate *content* (what the text is about) from *format* (what
exercise it becomes), and let the teacher pick a **goal** before a template.

### Current state (for reference)
- `/generate` → `POST /api/generate` — **requires** `document_id`; 11 templates;
  `section_focus` pills (Vocabulary/Grammar/Listening/Reading) prepend
  `"Focus specifically on the {X} section…"` to the prompt.
- `presentation` & `reading_text` have their **own** endpoints
  (`/api/presentation/generate`, `/api/reading/generate`), topic-based, no
  document — and live as tabs on `/upload`, not on `/generate`.
- Each `ClaudeService::buildXPrompt()` hard-codes `"Here is the course book
  text:\n\n{$documentText}"` as its opening.
- `ErrorCorrectionActivity` is **one sentence at a time** (Prev / Reveal / Next),
  each item a single sentence with one embedded error. No passage concept.

---

### T-1 — Backend: `/api/generate` accepts a topic or source text, not just a document ✅ DONE (2026-09-04)
The foundation everything else needs. No UI change in this step.

**Shipped:**
- `ActivityController::generate` — `document_id` now nullable; added `topic`
  (max 200) and `source_text` (max 8000); rejects (422) unless **exactly one**
  source is given. Builds a `$source` framing block per source type
  (`"Here is the course book text:\n\n…"` / `"The activity should be about this
  topic: …"` / `"Here is the text to base the activity on:\n\n…"`).
- `section_focus` removed entirely (param, validation, the prepend logic).
- `ClaudeService` — the 11 activity generators + their `buildXPrompt()` helpers:
  param `$documentText` → `$source`; the hard-coded `"Here is the course book
  text:\n\n…"` opener removed from every builder (the controller supplies framing
  now). `detectSections()` / plain `generate()` renamed for consistency, framing
  unchanged (not in the `/generate` path).
- **Verified** (Playwright + `qa_t1_generate.mjs`, aurora@aurora.test): no-source
  and two-source both 422; `topic` → quiz + error_correction valid; `source_text`
  → cloze valid; document path (throwaway doc) → quiz with 4 questions
  (regression OK). PHP lint clean. GeneratePage UI untouched — still sends
  `document_id`; the now-unknown `section_focus` key it also sends is ignored.

**Original plan (for reference):**
- `ActivityController::generate` validation: `document_id` becomes **nullable**;
  add `topic` (string, max 200) and `source_text` (string, max ~8000). Require
  **exactly one** of the three (`document_id` | `topic` | `source_text`).
- Build a `$sourceBlock` string in the controller:
  - document → `"Here is the course book text:\n\n{$text}"` (current behaviour)
  - topic → `"The activity is about this topic: {$topic}\n\nInvent suitable
    example content about it as the basis for the activity."`
  - source_text → `"Here is the text to base the activity on:\n\n{$source_text}"`
- Mechanical refactor: every `buildXPrompt(string $documentText, …)` →
  `buildXPrompt(string $sourceBlock, …)`, interpolating `$sourceBlock` where the
  hard-coded "Here is the course book text:" line is now (~11 builders).
- **Remove `section_focus`** — the param, the validation rule, the prepend logic.
- Keep `page_from` / `page_to` (only meaningful with `document_id`).
- **Verify:** existing document-based generation still works unchanged (regression);
  a `topic`-only call to each of the 11 types returns a sensible activity;
  a `source_text` call works. No UI yet — drive via the current form + a script.
- **Risk:** topic-only output quality per template. If any type comes out weak,
  tune that builder's `$sourceBlock` wording. Low risk — the builders already
  tolerate arbitrary input text.

### T-2 — `/generate` page: goal-first, topic-first ✅ DONE (2026-09-04)

**Shipped** (`GeneratePage.jsx` rewritten, no backend change):
- Three numbered steps: **1. What do you want to practise?** (Vocabulary /
  Grammar / Reading / Speaking) → **2. Choose a format** (only that goal's
  templates, each a card with a one-line blurb) → **3. Where should the content
  come from?** (a small "A topic" / "An uploaded document" toggle; topic is the
  default, a plain text field; document mode shows the old select + page range).
- `GOALS` + `TEMPLATES` config objects at module scope. A template can sit under
  several goals (Quiz → grammar/vocab/reading; Cloze → grammar/vocab; Word
  Formation → vocab/grammar; Dialogue Gap-Fill → grammar/speaking).
- **Error Correction split into two cards** — "sentences" and "passage" — same
  `type: error_correction`, different default prompt (passage one asks for a
  connected text, triggering T-3's passage mode).
- `section_focus` pills gone. `pageFrom`/`pageTo` kept (document mode only).
- The 11 generatable types (`image_vocab_match` / `word_categorisation` have no
  backend generator — left out; can be restored later like a T-5 item).
- A line points teachers to the Upload page for Presentation / Reading Text
  (those keep their own tabs + endpoints for now — full unification is a
  possible T-7).
- `location.state.activity` fast-path (arriving from a Presentation/Reading Text
  generate) still renders the activity directly.
- **Verified** (`qa_t2_generatepage.mjs`): goal → templates → source steps
  reveal in order; default prompt loads per template; document toggle shows the
  select; generate-from-topic renders a passage Error Correction; **zero
  horizontal overflow at 390px**; zero console errors. `npm run build` clean.

**Original plan (for reference):**
- **Step 1 — pick a goal:** Vocabulary · Grammar · Reading · Speaking (Listening
  later, needs audio). Big, obvious buttons.
- **Step 2 — pick a template** from that goal's set, each showing a one-line
  "use this when…" blurb. Draft mapping (a template may appear under two goals):

  | Goal | Templates |
  |------|-----------|
  | Vocabulary | Flashcards · Image Match · Odd One Out · Word Formation |
  | Grammar | Quiz · Sentence Transformation · Error Correction · Cloze · Unjumble · Dialog Gap-Fill · **Key Word Transformation** · **Open Cloze** |
  | Reading | True/False/Not Given · **MC Reading** · **Read and Complete** · passage-mode Error Correction |
  | Speaking | Discussion Questions |

- **Step 3 — source:** a "What's the topic?" text field is the **primary** input.
  "or use an uploaded document ▸" is a collapsed secondary section (keeps PDF +
  page range for teachers who still want it).
- Template metadata moves to one config object (like `trilhas.js`):
  `{ id, label, goals:[], blurb, defaultPrompt, source:'topic'|'text'|'either' }`.
- Remove the `section_focus` pills from the form.
- **Verify:** each goal shows the right templates; topic-only generate works
  end-to-end from the UI; PDF path still reachable and working; mobile layout of
  the two-step picker is usable at 390px.

### T-3 — Error Correction: passage mode + scroll ✅ DONE (2026-09-04)

**Shipped:**
- `buildErrorCorrectionPrompt` — two explicit modes. SENTENCE MODE (default,
  unchanged): standalone sentences, no `passage`. PASSAGE MODE (task asks for a
  text/paragraph/story): Claude returns a connected `passage` (1–3 short
  paragraphs) with one error per item embedded; each `items[].sentence` is the
  verbatim sentence from the passage; every `error` appears verbatim in `passage`.
- `generateErrorCorrection` — reads `passage`, filters items to those whose
  `error` is also a substring of `passage`, drops the field entirely when empty.
- `ErrorCorrectionActivity.jsx` — if `activity.passage` is set: renders the
  passage in a scrollable panel (`max-h-[44vh]`, bottom fade), `buildSegments()`
  maps each error to its position by sequential search. Stepping through
  Prev/Reveal/Next walks the passage — errors already passed show
  struck-through + green correction inline, the active one gets a yellow ring
  (then its correction on Reveal), upcoming ones stay unmarked. Active error
  auto-scrolls into view. Header reads "Mistake X / N". No `passage` → the
  original sentence-by-sentence UI, untouched.
- **Verified** (`qa_t3_errorcorrection.mjs`): passage-mode generate returns a
  passage with every error verbatim inside it; sentence-mode generate has no
  `passage` (regression); saved + relaunched from Library; stepped through with
  Reveal/Next; zero console errors. `npm run build` clean. Screenshots confirm
  the progressive-walk styling and scroll/fade.
- **Not yet wired into a UI trigger** — passage mode is opt-in via a prompt that
  asks for a text ("write a short text… with 6 mistakes"). T-2's goal-first page
  gets a proper "Error Correction (passage)" option with its own default prompt.

**Original plan (for reference):**
- Prompt: allow an optional `passage` (string, 1–3 short paragraphs) in the JSON.
  When present, every `items[].error` must be a verbatim substring of `passage`.
- Component: if `activity.passage` is set, render it in a **scrollable panel**
  (`overflow-y-auto`, capped height) with each error underlined inline; stepping
  Prev/Reveal/Next moves through the errors, highlighting the active one in the
  passage and showing its correction + explanation below. If no `passage`, the
  current sentence-by-sentence UI is unchanged.
- Categorised under **Grammar** (accuracy), not Reading — it can also be offered
  from the Reading Text screen (T-4).
- **Verify:** a passage-mode generation renders, scrolls, steps through all
  errors; a legacy sentence-only activity still works; save/relaunch of both.

### T-4 — Reading Text → make an exercise from it ✅ DONE (2026-09-04)

**Shipped:**
- `ReadingTextActivity.jsx` — a "Make an exercise from this text:" bar under the
  header with 4 buttons: **Comprehension Quiz · True / False · Cloze · Error
  Correction**. Each POSTs `/api/generate` with `source_text` = the passage
  (paragraphs joined) + a tailored default prompt; the Error Correction one asks
  for a connected passage (→ T-3 passage mode). A full-screen spinner overlays
  while it generates; errors show inline in the bar.
- New optional prop `onDerive(activity)` — the parent swaps in the new activity.
  `GeneratePage` passes `(a) => { setActivity(a); setStatus('success'); }`;
  `LibraryPage` passes `setLaunched`. Both parents already render every activity
  type, so the derived activity just appears. Bar only renders when `onDerive`
  is supplied and there are paragraphs.
- **Verified** (`qa_t4_readingderive.mjs`): generate a Reading Text → save →
  launch from Library → "Comprehension Quiz" renders a Quiz; relaunch → "Error
  Correction" renders a passage-mode Error Correction whose text is clearly the
  reading passage rewritten with errors. Zero console errors. `npm run build`
  clean.

**Original plan (for reference):**
- On `ReadingTextActivity`, add a row of buttons: **Make Error Correction ·
  Make Cloze · Make Comprehension Quiz · Make True/False**.
- Each POSTs `/api/generate` with `source_text` = the passage (joined
  paragraphs), `type` = the chosen format, a sensible default prompt, and
  carries over `topic` for the background image.
- On success, navigate to the generated activity (same as `/generate` does).
- **Verify:** generate a Reading Text, make each of the four exercise types from
  it, confirm the exercise content actually reflects the passage; save works.

### T-5a — Open Cloze + Multiple Choice Cloze ✅ DONE (2026-09-04)

Scope confirmed with the user: **Key Word Transformation dropped** — it's the
existing `sentence_transformation` under a Cambridge name. Replaced with
**MC Cloze**. So T-5 = Open Cloze, MC Cloze (T-5a) + MC Reading, Read and
Complete (T-5b).

**Shipped:**
- `ClaudeService` — `generateOpenCloze` / `generateMcCloze` + their prompt
  builders. New shared helpers: `requestJson()` (the standard Claude JSON call),
  `cleanClozeParts($parts, $mc)` (keeps well-formed `{text}` / `{blank}` parts;
  for MC, ensures each blank's `options` list contains the answer, dedupes, caps
  at 4), `hasBlank()`.
- Schema — both reuse the `parts: [{text}|{blank}]` shape from `cloze`.
  `open_cloze`: blanks are bare single words, no word bank. `mc_cloze`: each
  blank also carries `options: [4]` with `blank` repeated verbatim among them.
- `ActivityController::generate` + `SavedActivityController` — `open_cloze` /
  `mc_cloze` added to the `in:` lists and the match arm.
- `OpenClozeActivity.jsx` — ClozeActivity's passage render minus the word bank;
  click a numbered gap to reveal the word, "Reveal All", A-/A+.
- `McClozeActivity.jsx` — passage on top (answered gaps fill in green/red), an
  options panel below with one A–D row per gap; click to answer, quiz-style
  feedback, "X / N correct" header. Scrolls for long passages.
- `GeneratePage` / `LibraryPage` — imports, render branches, `TEMPLATES` entries
  (Open Cloze → Grammar; MC Cloze → Grammar + Vocabulary), `TYPE_LABELS` /
  `TYPE_COLORS` / `TYPE_FILTERS`.
- **Verified** (`qa_t5a_clozes.mjs`): open_cloze → 8 bare blanks, no options;
  mc_cloze → 8 blanks each with valid 4-option lists containing the answer;
  both save + relaunch from Library; MC scoring tracks correctly (2/8 after 2
  answers); screenshots show good phrasal-verb distractors. Zero console errors.
  `npm run build` + PHP lint clean.

### T-5b — MC Reading + Read and Complete ✅ DONE (2026-09-04)

**Shipped:**
- `ClaudeService` — `generateMcReading` / `generateReadComplete` + prompt builders.
  MC Reading filters questions to those with a valid 4-option list containing the
  answer + a non-empty passage. Read and Complete keeps only gaps whose `given`
  is a real shorter prefix of `answer`, and re-inserts a separating space wherever
  a text part butts a gap letter-to-letter (Claude sometimes drops it).
- `mc_reading` schema: `{ passage, questions: [{ text, options[4], answer, explanation }] }`.
  `read_complete` schema: `parts: [{text} | {given, answer}]`.
- `McReadingActivity.jsx` — TrueFalseActivity's split-panel model (passage stays
  visible, one question at a time) with generic 4-option questions + a results
  screen.
- `ReadCompleteActivity.jsx` — OpenCloze's reveal model; each gap shows `given`
  then underscores, click to reveal the whole word. Gap span is `inline-block
  mx-1` so words stay separated.
- Wired through both controllers, `GeneratePage` (`TEMPLATES`: MC Reading →
  Reading; Read and Complete → Reading + Vocabulary), `LibraryPage`.
- **Root-cause fix — `bootstrap/app.php`**: Laravel's global `TrimStrings`
  middleware was stripping the edge spaces from `content.parts[*].text` on save,
  which corrupted saved cloze/open-cloze/mc-cloze/read-complete passages
  ("gets" + gap → "getsdre___"). Added
  `trimStrings(except: ['content', 'content.*', 'source_text'])`. Verified the
  trailing space now survives a save round-trip.
- **Verified** (`qa_t5b_reading.mjs` + `qa_t5a_clozes.mjs` regression): MC Reading
  → 6 valid 4-option questions over a ~1800-char passage, split-panel renders,
  scoring works; Read and Complete → 10–12 valid prefix gaps, passage reads
  cleanly with proper word spacing after the middleware fix, reveal works. Zero
  console errors. PHP lint + `npm run build` clean.

**Phase T-5 complete** (Open Cloze, MC Cloze, MC Reading, Read and Complete).

### (original) T-5 — Four new DET/Cambridge formats as generatable templates
Each = a `ClaudeService` generator + prompt builder + JSON schema + a component
on `PracticeSessionShell` (tap-only → mobile-ready → reusable in the student
app) + an entry in the T-2 goal map + a `match` arm + validation in
`ActivityController::generate` + the `SavedActivityController` `in:` list +
`LibraryPage` labels/colours/filters. Split into two commits:
- **T-5a — Grammar:** Key Word Transformation, Open Cloze
- **T-5b — Reading:** MC Reading, Read and Complete
- Adapt the existing DET/Cambridge components (`McReadingDrill`,
  `ReadCompleteDrill` / `McClozeDrill`, `KeyWordTransformationDrill`,
  `OpenClozeDrill`) — they already exist for hand-authored JSON; the work is
  wiring them to a Claude-generated payload and the `/generate` flow.
- **Verify:** each generates from a topic, renders, scores; saved + relaunched
  from Library; mobile check at 390px.

### T-6 — Consistency pass ✅ DONE (2026-09-04)
- `TEMPLATES` blurbs normalised to one voice; word_formation / cloze / open_cloze
  / mc_cloze / mc_reading tightened.
- Full mobile sweep of the 3-step `/generate` flow at 390px (`qa_t6_mobile.mjs`) —
  **zero horizontal overflow** at every step and in both source modes, zero
  console errors.
- `Claude.md` Phase T section brought up to date (T-4, T-5, T-6 + the `/generate`
  quick reference).

**Original plan (for reference):**
- Every template blurb in one voice; topic-field placeholder gives real examples
  ("second conditional", "daily routines vocabulary", "a text about recycling").
- `/generate` empty/loading/error states reviewed.
- One mobile-width sweep of the whole `/generate` flow.
- Update `CLAUDE.md` with a "Phase T" section.

---

### Sequencing & rough size
| Step | Depends on | Size |
|------|-----------|------|
| T-1 backend source flexibility | — | M |
| T-2 goal-first page | T-1 | M |
| T-3 Error Correction passage mode | — (parallel-ok) | S |
| T-4 Reading Text → exercise | T-1 | S–M |
| T-5a KWT + Open Cloze | T-1, T-2 | M |
| T-5b MC Reading + Read and Complete | T-1, T-2 | M |
| T-6 consistency pass | all | S |

**Today's teacher demo runs on the current app** — none of this is rushed in
before it. If a quick visible win is wanted before a *later* demo, T-2's goal
grouping is the highest-impact single piece.

## 13. What to do next

**Phase T progress (2026-09-04):**
- ✅ T-0d — trilha ToC panel — committed `da811ce`, pushed
- ✅ T-1 — `/api/generate` topic/source_text — committed `fff0d9d`
- ✅ T-3 — Error Correction passage mode — committed `fefa113`
- ✅ T-2 — goal-first `/generate` page — committed `a2f9f62`
- ✅ T-4 — "Make an exercise from this" on a Reading Text — committed `eb1349a`
- ✅ T-5a — Open Cloze + MC Cloze generators (KWT dropped as redundant) — committed `bf5547c`
- ✅ T-5b — MC Reading + Read and Complete + TrimStrings fix — committed `95991df`
- ✅ T-6 — blurb pass + `/generate` mobile sweep (0 overflow at 390px) + CLAUDE.md

**Phase T complete.**

**Student app progress:**
- ✅ S0d/S0e — trilha ToC panel + interactive mockup
- ✅ S1 — roles + student accounts — committed `300f0c9`, pushed
- ✅ S2 — trilha browse + play (read-only) + API hardening — 2026-09-09
- ✅ S3 — progress layer: `activity_attempts` + `POST /api/student/attempts`;
  `onComplete({ score, maxScore })` on 8 components (6 scored, 2 completion-only);
  done-badges on the lesson view; `done / total` pill on My Trilha — 2026-09-11,
  commit `4e973bf`.
- ✅ S4 — `onComplete` on the remaining 9 types (all 17 now record an attempt);
  Unjumble reclassified into the scored group mid-build — 2026-09-11, commit
  `81a2439`.
- ✅ S5 — progress dashboards (shared `StudentProgressService`, student
  `/s/progress`, teacher per-student panel on `/students`), trilha-advancement
  Open Question resolved manual, both known mobile bugs closed (one real fix,
  one turned out to already work) — 2026-09-11, commit `8cfe1b0`.

**Student App core roadmap (S1–S5) complete.** S6 (monetization) stays
deferred until real usage exists, per §8.

### Post-Phase-T fix — "lesson session" ✅ DONE (2026-09-05)

**Problem noticed while dogfooding**: nothing remembered which trilha lesson you
were building. After saving one activity, building the next meant re-picking
Trilha + Lesson from scratch, and there was no way back into "building mode"
from the Presentation / Reading Text screens after checking Library.

**Shipped:**
- `resources/js/lib/lessonSession.js` — `get/set/clearLessonSession()`, a small
  localStorage-backed `{ trilha, lesson }` pair.
- `SavePanel.jsx` — pre-fills Trilha *and* Lesson from the session (previously
  only remembered the trilha); updates the session on every successful
  trilha-mode save.
- `GeneratePage.jsx` — a chip above the form when a session is active:
  **"Adding to: LIGHTS · Lesson 7 — Change"** (Change clears it).
- **`+ Add activity`** button added to `GrammarExplainerActivity.jsx`
  (Presentation) and `ReadingTextActivity.jsx` (Reading Text) headers, next to
  Save — navigates to `/generate` to start the next activity.
- **Bug caught before shipping**: since Presentation/Reading Text are always
  displayed *at* `/generate` (arrived via `location.state` from the Upload
  tabs), clicking "+ Add activity" navigated to the same route — no remount, so
  the same activity just stayed on screen. Fixed with a `useEffect` keyed on
  `location.key` that resets `activity`/`status` whenever `/generate` is
  reached with no `location.state.activity`.
- Scoped to Presentation and Reading Text only (what was asked) — the other
  ~14 activity components don't have the button. Cheap to extend later if
  wanted, since the session mechanism is already in place.
- **Verified** (`qa_lesson_session.mjs`, `qa_lesson_session_rt.mjs`): saving a
  Presentation to Lights L07 sets the session; "+ Add activity" lands on
  `/generate` showing the chip; generating + opening Save shows Trilha/Lesson
  pre-filled; "Change" clears the chip; Reading Text's button also navigates
  correctly. Zero console errors.

Then the student app (Phase S1+).
