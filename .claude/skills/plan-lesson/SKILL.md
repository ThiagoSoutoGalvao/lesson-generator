---
name: plan-lesson
description: Plan one trilha lesson part (e.g. "Radiant 1A", "Glow 3B") with Thiago and hand him paste-ready prompts for the app's tools — Reading Text, Presentation and the /generate activity templates. Use when he asks to plan a lesson, suggest a reading text / presentation topic, or give him prompts to paste into Lesson Generator.
---

# Plan a lesson

Thiago plans lessons in chat, then pastes the prompts into the live app himself. Your job is
the planning conversation and the copy-paste blocks — **you don't generate or save anything**.
Go one tool at a time and wait for him between steps; he decides the order.

## 1. Read the lesson first

Argument is a trilha + lesson + part (`Radiant 1A`). If any is missing, ask.

- **Syllabus:** `TRILHA_TOC[trilha][lesson]` in `resources/js/lib/trilhas.js` (verbatim from the ToC PDFs).
  Default level is `TRILHA_LEVEL` (Lights A1, Glow B1, Radiant B2) — he often changes it.
- **What already exists (production, read-only):**
  `railway ssh "php artisan activities:audit --name='RADIANT L01'"` — upper-case trilha, two-digit
  lesson, no part (catches L01, L01A, L01B…). Note the angles/topics already used so suggestions don't repeat them.
- **Lesson brief** (`trilha_lesson_briefs`: target_language, vocabulary, level_notes, part_plans) — usually
  empty, but use it if filled. Read it with a `/tmp/*.php` bootstrap script over `railway ssh`
  (`require '/app/vendor/autoload.php'`, bootstrap the console kernel, `DB::table('trilha_lesson_briefs')->where('trilha', …)->where('trilha_lesson', …)->first()`).

Summarise in a few lines: the syllabus line, what's there (grouped by angle), what's missing.
Parts A/B/C split one unit: A usually introduces the core point, B and C extend or contrast it —
suggest a split if the existing work makes one obvious.

## 2. Check the real form fields every time

The forms change. Before writing any paste-ready block, read the fields from the code — never from memory
or from this file:

- Reading Text and Presentation: `resources/js/pages/UploadPage.jsx` (labels, `useState`s, option arrays,
  whether there is a Level selector).
- Activities: step 3 of `resources/js/pages/GeneratePage.jsx` (source: topic / lesson material / document;
  Level; the pre-filled **Instructions** box per template in `TEMPLATES`).

As of 2026-10-29: **Reading Text** = Topic · Target vocabulary (comma-separated) · Level · Number of
paragraphs · Extra instructions — there is **no** grammar field, the target grammar goes in Extra
instructions. **Presentation** = Topic · Extra instructions · Number of slides — **no Level selector**,
so the level goes in the instructions.

If he asks for a field a tool doesn't have, say so and put the content where it will actually reach Claude.

## 3. Suggest, then hand over

- **Suggestions:** 2–3 options, each with a topic, the target language and a one-line pitch; recommend one
  and say why (fits the part, doesn't repeat existing angles, feeds the later stages). Vocabulary gets its
  own options (e.g. collocations / feelings / expressions) when he asks or when the tool has a vocabulary field.
- **Paste-ready blocks:** one fenced code block **per form field**, labelled with the field's exact label,
  then the selector values (Level, paragraphs/slides) as bold lines underneath. When anything changes,
  give the **whole** prompt again, not a diff.
- **Extra instructions stay under 2 paragraphs.** Concrete asks Claude can follow: genre/voice, which forms
  to include, what to avoid (e.g. no finished past times with present perfect), "use every target word at
  least once" when there is a vocabulary list, how to end.
- Pitch to the level he gives; Aurora students are Brazilian adults — a "common mistakes" slide can name
  Portuguese-speaker errors.
- End with where to save it: **trilha, lesson, part, stage** (Warmer / Presentation / Practice / Production),
  and which later stages can be built from it (the pack's "+ Add" generates from the lesson's own
  presentation/reading text).

Keep chat replies short. No artifacts or docs unless he asks.
