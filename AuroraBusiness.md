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

**First Steps (A2)** — 1 Hello, I'm… · 2 My company · 3 My workday · 4 Numbers and prices ·
*Review 1* · 5 Around the office · 6 Arranging a meeting · 7 Simple emails · 8 Phone basics ·
*Review 2* · 9 Last week at work · 10 Products and services · 11 Business travel ·
12 Eating out with clients · *Review 3* · 13 Plans and next steps · 14 Rules and tasks ·
15 Small problems · 16 My experience · *Final day*

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
- [ ] Add the three modules as courses (config + server lists + tables of contents)
- [ ] Light theme: shared pieces
- [ ] Clean Aurora Business student app (homework first)
- [ ] Plan First Steps Unit 1 (1A/1B/1C) with `/plan-lesson`, build it in the light templates it uses
- [ ] "Use it!" per student, Writing goal
- [ ] Placement test
- [ ] Teach the pilot with a real group, adjust, then build units at teaching pace

Open questions for the partners: price (and a B2B company price), who teaches which module, class
times, who writes the placement test, what happens when a group falls to 2, certificates.

---

## 7. Done so far (newest first)

- **2026-11-10** — Module names changed to First Steps / Everyday Business / Take the Lead in
  the plan doc and the mockup. Decided: inside lesson-generator, with a clean student app from
  day one. This file created; mockup source copied to `docs/aurora-business/mockup/`.
- **2026-11-10** — Layout mockup built (6 screens) and approved; coral accent chosen. Pilot =
  First Steps (A2) Unit 1.
- **2026-11-09** — Researched Business English syllabi; course plan doc written (3 modules ×
  16 units, 52 classes each); PDF exported for the partners.
