# Cambridge Practice Mode — Feature Roadmap

**Status:** Phase 1 (Reading and Use of English, B2 First, 6 of 7 parts) shipped — see CLAUDE.md §16 "Phase Q" for what was built and how. This doc remains the source of truth for what's left: Gapped Text, Cross-Text Multiple Matching, C1 Advanced content, and Phases 2–4 (Writing/Speaking/Listening).

**Why this test, why now:** of the three researched in `ProficiencyTestsComparison.md` (IELTS, TOEFL, Cambridge), Cambridge was picked first for two reasons — (1) validated demand: one beta teacher is licensed to apply Cambridge exams in schools, so this isn't speculative the way the initial IELTS/TOEFL/Cambridge research was; (2) lowest build cost of the three — two of its Reading & Use of English question types (Key Word Transformation, Word Formation) are format-identical to templates the app already has.

**Full research:** `CambridgeResearch.md` has the exhaustive breakdown (all 5 qualification levels, exact paper timings, scoring scale, legal sourcing). This doc distills that into a build plan — read the research file for anything not covered here.

---

## Architecture decision (settled, do not revisit without reason)

This extends **Lesson Generator**, not a separate app. Considered and rejected building a standalone self-practice product for students directly — that idea is parked, not cancelled, but requires grading/recording/timer infrastructure this app deliberately doesn't have, and should only be revisited once real demand for *unsupervised student self-practice* (as opposed to teacher-run practice) is validated separately.

Cambridge Practice Mode follows the **DET Practice Mode precedent exactly**:
- Local hand-authored JSON content, no database, no Claude API calls at runtime.
- Teacher-run live in Zoom — the app shows content, the teacher/student interact with it together, no auto-scoring that claims to predict a real result.
- No recording, ever.
- No fake official score — never compute or display anything that looks like a real Cambridge English Scale score or a pass/fail grade. Show raw practice results only ("7/10 correct"), per the reasoning in `CambridgeResearch.md` §4.
- Content is original, hand-authored in the test's *format* — never verbatim/paraphrased past-paper material. Branding stays descriptive ("Cambridge-style practice"), never implies official affiliation, never uses Cambridge's crest/logo. See `CambridgeResearch.md` §5 for the full legal reasoning.
- Reference implementation to mirror: `resources/js/components/det/` (in particular `PracticeSessionShell.jsx` for shared chrome, `SpeakingPromptDrill.jsx` for the prep/reveal speaking pattern, and the `/det/practice/:type` routing pattern in `DetPracticePage.jsx`).
- Content-authoring workflow: parallel subagents, one per content type, each given the target schema + a "don't reuse this" list pulled from whatever already exists — proven in DET's batch 3 (6 content types refilled concurrently, 20–80s each).

## Scope for v1

**B2 First (FCE) and C1 Advanced (CAE) only.** These are the two levels the research focused on (best match for the app's typical adult 1-on-1 student) and the two the licensed beta teacher actually administers. A2 Key, B1 Preliminary, and C2 Proficiency are out of scope unless a specific need surfaces.

**Skills in scope, phased by build cost (cheapest first):**

### Phase 1 — Reading and Use of English
The highest-value, lowest-cost phase — most of it maps directly onto existing templates.

| Part | B2 First | C1 Advanced | Build plan |
|---|---|---|---|
| Word formation | Part 3 | Part 3 | **Reuse `WordFormationActivity` as-is** — just Cambridge-flavored content (the exact transformation patterns Cambridge tests). Zero new component work. |
| Key word transformation | Part 4 | Part 4 | **Reuse `Sentence Transformation` template as-is** — same reasoning. Zero new component work. |
| Multiple-choice cloze | Part 1 | Part 1 | Adapt existing `Cloze` template, or build a DET-style multiple-choice-per-gap component if `Cloze` doesn't fit cleanly — check `ClozeActivity.jsx` first. |
| Open cloze | Part 2 | Part 2 | Typed-answer gap-fill — same shape as DET's `FillBlankDrill`, likely a near-direct port. |
| Multiple choice reading | Part 5 | Part 5 | Passage + MC questions — same shape as DET's `ReadCompleteDrill`/`InteractiveReadingDrill`. |
| Gapped text | Part 6 (B2) / Part 7 (C1) | — | Sentences removed from a text, placed back in order — no existing analog, needs a new (but probably simple) drag-or-select component. |
| Multiple matching | Part 7 (B2) / Part 8 (C1) | — | Maps onto `Matching Pairs` with adjustment. |
| Cross-text multiple matching | — | Part 6 (C1 only) | **No existing analog.** Needs a genuinely new component — 4 short texts side-by-side (or tabbed), questions asking the student to compare across them. This is the one part of Phase 1 that isn't a cheap reuse; consider deferring just this part if it's a blocker. |

### Phase 2 — Writing
No auto-checking — same pattern as DET Read Then Speak: show the prompt, teacher watches the student write live (on paper or a doc, since Zoom screen-share means the app can't capture it) and gives feedback. This is pure content work: a bank of Part 1 essay prompts (B2: opinion essay with 2 content points; C1: essay evaluating two given viewpoints) and Part 2 genre-choice prompts (article/email/review/story/report at B2; letter/email/proposal/report/review at C1).

### Phase 3 — Speaking
Reuse the DET Part B speaking architecture (`SpeakingPromptDrill` family) — prep/reveal pattern, no timer, no recording, teacher reads the prompt live. The one wrinkle: real Cambridge Speaking is done in **pairs** (two candidates + two examiners). For a 1-on-1 teacher context, the teacher naturally stands in as the "partner" for Parts 3–4 (collaborative task, discussion) — same solve DET's Interactive Speaking already uses for its chained-question format, no new engine changes expected. Four parts: interview (Part 1), individual long turn comparing photographs (Part 2 — B2 uses 2 photos, C1 uses 3, picks 2), collaborative task (Part 3), broader discussion (Part 4).

### Phase 4 — Listening (deferred, same open question as DET)
Same reasoning as the DET Listening decision earlier in the project: real value (fits the no-writing Zoom constraint), but needs actual audio production per item (script + TTS generation via the pipeline already proven in `scripts/generate-pronunciation-audio.mjs`), not just JSON authoring — a bigger lift than everything else in this doc. Don't start this until Phases 1–3 are shipped and have real usage from the licensed teacher's students.

---

## Open questions — resolved

- **Gapped text (Part 6/7) and cross-text matching (C1 Part 6)** — deferred. Phase 1 shipped without them.
- **Naming/UI placement** — its own "🎓 Cambridge" tab in `UploadPage.jsx` (not folded into DET's launcher).
- **B2 vs C1 content split** — shipped B2 First only. C1 Advanced content is still to do for all 6 built parts, once B2 is validated with real students.

## Next up

- Get the licensed beta teacher to actually try the shipped B2 First parts with a student, and see what breaks or feels off before investing further.
- ✅ Content batch 1 done — all original 6 parts went from 2 → 5 sets each via 6 parallel subagents, plus explicit `"level": "B2 First"` labeling in both data and UI so C1 can slot in cleanly later. See CLAUDE.md §16 for details, including two flagged-but-accepted content items.
- ✅ Gapped Text (Part 6) done — the one previously-deferred B2 component, 2 sets shipped. See CLAUDE.md §16.
- ✅ Cross-Text Multiple Matching (C1 Advanced, Part 6) done — the other previously-deferred component, and the first C1 content in the app (explicit exception to the "validate B2 first" plan, approved for this one C1-only part). Turned out to reuse B2 Multiple Matching's UI entirely via a shared `TextMatchingDrill` engine — no new component needed after all. Launcher is now split into "B2 First" / "C1 Advanced" sections. See CLAUDE.md §16.
- ✅ Phase 3 — Speaking (B2 First) done — all 4 parts (Interview, Individual Long Turn, Collaborative Task, Discussion), reusing DET's `SpeakingPromptDrill` engine with two small backward-compatible additions (paired-photo prep, list-style task-card prep) plus a `watermark` prop. Long Turn's photo pairs reuse DET's already-sourced photos rather than sourcing anything new. See CLAUDE.md §16.
- ✅ Phase 2 — Writing (B2 First) done — Part 1 (Essay) and Part 2 (Genre Choice: article/email/review/story), both pure prompt-display with no capture and no auto-checking, per the explicit constraint that this app is a Zoom screen-share tool and the student can't type into it. See CLAUDE.md §16.
- Backfill further B2 Reading content (7 parts) once real usage with the teacher's student shows what's running low.
- Remaining: C1 Advanced content for Reading/Speaking/Writing (all still B2-only), and Phase 4 (Listening, deferred pending real usage) — all still waiting on B2 validation with real students before expanding further.
- **All 4 of the roadmap's originally-scoped skill areas now have at least a first B2 First pass shipped** (Reading & Use of English, Writing, Speaking; Listening remains the one deliberately deferred skill).
