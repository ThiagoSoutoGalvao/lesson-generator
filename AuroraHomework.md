# Aurora Homework / Assignments — Feature Roadmap

**Status: H1 + H2 done (2026-09-14/15).** Decided 2026-09-14, right after
finishing the Aurora Student App core roadmap (S1–S5, see
`AuroraStudentApp.md`) and a same-day bug pass on it.

---

## 1. Problem & motivation

Teachers do 1-on-1 live lessons and want to give students something to
practice afterward. Concretely: a teacher asked for something his Cambridge
B2 student could practice as homework — something they'd studied, plus maybe
something extra. The stated pain, in the user's own words:

> "It is a problem that has been a problem — to remember to send students
> PDFs is always time-consuming... I can practice with him in class but there
> is never a reference for him of that exercise again."

The user has his own Cambridge B2 student and volunteered him as the first
real test case — real deadline, real motivation, will surface rough edges
before this touches any other Aurora teacher.

## 2. Key findings (why this needs its own feature)

- **Cambridge/DET/Pronunciation practice content is not reachable by any
  student account today, regardless of login.** It isn't `Activity` rows —
  it's static JSON rendered through its own routes
  (`/cambridge/practice/:type`, `/det/practice/:type`), only linked from the
  teacher's `/upload` tabs. `StudentShell` recognizes exactly 4 routes (My
  Trilha, a lesson, an activity, Progress) and redirects everything else back
  to `/s`. So this is a routing/reachability gap, not a permissions one.
- **"One-off" saved activities are also invisible to every student, always.**
  The student content API requires `trilha_lesson` to be non-null; One-off
  mode never sets it. One-off exists purely for a teacher's own Library
  organization, not for reaching a student.
- **Root gap: there is no way to give one specific student one specific
  thing.** Everything a student sees today is "everything tagged to my
  trilha." Trilha membership is the *only* content-delivery mechanism that
  exists. Homework needs a mechanism that's decoupled from trilha entirely.
- **Login question, resolved:** the Aurora shared login (`aurora@…`) is for
  trilha-building only — that was always its purpose. Personal logins stay
  for each teacher's own students, trilha or not. Homework doesn't change
  this; it just finally gives a personal-login teacher a way to deliver
  non-trilha content (a one-off activity, or Cambridge/DET) to their own
  student, which had no path to the student before at all.

## 3. Decisions locked

- **Feature name: "Homework"** — the teacher's own word for it; use it in the
  UI too, not "assignments."
- **Sequence: make Cambridge/DET reachable in the student app *first*,
  before building assignment tracking.** It's the prerequisite, not a
  separate nice-to-have — you can't assign a Cambridge drill to a student
  until a student can render one at all. It also ships real value on its own:
  once reachable, a teacher can just say "redo Word Formation Set 3" and the
  student can self-navigate there, even before formal assignment exists.
- **Cambridge/DET homework completion is a simple "mark as done" in v1, not
  full scoring.** None of the 15 Cambridge/DET drill components call an
  `onComplete`-style hook today; wiring real scoring into all of them isn't
  worth doing before this pattern is validated with a real student.
- **Students still require a trilha** (Lights/Glow/Radiant) even for a
  purely exam-prep student — pick one, ignore the My Trilha tab. Not worth
  loosening that validation yet.
- **First real test:** the user's own Cambridge B2 student, created under
  his personal login (not Aurora's).
- **Also open:** whether Pronunciation gets the same "Practice tab"
  treatment as Cambridge/DET in H1. Same shape of problem, likely similar
  cost — decide once real usage shows it's needed.
- **Revised after using H1 for real (2026-09-15): `kind=practice` assignment
  is dropped, H2 narrowed to activities only.** The teacher's actual friction
  wasn't Cambridge/DET — Practice (H1) already gives unlimited, free access
  to that, no scarcity problem to solve. The real blocker: a *custom
  generated activity* made for one specific student (exactly today's real
  case — text + vocab generated to match a lesson) had **no way to reach
  that student at all**, one-off activities being invisible to every
  student, always. So H2 became "assign one Library activity to one
  student," full stop — no `kind`, no `practice_ref`. If a real need for
  assigning a *specific Cambridge set* ever shows up, add it back then; the
  original deep-link question above is moot until it does.

## 4. Phases

### ✅ Phase H1 — Cambridge/DET reachable in the student app (2026-09-14, commit `aa79e68`)

- New **"Practice"** tab in `StudentShell`'s bottom nav, alongside My Trilha
  and Progress. `resources/js/student/pages/PracticePage.jsx` — Cambridge B2
  / DET toggle, grouped drill lists, styled to match `MyTrilhaPage`'s tokens.
- New routes `/s/practice`, `/s/practice/cambridge/:type`,
  `/s/practice/det/:type` in `StudentShell.jsx`, rendering
  `CambridgePracticePage` / `DetPracticePage` directly — not a rebuild of
  `CambridgePracticeLauncher` / `DetPracticeLauncher` (those stayed
  teacher-only in `UploadPage.jsx`, unused by this phase in the end), just a
  new picker UI pointing at the same drill components already used there.
- **No new table. No scoring/attempt changes.** Purely making already-built,
  already-shipped content reachable from the student shell.
- **Found mid-build, fixed:** every Cambridge/DET leaf drill component (25
  files) hardcoded its own "Back" button to `navigate('/upload', { state })`
  — fine while only the teacher's Upload page could reach them, broken for a
  student (no `/upload` route in `StudentShell` at all). Fixed with
  `resources/js/hooks/usePracticeBack.js`, a small context
  `CambridgePracticePage`/`DetPracticePage` set once at the top of the tree
  saying where "back" (and the active Cambridge/DET tab) should restore to —
  the teacher's Upload page by default, the student's Practice tab when
  rendered there.
- **Checkpoint met:** the student logs in, taps Practice, picks a Cambridge
  or DET drill, and plays it — unassisted, no teacher involved. Verified via
  `scratchpad/qa_h1.mjs` + `qa_h1_mode_restore.mjs` (student) and
  `qa_h1_teacher_regression.mjs` (teacher Upload flow unaffected).
- **Deferred, unchanged from the plan:** Pronunciation does not get a
  Practice-tab entry yet (open question §3, still open).

### ✅ Phase H2 — Assign one activity to one student (2026-09-15)

Narrowed and merged with what was originally planned as a separate H3, once
using H1 for real showed the actual shape of the problem (§3). One shipped
unit — a teacher assigns, a student sees and plays it, same day.

- `student_assignments` table: `student_id`, `activity_id`, `note`, unique on
  `(student_id, activity_id)`. No `kind`, no `practice_ref` — see the revised
  decision in §3.
- `StudentContentController::assertVisible()` gained a second, independent
  path: visible if same trilha as the student (unchanged) **or** an
  assignment row exists for that student + activity. This is how a
  trilha-less one-off activity reaches a student for the first time.
- `StudentHomeworkService::build($student)` — shared builder (same split as
  `StudentProgressService`) behind the student's own
  `GET /api/student/homework` and the teacher's
  `GET /api/students/{student}/assignments`. Completion is read straight off
  `activity_attempts`, not tracked on the assignment — nothing to keep in
  sync.
- Teacher: `StudentsPage.jsx`'s existing per-student panel (from S5) gained a
  second section, **"Homework — assigned directly, outside the trilha"** —
  visually and structurally separate from the "Trilha progress" section
  above it, not merged. Assign form: pick from the teacher's own Library
  (`GET /api/activities`, already existed), optional note, unassign per row.
- Student: `ProgressPage.jsx` gained a **"Homework — from your teacher"**
  section, amber-accented (trilha content stays coral) and rendered only
  when something's assigned — deliberately never folded into the trilha
  list, so a student never has to wonder whether something was built by the
  Aurora team or handed to them personally by their own teacher.
- `StudentActivityPlayer`'s close button now respects `location.state.from`
  (falls back to the old trilha_lesson logic) — a homework activity has no
  `trilha_lesson` to derive a sensible "back" target from otherwise.
- Ownership guarded server-side: a teacher can only assign their own
  activities (`Activity::where('user_id', auth()->id())`) to their own
  students (`guardOwnStudent`) — never another teacher's content or student.
- **Checkpoint met:** teacher generates a one-off activity, assigns it to a
  student with a note, student sees it in a clearly separate Homework
  section, plays it, teacher sees it marked Done. Verified end-to-end via
  `scratchpad/qa_h2_homework.mjs` (assign → 404-before/visible-after →
  play → complete → Done on both sides → unassign → 404 again). Zero real
  console/page errors.

### Phase H3 — dropped, folded into H2

Originally planned as a separate phase ("My Homework" on the student side).
Once H2 was narrowed to activities-only (§3), there was no longer a reason
to ship the visibility fix and the student-facing list separately — a
permission with nowhere to see it doesn't help anyone. Shipped together.

## 5. Relationship to other work

- Builds directly on the Aurora Student App (S1–S5, complete) — reuses
  `StudentShell`, the `useStudentLessons`-style data-fetch pattern,
  `activity_attempts`, and the S5 per-student teacher panel.
- **Independent of Phase 11 (Monetization)** — either could go first; the
  user chose to start Homework now, Phase 11 stays queued behind it.
- Cambridge/DET Practice Mode content itself is unaffected — this is a
  delivery-mechanism feature on top of already-shipped content, not new
  practice material.
- Longer-term, this is also a plausible Phase 11 monetization lever
  (structured exam-prep + a homework trail is a stronger paid-tier hook than
  unlimited generations alone) — not designed for that yet, just worth
  remembering when Phase 11 pricing gets revisited.

## 6. Where to start

**H1 and H2 are both done (2026-09-14/15).** The core roadmap this doc set
out to build — Cambridge/DET reachable, and one activity assignable to one
student — is complete and validated end-to-end locally. Nothing is
currently queued here; next steps are either real usage (the user's own
Cambridge B2 student, under his personal login) surfacing what's actually
needed next, or picking Phase 11 (Monetization, `Claude.md` §5) back up.
