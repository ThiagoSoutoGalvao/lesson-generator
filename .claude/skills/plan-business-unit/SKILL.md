---
name: plan-business-unit
description: Plan one Aurora Business unit (First Steps / Everyday Business / Take the Lead, e.g. "First Steps 1", "Everyday Business 5") with Thiago — the whole unit 1A/1B/1C for a group of 2–4, simulation first, homework that prepares each next lesson — then hand him paste-ready prompts for Reading Text, Presentation and /generate, one tool at a time. Use for any Aurora Business lesson planning; Lights/Glow/Radiant use /plan-lesson instead.
---

# Plan an Aurora Business unit

Thiago plans in chat and pastes the prompts into the app himself. Your job is the planning conversation,
the unit plan file and the copy-paste blocks — **you don't generate or save activities**. Go one tool at a
time and wait for him between steps.

Read `AuroraBusiness.md` first (decisions table §2, course §3, layout §4). This skill is the short version of
those rules; if they disagree, the decisions table wins — and fix this file.

## The rules (every unit, every activity)

1. **Groups, always.** 2–4 students, even numbers preferred. Nothing assumes one student + the teacher.
   Every activity says **how the group works it**: take turns (practice screens — each item goes to the next
   student by name), pairs (breakout rooms, then one pair performs in the main room), or whole group
   (jigsaw, report back, "find someone who").
2. **Odd numbers.** Every pair task has an **optional third role** (an observer who ticks "Use it!", or a
   third person in the scene). The teacher may also partner the extra student. Jigsaws are written for 4
   pieces; with 3 students the teacher takes the fourth.
3. **The unit is the arc, not the lesson.** A = input, B = practice, C = simulation (the can-do in a
   realistic workplace task). Inside a lesson the stages (Warmer / Presentation / Practice / Production) are
   labels, **not a fixed order** — a lesson may start with the task. Note: Teach now plays in stage order;
   say so if a lesson wants another order.
4. **Homework always prepares for the next lesson.** A → B: consolidate the input. B → C: **prepare the
   simulation** (e.g. "write 3 sentences about your job for the meeting"). C → next A: a short warm-up for
   the next unit's topic. One ~10-minute activity per class, in the student app.
   **Writing thread:** the C → next A homework is always **one short email or message** that leads into
   the next unit (after Unit 1: an email introducing yourself to your new team).
5. **60 minutes.** Budget roughly: warmer 5–10 · input 15–20 · practice 15–20 · production 15–20. Usually
   3–5 activities per lesson, never more than fits.
6. **One cast per unit, a new company every unit.** The 1A core material introduces the people and the
   company; 1B and 1C reuse them (the quiz asks about them, the role-play casts them). Each unit uses a
   **different fictional company** in a different kind of workplace (an energy supplier, a bank, a hospital
   office, a software house…) so students see different environments — but the work shown is **office
   work**, not the industry itself. Never use a real company's name (some students work at CPFL — invent a
   similar one). List the companies already used in the unit plan files and don't repeat one in a module.
7. **First Steps = office survival.** What A2 office workers use every day: emails (send and reply),
   short presentations, office vocabulary, scheduling meetings, calls, quick messages. Company types and
   industries are for Everyday Business / Take the Lead.
8. **Threads in every unit:** one typical Brazilian mistake (false friends, "I have 30 years", missing
   a / an with jobs…) and politeness vs. directness where it fits.
9. **Real material is welcome.** Where a task can use the students' own jobs, emails or companies, say so.

## 1. Plan the unit (before any prompt)

- **Syllabus:** `TRILHA_TOC[course][unit]` and `TRILHA_LEVEL` in `resources/js/lib/trilhas.js`
  (course keys `FirstSteps` A2 / `EverydayBusiness` B1 / `TakeTheLead` B2). The full can-do, grammar,
  vocabulary and 1C simulation per unit are in the plan doc linked in `AuroraBusiness.md`.
- **What exists:** the unit plan file (`docs/aurora-business/units/<course>-<NN>.md`) if any, then the
  activities. Business courses may still be **local only** — check `git log origin/main..main` and whether the
  live site has the course before suggesting `railway ssh "php artisan activities:audit --name='FIRST STEPS L01'"`;
  locally, query the `activities` table with a PHP bootstrap script (ignore the `DEMO Aurora Business` folder).
- **Plan backwards:** the 1C simulation first → the language it needs → the 1A core material that
  delivers it → the 1B practice → the homework chain (rule 4).
- Show it as one table: lesson · stage · activity · **how the group works it**, plus the homework line
  between lessons. Agree it with Thiago, then write it to the unit plan file (template below).

## 2. Build it, material first

Order: the **1A core material** (Reading Text or Presentation) → the other 1A material → the activities
built from it (the pack's "+ Add" generates from the lesson's own presentation / reading) → 1B → 1C.

**Check the real form fields every time** — never from memory: Reading Text / Presentation in
`resources/js/pages/UploadPage.jsx`; activities in step 3 of `resources/js/pages/GeneratePage.jsx`
(`TEMPLATES`, the pre-filled Instructions box). As of 2026-11-11: Reading Text = Topic · Target vocabulary ·
Level · Number of paragraphs · Extra instructions (no grammar field); Presentation = Topic · Extra
instructions · Number of slides (**no Level selector** — put the level in the instructions).

**Length limits** are server-side `max:` rules in `app/Http/Controllers/ActivityController.php` (2026-11-11:
Topic ≤ 200, Target vocabulary ≤ 500, Extra instructions ≤ 3000, /generate Instructions ≤ 1000). Count every
block's characters before handing it over and stay well under.

**Hand-over format:** 2–3 options with a recommendation when there is a real choice; then one fenced code
block **per form field**, labelled with the field's exact label, selector values as bold lines underneath.
When anything changes, give the whole prompt again. Extra instructions stay under two paragraphs and always
say: the cast, the level, the group use (e.g. "each paragraph must make sense on its own — each student reads
one"), what to avoid, "use every target word at least once" when there is a vocabulary list.

**Group wording in /generate prompts:** discussion questions are asked to a partner or the group ("Ask your
partner…", "Find someone who…"); role-play cards are Student A / Student B (+ optional C); practice items are
short enough to take in turns.

End each step with where to save it: **course, unit, lesson (A/B/C), stage**, and what to build next.

## 3. Keep the record

After each step, tick it in the unit plan file. When the unit is built, add a dated line to §7 of
`AuroraBusiness.md`. If a template can't do what the group rules need yet (e.g. role-play still says
TEACHER / STUDENT), say how the teacher runs it today and list it under "App gaps" in the unit file.

### Unit plan file template

```markdown
# <Course> — Unit <N>: <title>

Level · can-do · language · vocabulary · simulation (from TRILHA_TOC)
Cast: …

| Lesson | Stage | Activity | Group | Status |
|---|---|---|---|---|

Homework: A→B … · B→C … · C→next …

App gaps: …
```
