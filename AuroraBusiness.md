# Aurora Business — Project Brief & Log

> **Read this first** when picking Aurora Business back up in a new session.
> §1–§6 are the current plan and decisions. §7 is the "done so far" log: add a dated line
> every time something is finished, newest first.

---

## 1. What it is

A Business English course for **small groups of 3–4 office workers**, taught online by Aurora
teachers. The Aurora partners agreed (early Nov 2026) that small groups are the goal, and many
current students already work in offices and companies, so Business English is the niche.

The course is built around **workplace skills** (emails, calls, meetings, presenting,
negotiating). Vocabulary and grammar serve those skills. Students can bring their own real
material, such as an email they must write, which is the edge over apps and big chains.

**Links**
- Course plan (Claude Docs, the full unit tables): https://claude.ai/artifact/2WNuvtsXC9iJEXLNiGtP3K
  — PDF copy: `docs/aurora-business/Aurora Business - Course Plan.pdf` (exported 2026-11-09, still
  shows the *old* module names)
- Layout mockup (Design canvas): https://claude.ai/artifact/2omLvoVvSnLr3BKbMHDdq9
  — source copy: `docs/aurora-business/mockup/` (`.dc.html` artboards + `canvas.json`)

---

## 2. Decisions (all by Thiago)

| Date | Decision |
|---|---|
| 2026-11-09 | Name: **Aurora Business** |
| 2026-11-09 | **60-minute** online classes, **twice a week** |
| 2026-11-09 | **Closed groups** of 3–4: start together, finish together, nobody joins mid-module |
| 2026-11-09 | **Placement test** decides the starting module |
| 2026-11-09 | Sell **one 6-month module at a time**; the next module is the renewal |
| 2026-11-09 | Keep an **A2 module** — most of our students are A2 |
| 2026-11-10 | Pilot = **First Steps (A2), Unit 1** |
| 2026-11-10 | Lives **inside lesson-generator** (same app, login, database), not a separate project |
| 2026-11-10 | New **light layout** ("white, clear for reading"); **coral accent** chosen; mockup approved as is |
| 2026-11-10 | **Clean student app from day one** for Aurora Business students (not "build now, clean up later") |
| 2026-11-10 | Module names: **First Steps / Everyday Business / Take the Lead** |
| 2026-11-11 | **Designed for groups, always** — every template and activity must favour group work. Max **4** per group; **even numbers are better** (pair work). Nothing assumes one student + the teacher |
| 2026-11-11 | **Pair work = a mix**: practise in Zoom breakout rooms (each student sees their own role card on the phone), then one pair performs in the main room (shared screen) |
| 2026-11-11 | **Odd numbers**: pair tasks offer an optional third role (e.g. observer who ticks "Use it!"); the teacher can also partner the extra student — teacher chooses each class |
| 2026-11-11 | **Practice screens (quiz, gap-fills…) = take turns**: each question goes to the next student by name; the screen shows whose turn it is |
| 2026-11-11 | **Homework always prepares for the next lesson** (before a C lesson = prepare the simulation). Three lessons per unit stay; the weekend falls in a different place each unit and that's fine |
| 2026-11-11 | **A different fictional company each unit** (different environments; never a real name — some students work at CPFL). Unit 1 = Nordia Foods |
| 2026-11-11 | **First Steps focus = office survival**: emails, short presentations, office vocabulary, scheduling meetings. Company types / industries move to the later modules |
| 2026-11-12 | New First Steps unit list approved (units 2, 4, 8, 10, 11, 12 changed — a presentations unit added). **Writing thread**: each unit ends with a short email/message homework |
| 2026-11-11 | Units are planned with the **`/plan-business-unit`** skill (whole unit, simulation first, group rules); each unit's plan is saved in `docs/aurora-business/units/` |

---

## 3. The course

Three modules of **6 months / 52 classes** each:
**16 units × 3 lessons (A input · B practice · C simulation) = 48 + 4 flex days**
(review & simulation days after units 4, 8, 12, plus a final-project day). A unit takes about
1½ weeks. Homework: one ~10-minute activity per class in the student app.

```
Placement test ─┬─ A2   → First Steps        (6 months) ─┐
                ├─ B1   → Everyday Business  (6 months) ←┘ renew
                └─ B1+  → Take the Lead      (6 months) ← renew
```

**First Steps (A2)** — office survival (changed 2026-11-12) — 1 Hello, I'm… · 2 My team and my role ·
3 My workday · 4 Numbers, dates and contact details · *Review 1* · 5 Around the office · 6 Arranging a
meeting · 7 Simple emails · 8 Calls and video calls · *Review 2* · 9 Last week at work · 10 A short
presentation · 11 Quick messages · 12 Small talk at the office · *Review 3* · 13 Plans and next steps ·
14 Rules and tasks · 15 Small problems · 16 My experience · *Final day*
(Business travel and eating out with clients left First Steps — consider them when planning Everyday
Business. Full wording per unit: `TRILHA_TOC.FirstSteps` in `resources/js/lib/trilhas.js`.)

**Writing thread (all modules):** every unit's last homework is one short email or message that prepares
the next lesson (e.g. after Unit 1: an email introducing yourself to your new team).

**Everyday Business (B1)** — 1 Networking and small talk · 2 My role and my company ·
3 Email essentials · 4 Chat and messaging · 5 Video calls · 6 Phone calls · 7 Taking part in
meetings · 8 Opinions · 9 Presenting: structure · 10 Data and trends · 11 Customers and
complaints · 12 Problem solving · 13 Project updates · 14 Deadlines and priorities ·
15 Negotiation basics · 16 Pulling it together (+ review days and final day as above)

**Take the Lead (B1+/B2)** — 1 Pitching an idea · 2 Persuasive presentations · 3 Tough
questions · 4 Chairing meetings · 5 Decision-making · 6 Negotiation strategy · 7 Handling
conflict · 8 Feedback · 9 Coaching and delegating · 10 Working across cultures · 11 Writing
reports · 12 Writing proposals · 13 Career moves · 14 Communicating change · 15 Crisis
communication · 16 Strategy (+ review days and final day)

Can-do goals, grammar, vocabulary and the 1C simulation for every unit: see the plan doc.
Threads in every module: typical Brazilian mistakes (false friends, "I have 30 years") and
politeness vs. directness.

---

## 4. Layout (approved 2026-11-10)

- **White surfaces, dark text** (Aurora indigo `#271D62`, muted text `#4A5163`) on a light grey
  ground `#F6F7F9`, borders `#DDE1E8`. **No glass, no transparency.**
- **Photos beside or above the text, never behind it** (business photos via Unsplash, which we
  already use).
- **One accent: coral** — buttons `#E0521F` + white text, selected/tint `#FDEEE7`, accent text on
  tint `#9A3412`. Right `#1E7A4C` / tint `#E5F4EC`; wrong `#B42318` / tint `#FDECEA`.
- **Poppins** headings, **Inter** reading text, big type (quiz question 34 px on the teacher
  screen, 23 px on the phone). The Display ("Aa") panel stays.
- **Phone first**: every template must work in one column at 390 px, because a new version of
  the student app is planned.
- Mockup screens: foundations · quiz (teacher) · A2 role-play card with per-student "Use it!" ·
  lesson pack Unit 1 · student "My course" · student homework quiz.

---

## 5. How it fits the app

**Reused as is:** courses + units of three lessons (1A/1B/1C), lesson packs, "Teach now",
`/generate` and its templates, Reading Text, Presentation, "Suggest one with Claude", the
production templates (role-play, debate, mini presentation, story builder), homework,
progress, accounts, Railway.

**New:**
1. The three modules as courses (beside Lights / Glow / Radiant in `lib/trilhas.js` and the
   server-side lists), with their unit tables of contents and default levels (A2 / B1 / B2+).
2. A **light theme** switched on per course — shared pieces first (page frame, lesson pack,
   speaking shell), then only the templates a unit needs.
3. A **clean student app** for Aurora Business students: homework first, then the course; two
   tabs at most; Cambridge/DET drills hidden or behind a small "Extra practice" link. Later the
   model for cleaning up the app for the other courses.
4. **"Use it!" with ticks per student** for groups.
5. A **Writing** goal on `/generate` (emails from First Steps unit 7).
6. A **placement test** (static, hand-written, no AI) before groups are formed.

The student app's confusion today (found 2026-11-10): the Practice tab lists ~25 drills, and
Homework is hidden inside the Progress tab.

---

## 6. Plan — status

- [x] Research + course plan doc
- [x] Layout mockup, approved with coral
- [x] Decide: inside lesson-generator, names, pilot module
- [x] Add the three modules as courses (config + server lists + tables of contents) — flex days not modelled yet
- [x] Light theme: shared pieces — tokens, page frame, Lessons overview, lesson pack, Teach now, Library picker
- [x] Light templates: Quiz
- [x] Light templates: speaking — Role-play, Story builder, Debate, Mini presentation, Discussion, Picture prompts + "Use it!"
- [x] Light templates: Reading Text, Presentation (1A)
- [ ] Light templates: the other practice types (flashcards, match pairs, gap-fills…) as units need them
- [x] Clean Aurora Business student app — two tabs (Course, Progress), homework first, light; no Cambridge/DET
- [x] Light Materials (Presentation + Reading Text tabs) and Generate page, and Library launch of a business activity
- [ ] Role-play cards: "You can say…" sentence starters for A2 (in the mockup; needs a generator + data change)
- [ ] Plan First Steps Unit 1 (1A/1B/1C) with `/plan-business-unit`, build it — plan written, 1A reading made
- [ ] Group-ready templates: role-play Student A / B (+ optional C) with cards on phones, "whose turn" on practice screens, group wording in Claude's prompts for business courses
- [ ] "Use it!" per student, Writing goal (now needed for the writing thread)
- [ ] Placement test
- [ ] Teach the pilot with a real group, adjust, then build units at teaching pace

Open questions for the partners: price (and a B2B company price), who teaches which module, class
times, who writes the placement test, what happens when a group falls to 2, certificates.

---

## 7. Done so far (newest first)

- **2026-11-12** — **Light Materials + Generate + Library launch.** Thiago found the Materials form and the first
  view of a new reading still in the glass look. Now: while the lesson session (`lib/lessonSession.js`, set by a
  pack's "+ Add" or the last save) is a business course, Materials (Presentation + Reading Text tabs) and Generate
  draw their forms light (`lib/lightForm.js` classes) and the activity they make opens light; Materials shows a
  "Making it for: … · Change" banner like Generate's, and Reading Text starts at the course level (A2). Library
  turns light while a business activity is launched. Dark classes for the other courses are unchanged. Course book
  (PDF) and Essay Feedback tabs are still dark. Checks: `qa_light_forms.mjs` (17); `qa_light_theme` 20,
  `qa_light_materials` 22, lesson pack 32, lesson material 18 pass.
- **2026-11-12** — New First Steps unit list (office survival) in `TRILHA_TOC`; writing thread rule.
- **2026-11-12** — Light Presentation re-laid out (Thiago: empty space left of the long examples column): title across
  the top, photo top-left growing to match the examples, rule + form under it (3bf0f87, `qa_pres_layout.mjs` 7/7).
- **2026-11-12** — Light Match Pairs (Thiago: columns too close, a group had to scroll to see every option): full width,
  words narrow / meanings wide with a 40–64px gap, tiles share the screen height so 8 pairs fit a 1366×768 laptop,
  matched pairs numbered on both sides, light end screen listing the pairs (`qa_light_match_pairs.mjs` 13/13). Thiago
  deleted the demo activities himself.
- **2026-11-11** — Group-first rules decided (see §2); `/plan-business-unit` skill; Unit 1 plan in
  `docs/aurora-business/units/first-steps-01.md`; local demo (`scratchpad/demo_business.php create|cleanup`).

- **2026-11-10** — **Clean student app for Aurora Business students.** Decided: **two tabs only, Course and
  Progress — no Practice tab, no Cambridge/DET** ("as clean as possible"). `StudentShell` gives a business
  student `BusinessShell` (`student/business/BusinessPages.jsx`) with the light theme on: Course = homework
  first (to do, with the teacher's note; "No homework right now" otherwise), course progress, the current unit
  (the first with something left to do) with its 1A/1B/1C, then all 16 units; a unit page with "What you'll
  learn" and each lesson's activities (names without the `FIRST STEPS L01B · Quiz ·` prefix, scores shown);
  Progress = completed count, recent results, speaking in class, Log out. Old `/s/practice` links land on
  Course. Lights/Glow/Radiant students keep the old app. Checks: `qa_business_student.mjs` (31, incl. a quiz
  with one wrong answer showing 1 / 2 on the unit page and Progress); old student suites (146) pass.
  Note: Reading Text and Presentation are teacher-only types, so students don't see 1A's reading/presentation
  in their course (only a Presentation assigned as homework) — unchanged, decide later if they should.

- **2026-11-10** — **Light theme, step 3: Reading Text and Presentation.** Reading Text: photo band, the passage
  on a white card in an 860px column (20px text), vocabulary on its own card, "Make an exercise from this
  text" as buttons (the derived activity opens light too). Presentation: one coral accent instead of a colour
  per slide, rule on a tinted card, examples on white cards, photo above the examples, slide dots. Both keep
  their PDF print views. Checks: `qa_light_materials.mjs` (22, incl. the phone wheel-scroll to Next slide);
  old `_tmp_qa_lesson_material` 18, `_tmp_qa_presentation_homework` 12, `qa_presentation_mobile` 9,
  `qa_reading_level` 9 pass. Still local, not pushed.

- **2026-11-10** — **Light theme, step 2: the speaking templates.** `SpeakingActivityShell` (Role-play, Story
  builder, Debate, Mini presentation) has a light layout — card left, "Use it!" right, stacked on a phone — and
  the four cards, Discussion questions, Picture prompts (whole photo on its own panel) and the "Use it!"
  checklist follow the `ui-*` tokens. `useInkColor()` (lib/uiTheme.js) keeps text indigo on light screens even
  if the Display panel has white/yellow chosen. Checks: `qa_light_speaking.mjs` (40, incl. ticks saved to a
  student, phone scroll); old `qa_production` 44, `_tmp_qa_useit` 36, `_tmp_qa_lesson_mode` 25 pass.
  `qa_batch2`'s "Library labels the new types" fails **before and after** this change (an old test, not the
  theme). Still local, not pushed.

- **2026-11-10** — **Light theme, step 1.** How it works: `ui-*` colour tokens in `app.css` (`text-ui-ink`,
  `bg-ui-card`, `border-ui-line`…) are the old dark look by default and turn light when `<html data-ui="light">`
  is set. `lib/uiTheme.js`: a screen calls `useLightUi(isLightCourse(trilha))`, so only Aurora Business courses
  turn light. Converted: page frame (`Layout`: white header, dark logo), Lessons overview, lesson pack, Teach
  now player, Library picker, stage dropdown, the "Aa" button (its text-colour swatches are hidden in light).
  Light templates are drawn with `components/light/LightFrame.jsx` (header, photo panel, buttons); **Quiz** is
  the first one (photo beside the question, a band above it on a phone). Not converted yet: every other
  template, the student app. Checks: `scratchpad/qa_2026-09/qa_light_theme.mjs` (20) + the old lesson
  suites (158) still pass. Still local, not pushed.

- **2026-11-10** — The three modules exist in the app as courses: `FirstSteps`, `EverydayBusiness`,
  `TakeTheLead` (16 units × A/B/C, levels A2 / B1 / B2, a table of contents per unit from the plan).
  They appear on Lessons, Library, Save, Students and the student app. Still in the **old dark look**;
  the light theme is the next step. Server list: `App\Support\Trilhas`. Details: `docs/PROJECT_LOG.md` §40.

- **2026-11-10** — Module names changed to First Steps / Everyday Business / Take the Lead in
  the plan doc and the mockup. Decided: inside lesson-generator, with a clean student app from
  day one. This file created; mockup source copied to `docs/aurora-business/mockup/`.
- **2026-11-10** — Layout mockup built (6 screens) and approved; coral accent chosen. Pilot =
  First Steps (A2) Unit 1.
- **2026-11-09** — Researched Business English syllabi; course plan doc written (3 modules ×
  16 units, 52 classes each); PDF exported for the partners.
