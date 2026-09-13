# Aurora Homework / Assignments — Feature Roadmap

**Status: planned, not started.** Decided 2026-09-14, right after finishing the
Aurora Student App core roadmap (S1–S5, see `AuroraStudentApp.md`) and a
same-day bug pass on it.

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
- **Open, not yet decided:** whether Cambridge assignments should deep-link
  to a specific set (e.g. "Word Formation, Set 3") or just the type level
  (e.g. "Word Formation," student picks a set themselves). Current routes
  don't support set-level deep-linking — would need a small routing change.
  Fine to ship type-level first (H2) and revisit.
- **Also open:** whether Pronunciation gets the same "Practice tab"
  treatment as Cambridge/DET in H1. Same shape of problem, likely similar
  cost — decide once H1 is built for Cambridge/DET and the pattern is clear.

## 4. Phases

### Phase H1 — Cambridge/DET reachable in the student app (browsable, no assignment yet)

- New **"Practice"** tab in `StudentShell`'s bottom nav, alongside My Trilha
  and Progress.
- New student-shell routes rendering the existing Cambridge/DET drill
  components. Reuse `CambridgePracticeLauncher` / `DetPracticeLauncher`
  (currently defined in `resources/js/pages/UploadPage.jsx`, teacher-only) as
  the basis for the student-side launcher grid — they're link grids with no
  teacher-only logic baked in, so this should be closer to "wire up routing +
  a nav entry" than a rebuild.
- **No new table. No scoring/attempt changes.** Purely making already-built,
  already-shipped content reachable from the student shell.
- **Checkpoint:** the student logs in, taps Practice, picks a Cambridge or
  DET drill, and plays it — unassisted, no teacher involved.

### Phase H2 — Assignment data model + teacher-side "Assign"

- New `student_assignments` table: `student_id`, `kind` (`activity` |
  `practice`), `activity_id` (nullable, FK), `practice_ref` (nullable string,
  e.g. `cambridge:word-formation` or `det:fill-blank`), an optional teacher
  note, `assigned_at`, `completed_at`.
- "Assign to student" action added wherever the content already lives — a
  Library activity card, a Cambridge/DET tile.
- The teacher's per-student panel (built in Phase S5, `StudentsPage.jsx`'s
  "View progress" toggle) gains an outstanding/done homework list alongside
  the existing progress stats.
- **Checkpoint:** the teacher assigns one specific thing to one specific
  student and sees it listed against their name.

### Phase H3 — "My Homework" on the student side

- A homework list the student actually sees — own tab, or folded into
  Progress; decide once H1/H2 exist and the navigation can be felt for real
  rather than guessed at.
- Activity-kind homework completes automatically through the existing
  `activity_attempts` / `onComplete` pipeline (already built in S3/S4) — no
  new completion logic needed for that half.
- Practice-kind (Cambridge/DET) homework gets a simple student-initiated
  "mark as done" button, per the v1 decision above.
- **Checkpoint:** the student sees "Your teacher assigned: Word Formation,
  Set 3," completes it, and the teacher sees it marked done on their side.

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

**Start with Phase H1.** See `Claude.md` §6 for the one-line pointer, or
jump straight to §4 above.
