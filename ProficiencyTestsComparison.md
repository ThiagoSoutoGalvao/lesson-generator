# Proficiency Tests — Comparison & Build Recommendation

*Main synthesis report, drawing on three parallel research reports: [`IELTSResearch.md`](./IELTSResearch.md), [`TOEFLResearch.md`](./TOEFLResearch.md), [`CambridgeResearch.md`](./CambridgeResearch.md). Purpose: decide what a next practice mode (after DET Practice Mode) should be, following the same architecture — local hand-authored JSON, teacher-run live in Zoom, no verbatim official content, no official branding, no fake scoring.*

---

## 1. The tests at a glance

| | **IELTS** | **TOEFL iBT** | **Cambridge English (B2 First / C1 Advanced)** |
|---|---|---|---|
| Administered by | British Council / IDP / Cambridge Univ. Press & Assessment | ETS | Cambridge Assessment English |
| Result type | Numeric band, 0–9, valid **2 years** | Numeric band, 1–6 (CEFR-aligned, changed from 0–120 in **Jan 2026**), valid **2 years** | **Pass/fail certificate at a fixed CEFR level, valid for life** |
| Primary audience | University admission (worldwide) + immigration/visas (UK, Australia, Canada, NZ) | University admission, mainly **US/Canada** | Study/work proof, strong in Europe/Latin America; no immigration-points use like IELTS |
| Speaking format | 1-on-1 live interview with a certified examiner | Solo, computer-recorded (as of Jan 2026: "Listen and Repeat" + "Take an Interview," no human present) | **Done in pairs** — two candidates + two examiners |
| Total sections | Listening, Reading, Writing, Speaking (4) | Reading, Listening, Writing, Speaking (4, newly reordered) | Reading & Use of English, Writing, Listening, Speaking (4) |
| Distinctive trait | Academic vs. General Training versions (different Reading/Writing) | Fully computer-based, now module-adaptive in Reading/Listening | Level-fixed exams (KET/PET/FCE/CAE/CPE), scores directly comparable across levels via the Cambridge English Scale |

**One-line pitch for each, if a student asks "which one should I take?":**
- **IELTS** — best default for UK/Australia/Canada/NZ, especially anything visa- or immigration-linked.
- **TOEFL** — best default for the US, and increasingly short (now ~90 minutes as of Jan 2026).
- **Cambridge** — best for students who want a certificate that never expires and don't need a specific numeric score (e.g., not chasing a visa points system); also the most "classroom-teacher-familiar" format since Cambridge itself publishes the dominant ELT coursebook series.

---

## 2. Question types mapped to Lesson Generator's existing 14 templates

This is the most actionable finding across all three reports: a large fraction of each test's question types already have a matching (or near-matching) component in the app, meaning a new practice mode is mostly **content work**, not new UI work.

| Existing template | IELTS match | TOEFL match | Cambridge match |
|---|---|---|---|
| **Sentence Transformation** | — | — | ✅ **Key word transformation** (Reading & Use of English Part 4) — same format, zero new build |
| **Word Formation** | — | — | ✅ **Word formation** (Reading & Use of English Part 3) — same format, zero new build |
| **Unjumble** | — | ✅ **Build a Sentence** (Writing task, 10 items) — same mechanic, auto-checkable | — |
| **Cloze** | Sentence/summary/table/flow-chart completion (Reading) | Complete the Words (letter-level gaps, close variant) | Multiple-choice cloze, open cloze (Reading & Use of English Parts 1–2) |
| **Quiz (multiple choice)** | Multiple choice (Reading, Listening) | Read an Academic Passage, Read in Daily Life (Reading); most Listening items | Multiple choice reading; most Listening items |
| **Matching Pairs** | Matching headings/information/features/sentence endings (Reading) | — | Multiple matching, gapped text (Reading & Use of English); speaker-matching (Listening Part 3/4) |
| **True/False/Not Given** (already built, DET-adjacent) | ✅ **True/False/Not Given** and **Yes/No/Not Given** (Reading) — direct match, this is literally the same task | — | — |
| **DET's `FillBlankDrill`** | Sentence completion (Reading/Listening) | Complete the Words (letter-level, close variant) | Listening sentence completion (Part 2 of both exams) |
| **DET's `SpeakingPromptDrill` family** | Part 1 interview, Part 2 cue card, Part 3 discussion — prep/reveal pattern transfers directly | Take an Interview (chained, no-prep — matches `InteractiveSpeakingDrill` almost exactly); Listen and Repeat (TTS + repeat, matches Pronunciation feature's mechanic) | Part 1 interview, Part 3 collaborative task, Part 4 discussion — teacher stands in for the "pair" |
| **Pronunciation's TTS/audio pipeline** | Listening audio (4 parts, self-scripted + TTS) | Listening audio (4 task types); Listen and Repeat audio | Listening audio (4 parts) |

**Genuinely new component work required**, called out specifically because nothing existing covers it well:
- **IELTS**: diagram/plan/map labelling (Listening) — a label-the-image interaction not currently built.
- **TOEFL**: none flagged as needing wholly new UI — every task type maps to an existing pattern.
- **Cambridge**: cross-text multiple matching (C1 Reading Part 6, comparing 4 short texts) — a 4-text side-by-side layout not currently in the app.

**Not practically drillable with auto-checking, in all three tests**: free-response Writing tasks (essays, emails, reports) and any open-ended Speaking beyond simple prompts. All three reports converge on the same answer here: **no auto-scoring**, show the prompt, let the student answer live, teacher gives feedback in Zoom — identical to how DET's speaking tasks already work.

---

## 3. Scoring — what NOT to build

All three tests use scoring models (IELTS band descriptors, TOEFL's AI+human writing/speaking rubrics, Cambridge's statistically-calibrated Cambridge English Scale) that are **proprietary and not licensed to third parties**. All three reports independently land on the same recommendation, which just extends the rule already in place for DET:

> **No feature should ever compute or display a number that looks like an official band/score/grade.** Show raw practice results only (e.g. "7/10 correct," "Part 3: 4/6"). Never claim predictive accuracy toward a real IELTS band, TOEFL score, or Cambridge grade.

This matters more here than it did for DET: IELTS/TOEFL scores gate real visa and university-admission decisions, so a false sense of readiness is a bigger practical risk than with DET.

---

## 4. Legal/branding — one rule set covers all three

All three reports found essentially identical legal postures, just with test-specific trademark holders. The existing DET Practice Mode precedent (no verbatim content, no official logos, non-affiliation posture) transfers cleanly:

- **Formats are not copyrightable; specific published texts/audio/images are.** Hand-authoring wholly original passages, dialogues, and prompts *in the shape of* a test's question types is safe — this is literally the business model of every third-party ELT prep publisher, including Cambridge's own commercial competitors.
- **Never reproduce or closely paraphrase official material** — no transcribing real IELTS/TOEFL/Cambridge past-paper passages, prompts, or audio scripts into the app's content, even for "personal use" (IELTS's copyright notice explicitly excludes commercial products from that allowance; Cambridge has an active anti-piracy enforcement team).
- **"IELTS," "TOEFL," "Cambridge English"/"FCE"/"CAE," and their logos are registered trademarks.** Safe naming pattern across all three: descriptive/adjectival use only — *"IELTS-style practice," "TOEFL-format speaking drills," "Cambridge-style exam practice"* — never as a product name, never with official logos, never implying affiliation or endorsement. A visible non-affiliation disclaimer is cheap insurance recommended by all three reports.
- **IELTS carries the highest stakes** of the three (explicit commercial copyright holders + direct visa/degree consequences); **Cambridge is the cheapest to build** (two templates need zero new UI); **TOEFL's Jan-2026 format shift** makes its tasks unusually small/fast to hand-author (200-word passages vs. the old 700-word ones) — a practical tailwind for content-authoring speed.

---

## 5. Recommendation

**Build Cambridge (B2 First / C1 Advanced) first.** All three reports converge on the same ranking logic, but Cambridge has the clearest cost/benefit:

1. **Lowest build cost** — Sentence Transformation and Word Formation templates already exist and match two Cambridge task types exactly; Cloze/Quiz/Matching Pairs cover most of the rest with minor content-shape adjustments.
2. **Lowest legal stakes** — no numeric score to protect, no visa/admission linkage, straightforward "pass/fail at a level" framing that's easy to present honestly as ungraded practice.
3. **Speaking maps directly onto the DET speaking architecture already built** (`SpeakingPromptDrill`), with the teacher naturally standing in for the "pair" partner Cambridge Speaking normally requires.

**TOEFL second** — every task type maps to an existing pattern (including a literal 1:1 match for Unjumble via "Build a Sentence"), and its new short-format tasks (post-Jan-2026) are fast to author at volume. Some of its content will double as IELTS-adjacent practice since Reading/Listening comprehension skills overlap heavily across tests.

**IELTS third** — richest content requirements (11 Reading question types, 4-context Listening, 5-subtype Writing Task 2, Speaking cue cards) and the highest real-world stakes if scoring expectations aren't managed carefully, but also the most requested/recognized test by name, so likely worth doing once the Cambridge/TOEFL build pattern is proven out.

This is a build-order recommendation, not a decision — happy to start scoping Cambridge Phase 1 (data model + tab wiring, mirroring how DET Practice Mode started) whenever you want to move from research to implementation.
