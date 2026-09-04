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

### Phase S0 — Template work (pre-work, teacher app first)
Done against the current teacher app, before the student shell. Each item is its
own build → verify → commit. Three strands:

**S0a — Changes to existing templates** _(list to be filled in — user has specific
changes in mind)_
- [ ] _(tbd)_

**S0b — New activity types ported from DET / Cambridge** — bring the DET / Cambridge
drill *models* into the `/generate` flow as new Claude-generatable templates, so
teachers can produce them per trilha topic. Each is: a `ClaudeService` prompt
builder + JSON schema + a React component (built on `PracticeSessionShell` /
`DrillLoop`, already tap-friendly, so they're mobile-ready for the student app by
construction). Candidate list _(to be chosen)_:
- [ ] _(tbd — see the question posed alongside this doc)_

**S0c — Mobile scale for the reused teacher templates** — a mobile type scale +
tap targets for the tap-friendly subset (§3a). Can also land inside S3/S4 when
each template is wired for progress; kept here as a reminder.
- [ ] _(tbd)_

### Phase S0d — Trilha ToC reference in the brief panel
See §7b (scoped down: verbatim ToC text, static data, no table, no subagents).
- [x] `TRILHA_TOC` in `resources/js/lib/trilhas.js` — Lights 1–8, Glow 1–8,
      Radiant 1–12, verbatim from the PDFs
- [x] `LessonBriefEditor` renders it read-only above the editable brief fields
- [x] **Checkpoint:** verified via Playwright (aurora@aurora.test + Herd) — Lights
      L03 shows the present-continuous ToC, Radiant L08 shows "Reported speech",
      above the editable fields; zero console errors. `npm run build` clean.
      Not committed yet.

### Phase S1 — Roles + student accounts
- `role` on users; `trilha` / `teacher_id` / `is_active` for students.
- `App.jsx` top-level role branch; a minimal student shell (nav, "My Trilha"
  showing the lesson list for their trilha, all empty — no activities yet).
- Teacher **Students** page: create (name / email / trilha / password) / list /
  deactivate / change trilha.
- CLI: extend `user:upsert` (or a new `student:create`) for a fallback.
- **Checkpoint:** a teacher can create a student; the student logs in and sees
  their trilha's lesson list.

### Phase S2 — Trilha browse (read-only, no progress)
- `student_visible` on activities (default true, escape hatch — no toggle UI yet).
- Student content API: all activities for the student's trilha, grouped by
  `trilha_lesson`, not owner-scoped; teacher-only types excluded.
- Lesson view: activities per lesson, launchable via `StudentActivityPlayer`
  (renders the real component, no `onComplete` yet).
- **Checkpoint:** a student can open and play every activity for their trilha.
  Nothing is saved.

### Phase S3 — Progress layer (auto-scored templates)
- `activity_attempts` table + `/api/student/attempts`.
- `onComplete` threaded through the ~11 auto-scored components; `StudentActivityPlayer`
  captures and POSTs it.
- Done-badges + last score on the lesson view; `n / N` on My Trilha.
- **Checkpoint:** a student completes a Quiz, sees the score saved, and the badge
  appears on the lesson view and updates the trilha progress count.

### Phase S4 — Remaining templates + completion semantics
- `onComplete` for the non-scored student templates (Discussion, Flashcards,
  Unjumble) — "reached the end" / explicit "Mark done".
- Consistent badge treatment (checkmark vs percentage).
- **Checkpoint:** every student-facing template records a completion.

### Phase S5 — Progress dashboards + polish
- Student `/s/progress` history.
- Teacher per-student progress view + Students-page summary.
- Mobile pass on the student shell.
- **Checkpoint:** teacher and student can both see a coherent progress picture.

### Phase S6 — Monetization (DEFERRED)
- Trial logic + Stripe/Cashier per §8. Not started until real usage exists.

## 10. Open questions

### Resolved (2026-09-03)

1. **Publish granularity** → **everything trilha-tagged is auto-visible.** No
   per-activity publish step. `student_visible` column kept as an escape hatch
   (default true, no UI in v1).
2. **Sequential unlock** → **no.** All lessons open, free to roam.
3. **Retakes** → **unlimited.** Keep every attempt row, show the latest score on
   the badge, full history on the progress page.
4. **Invite delivery** → **teacher sets the password** and hands it over, for the
   test phase. Email set-password link is a later additive enhancement.

### Still open (resolve during S1–S2, not blocking)

5. **Trilha completion / advancement** — automatic when all lessons are done, or
   teacher manually moves the student to the next trilha? Leaning manual for v1.
6. **`built_by` attribution** — hidden from students (assumed yes — confirm).
7. **Progress denominator** — what counts toward a lesson's `n / N`? (a) every
   student-visible activity saved for that lesson (simple, N drifts as teachers
   add activities), (b) a fixed 3-slot baseline (Vocabulary, Grammar, Speaking)
   with extras shown but not counted, (c) teacher marks specific activities as
   "required". Leaning (a).

## 11. What to do next

Not in a hurry to start building — this stays in planning until the S0 scope is
nailed down.

1. **S0a** — list the specific changes to existing templates in §9.
2. **S0b** — choose which DET / Cambridge models become new `/generate` templates.
3. **S0d** — choose the trilha-content storage option (§7b: A / B / C).
4. (Optional) settle Open Questions 5–7 — not blocking.
5. Then work S0 item by item (each build → verify → commit), and only after that
   start **Phase S1** in plan mode.
