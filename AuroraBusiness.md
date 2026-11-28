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
- **2026-11-28** — **✎ Edit inside the activity for 13 more templates** (his groups 1 + 2; gap-fills and Listening left out
  on purpose: gap spacing is fragile, listening lines are recorded). Quiz, True/False, MC Reading, Odd One Out, Signs &
  Notices, Flashcards, Unjumble, Error Correction, Role-play, Debate, Mini presentation: ✎ Edit on the item on screen,
  fix its text / options / right answer, or **Remove** it. Match Pairs ("Edit pairs") and Categorise ("Edit words" — fix,
  move or remove words; groups stay): the whole list in one form. `PATCH /api/activities/{id}/items`
  (`ActivityItemsController`: text fields only, `_from` per item, can remove but not add, checks one right answer, odd one
  among the words, no repeated words / pairs, the mistake must be in the sentence). Front end: `lib/itemEdit.jsx`
  (specs + `useItemEdit` / `useListEdit` / `EditableCard`); `ActivityRenderer` keeps the edited copy (`live`) and passes
  `onEditItems` only for saved activities (never the student app). Light screens only. Tests 4/4, QA `qa_items_edit.mjs`
  18/18 (+ Discussion / Story QA still green). Next: edit Reading and Presentation inside the activity.
- **2026-11-28** — **✎ Edit on Story Builder** (his review: some steps weren't questions, some answer words made no
  sense). On the question card (teacher only, saved activities): edit the step's "Ask", the optional full question
  (behind "Show the question") and the "Answer with" word (empty = none; the retell list follows). `story_builder`
  joined `ActivityTextController` (text only; stories / steps can't be added; old-style stories kept). Tests 4/4,
  QA `qa_story_edit.mjs` 10/10.
- **2026-11-28** — **Warmer light theme, "B · Mais quente"** (his pick, mockup https://claude.ai/artifact/WWCaHUXKsNtrNN5Q8K3muf;
  for the marketing videos too). Business screens only: warm paper ground with a soft pink wash at the top (Layout +
  LightFrame default), warm borders (`--ui-line` #E9E1D6, `--ui-well` #F7F2EC), the listening's glow behind the activity
  logo, pink→coral progress bar. Lesson page: glow title band (`.ab-hero`), glow on the selected 1A/1B/1C (`.ab-sel`),
  stage dots (`.ab-dot`), glowing "Student app" box — classes in app.css that only act under `data-ui="light"`, so
  Radiant / Glow / Lights are untouched. New `LIGHT.glowCard` / `LIGHT.chip`; Quiz uses them (question label chip, glow
  score card). Text always stays on white. QA `qa_warmth.mjs` 11/11. **Same day, every other template:** glow label chip on the
  question card (`LIGHT.chip`; `.ab-chip` for the speaking cards shared with the dark theme) and glow result cards
  (`LIGHT.glowCard` + `LIGHT.chipCenter`). Reading / Presentation / Listening / Dialogue / Unjumble keep their own labels.
  QA `qa_warmth_templates.mjs` 25/25 (12 types, laptop + phone).
- **2026-11-28** — **Readings as a magazine page** (his pick: mockup option "A · Foto ao lado",
  https://claude.ai/artifact/WbHv5SHyEP9Ezv8a6oq8yH). Business readings only (`ReadingTextActivity` light branch): warm
  paper ground #FAF6F0; laptop = photo (4:5, capped at 56% of the screen) + caption + "Words in this text" in a sticky left
  column (sticks by its bottom when taller than the screen), article right: kicker from the activity name ("FIRST STEPS ·
  UNIT 3 · READING", `name` now passed through ActivityRenderer / Library / pack / Teach now / student player), Poppins
  headline, paragraphs numbered in the margin, coral drop cap (never on an email or dialogue). Phone: photo 16:10, numbers
  above paragraphs, words last. Optional content `dek` / `byline {name, role, company}` / `pull {after, text}` are shown
  when present; new business readings ask for them (`generateReadingText(..., $group)`, `tidyMagazineExtras` drops a pull
  that isn't really in the passage); other courses' prompt unchanged. Every saved reading switches with no data change.
  Tests 3/3, QA `qa_reading_magazine.mjs` 27/27. **Backfill run on live (his yes):** 143 of 144 business readings got a dek,
  142 a byline, 123 a pull (the rest had no quote that passed the check); #1572 has one paragraph and was skipped. Cost ≈ US$0.85.
  Script `scratchpad/qa_2026-09/backfill_magazine.php`, backup of the original content in `backups/magazine_backup_2026-11-28.json`.
- **2026-11-28** — **"Taught up to": students see the course as it is taught.** On a business course the student app opens
  lessons only up to each student's mark (`users.taught_lesson` / `taught_part`, `App\Support\TaughtUpTo`); nothing marked
  = **1A only**; later lessons show a lock, "Opens after class". The teacher moves it with **Mark 4B as taught** on the lesson
  page (`TaughtMarker.jsx`, `POST /api/students/taught`; every student on the course listed, ticked if behind — untick who
  missed class; only moves forward) or sets any lesson on the Students page ("Taught up to"; a new course resets it).
  Business students now also open each lesson's **reading** (with "I've read it" → done) and **presentation**, listed first.
  Lights / Glow / Radiant unchanged (whole trilha, no readings). Tests `TaughtUpToTest` 4/4, QA `qa_taught.mjs` 15/15.
- **2026-11-27** — **"Edit text" on Picture Prompts and Discussion** (lesson-pack card, every course): fix the words by hand on the same page — each photo is shown above its question, so a question that doesn't match the picture can be rewritten; starters / follow-ups one per line; "Use it!" targets. `PATCH /api/activities/{id}/text` (`ActivityTextController`) takes only text and keeps photos, credits and the item count. Same day, after his review: an **✎ Edit** button inside the activity screen too (top of the question card; edits the picture / question on screen, teacher only — `hideSave` hides it from students; edits flow back to the pack, Library and Teach now). Tests 3/3, QA `qa_text_edit.mjs` 14/14. Next: "Change photo", then more types.
- **2026-11-27** — **Emails in readings laid out as email cards** (review found 4A / 7A cluttered). No content change: `lib/readingEmails.js` recognises a paragraph that IS an email (From / To / Subject lines, greeting, body, signature) and a story that QUOTES one ("Subject line: … Hi Leandro, … Thanks, Valentina."); `ReadingTextActivity` shows each as a mail-app card (grey header, greeting / body / sign-off on their own lines). Email paragraphs no longer count "From:" as a speaker. Also a reading that is ONE email over several paragraphs (greeting first, "Best regards, Name" last) becomes one card, and quoted emails without "Subject line:" (FS 7B, 7C). Production scan: 34 of 144 business readings now show emails as cards. `LessonDrafter` now asks for emails in that shape and no "You say it like this" notes inside them. QA `qa_reading_emails.mjs` 31/31.
- **2026-11-26** — **Listening, step 1** (plan: demo in the app → grid slot + builder → fill all courses → later
  "Listen and reply" / video). New `listening` type (`ListeningActivity.jsx`, light only), four formats: answer (T/F),
  who (who said it), complete (gaps, replay a line), message (a new voicemail + phone-message form). Made from the lesson
  reading by `App\Services\ListeningMaker` (Claude writes items, checked against the recording) + `App\Services\Speech`
  (OpenAI gpt-4o-mini-tts, one clip per line, stored in `audio_clips`, served by `GET /api/audio/{clip}`, a repeated
  line is never paid twice). `php artisan lessons:listening <course> <unit> --part= --format=`. Public demo page with the
  same four formats: https://claude.ai/artifact/1KbwroaoDexYT3kQXhnUWg
- **2026-11-26** — **Take the Lead (B2) 1–16 built** and visible (photo formats wait for a credit top-up, like
  Everyday Business 14–16). **"Write a new version" / "Edit text"** on a business lesson's reading or presentation card
  (`MaterialRedo.jsx`, `MaterialRedoController`, `RemakeFromMaterialJob`): the teacher says what should change, reads the
  new version on the same card, "Use this one" replaces it and remakes only the activities made from it on the queue
  (progress shown, can leave the page); "Edit text" fixes words by hand, remake optional. Empty Claude credit now says
  so instead of "The request was too large". A unit-plan field asking for rejected names was refused by Claude
  (reasoning extraction) — removed (5334c9d).

- **2026-11-24** — **Build a lesson with a grid** (step 1 of the faster workflow; step 2 = "Build from plan", where the
  unit plan holds the reading/presentation prompts and the app makes the materials too). On the lesson pack: pick a
  grid (`lib/lessonGrids.js` — Reading-led, Grammar-led, Vocabulary-led, Simulation, Read & check; Radiant/Glow/Lights
  also Accuracy (B2)), press Build → every activity made from the lesson's own reading / presentation, saved **hidden
  until approved**. The suggested grid is the one sharing the fewest formats with the previous lesson; every request
  carries `earlier` (the last 4 lessons' readings, presentations and words) so lessons build on each other. Same day:
  multiple-choice answer keys checked and the right answers **spread evenly across A/B/C/D** (`App\Support\AnswerOptions`
  — a Dialogue Gap-Fill had come out all-A); **photo first** for Picture Prompts / Image Vocab Match
  (`App\Services\PhotoMatcher`: Claude looks at 4 real candidate photos per item, picks one or drops the item, rewrites the
  question for that photo; the photo is saved with the activity). Word Categorisation: up to 10 words per category.
  Unit 3 plan: `docs/aurora-business/units/first-steps-03.md` (Pampa Seguros, Porto Alegre).
- **2026-11-25** — **Build from plan** (step 2). Grids now make **6 activities** (1 warmer, 3 practice, 2 production),
  each with a tick box. On a business lesson with no reading / presentation the panel offers **Draft the reading and
  presentation**: `POST /api/lesson-draft` (`LessonDraftController`) has Claude draft both prompts from the syllabus line,
  the **unit plan file** (`docs/aurora-business/units/<course>-<NN>.md` — keep writing one per unit, it is what keeps the
  cast and "new in each lesson" on track), this unit's earlier readings / presentations and the companies already used.
  The teacher edits the fields, then **Make both, then build N activities** writes and saves both (Presentation stage)
  and runs the grid from them. If one fails the other is kept and the box offers just the missing one. Also: the 2A
  Dialogue, Quiz and both Picture Prompts on the live site were re-dealt / re-matched (backup in `backups/`).
  Same day: **Story Builder rebuilt** (all courses) — the group builds the story by asking questions: an opening, then
  one step on screen at a time (ASK + ANSWER WITH a target word), "the story so far", then a retell with every word.
  A1/A2 get full questions; B1+ get cues ("Who / call / Diego / at nine?") with "Show the question". Old saved stories
  (`prompts`) keep the old card. Then: Story Builder follows the tense the lesson practises and uses the source's cast.
  **Model switched to Claude Sonnet 5.5** (`ClaudeService::MODEL`, thinking off with `between_tools`): a side-by-side of
  7 formats from the 3A reading showed the same quality as Sonnet 4.6, ~30% cheaper and ~2× faster (Haiku 5.5 was
  ~30× cheaper but weaker on role-plays / stories — not used). Real cost: ~$0.011 per activity, a whole unit ≈ $0.50.
  Item-count rules now say "exactly the number the task asks for".
  **`php artisan lessons:build FirstSteps 4`** (run on Railway, detached, log in /tmp): builds whole lessons on the server —
  unit plan (saved in the unit's 📝 brief) → reading + presentation → the suggested grid, activities hidden. **Unit 4 built
  live** (Vale Verde Tecidos, Blumenau; 18 activities, 0 failed, ~3 min). Built items say **"by Thiago"** (his call:
  students and teachers are still wary of AI) — `--by` on the command. A lesson that already has activities shows the
  grid panel folded into a "Build more with a grid…" button. A C lesson now always gets the Simulation grid (4C had lost
  it on format overlap — 4C still has no role-play). **Unit 5 built live** (Serra Azul Logística, Belo Horizonte; 18
  activities, 0 failed; 5C with the Simulation grid). Then **more items per activity** (grids ask for ~10; generator caps
  lifted) and `--refill` remade Units 4–5's 36 activities in place (all OK). **Unit 6 built** (Lume Design Studio; 17 of 18 —
  6A's Image Match found too few photos for abstract calendar words). Photo formats can come back short (2–5 items).
  Then: 6A reading rewritten as flowing paragraphs (drafts now must be flowing text, never a calendar/list); 6A refilled
  from it; photo formats now skip photos the login already used. **Found: the Unsplash key is demo tier, 50 searches an
  hour for the whole app** — the photo refill of 4A, 4C, 5B hit it and saved them WITHOUT checked photos.
  **NEXT (hand-off):** 1) push `0417e01` (search cache + clear error at the limit) — not yet approved; 2) after the hourly
  reset run `lessons:build FirstSteps 4 5 --refill --only=picture_prompts,image_vocab_match`; 3) add Unsplash download
  tracking, then Thiago applies for Unsplash Production (5,000/h); 4) "Approve lesson" + "Redo" buttons; 5) Unit 7+
  with `lessons:build`; 6) 4C has no role-play (Build more → Simulation).

- **2026-11-18** — Business courses offer **only the formats with a light screen** (`LIGHT_TYPES` in `lib/uiTheme.js`:
  Quiz, Flashcards, Unjumble, Match Pairs, Dialogue Gap-Fill, Picture Prompts, Discussion Questions and the 4
  production cards); the exam filter is hidden there and "Suggest one with Claude" picks only those types (falls
  back to other levels' picks when none fits, e.g. Take the Lead B2 practice). The other 13 come back one by one as
  their light screens ship, by layout family (reading split-screen → gap texts → sentence items → tiles); a saved
  activity's content doesn't change, so lessons built now just look better later. Unit 2 planned (Costa Verde Energy,
  Recife). Rule added: vary the city as well as the company. Prompts never name a nationality / first language.
  **Light Error Correction** (both cards): the whole list on one card, the current sentence ringed coral; the mistake
  is hidden until **Show where** (coral underline), **Show answer** strikes it red + the fix in green + Why?; fixed
  sentences keep their fix and a tick; passage version the same inside the text; no photo; Start again on the last.
  **Light True / False:** text left, statement right (stacked on a phone), no photo. At **A1 / A2 it is True / False only**
  (any course — the prompt says so, the server drops a stray Not Given, the card reads "True / False" and the
  Instructions say 3 True + 3 False); B1+ keeps Not Given (3 buttons). On business courses each statement also gets
  **evidence** (the passage sentence that proves it, checked word for word server-side), highlighted after the answer.
  **Light Odd One Out:** 2 x 2 tiles; a wrong tap stays red and struck; once the odd word is found the reason is hidden
  until **Show why** (a student says why first). **Light Word Categorisation:** words on top, one card per group below;
  each word is **checked as it is placed** (tap word then group, or drag) — wrong goes back to the pool; score = right
  first time. Neither has a photo.
  **Light Cloze:** the word bank stays at the top while the text scrolls; gaps go **in order** (current one ringed
  coral), a student taps the word and it is checked at once (wrong flashes red, the gap stops counting); Show answer
  fills a stuck gap; score = right first time (sent to the student app too). First batch of light conversions done:
  Error Correction, True / False, Odd One Out, Word Categorisation, Cloze. Next: Signs & Notices, MC Reading, MC Cloze,
  Image Vocab Match; exam-style ones (Open Cloze, Word Formation, Sentence Transformation, Read & Complete) last.
  **Light Signs & Notices:** text left (dressed as a sign, notice, chat message or **email** with From / Subject), question
  right; on business courses the prompt asks for **office texts** and adds the email kind (other courses unchanged).
  **Light MC Reading** = the True / False design (text left, one question right, evidence line highlighted after the
  answer on business courses). **Light MC Cloze** = the Cloze design (gaps in order, the current gap's 4 options in a
  panel that stays on top, a wrong option turns red and the group tries again, right first time).
  **Light Image Vocab Match:** words on top, photo cards below with the matched word **under** the photo (never on it);
  right first time score. Business courses now offer every format except the 4 exam-style ones (Open Cloze, Word
  Formation, Sentence Transformation, Read & Complete), kept for Take the Lead.
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
- **2026-11-12** — Light **Flashcards** + light **Save panel**. Bug Thiago hit: once the Aa text size had been changed, the
  shell text-scaling rule (body.tf-active main p…) reached fullscreen activities (they render inside main on /generate)
  and the light theme's indigo --tf-color made dark screens and their Save panel dark-on-dark — now skips
  .fixed.inset-0 overlays (qa_light_flashcards_save.mjs 17/17, text size raised).
- **2026-11-12** — Flashcards made split-screen (photo left, card right, same size — Thiago: the wide strip cropped the
  photo). Light **Unjumble**, same split (photo left, task right; placed words indigo, wrong red, right green;
  qa_light_unjumble.mjs 12/12). Still dark for business: 14 other practice types.
- **2026-11-13** — Flashcards bigger (photo + card fill the height, buttons in a column on the right). Code backed up
  to GitHub branch `backup/aurora-business` (not main); Unit 1 activities exported to `backups/`. **Role-play for
  groups:** business courses send `group: true` → Claude writes Student A / B roles (both ask and answer) + an optional
  role C; the card says STUDENT A / STUDENT B / STUDENT C OR THE TEACHER · OPTIONAL and has "Who's reading?" (Everyone /
  I'm A / B / C — others' briefs hidden, remembered per tab) instead of Swap roles. Non-group prompt byte-identical
  (qa_roleplay_group_backend.php 12/12); qa_light_speaking 50/50 incl. a First Steps student on a phone;
  qa_roleplay_group_request 5/5. Built by defaults to Thiago on business courses.
- **2026-11-15** — Pushed to main and live (17 commits, no DB changes). Unit 1 imported on the live site (ids 472–478).
- **2026-11-16** — Decided: every lesson is Warmer → Presentation → Practice → Production with **something new**
  (A = core grammar/vocab, B = a second point that extends it — usually questions/negatives, C = functional language +
  the simulation). Thiago will write all reading texts/presentations; other teachers build activities from them with
  "+ Add" (a "teacher edition" pack of the skill comes after Unit 1). 1B = questions with "do" (I / you) + a Nordia job
  interview reading (Paula → hired, her first day is 1C). Light **Dialogue Gap-Fill** (dialogue left, options right;
  qa_light_dialog_gap_fill.mjs 16/16). Still dark for business: 13 practice types.
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
