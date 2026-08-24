# TOEFL iBT Research — Feasibility Report for a "TOEFL Practice Mode"

**Prepared:** August 2026
**Purpose:** Evaluate whether a TOEFL practice mode (parallel to the existing DET Practice Mode) can be built the same way — hand-authored local JSON content, teacher-run live in Zoom, original practice material modeled on the test's format/skills, no verbatim ETS content, no official branding.

> **Important timing note:** TOEFL iBT changed format **twice** in recent years — a shortening in **July 2023**, and then a much larger structural overhaul effective **January 21, 2026** (i.e., ~7 months before this report was written). Most blog posts, prep-site articles, and even some Google-indexed summaries you'll encounter when researching this test still describe the **2023–2025 format** (essays, independent/integrated speaking tasks, 0–120 scoring only), which is now outdated. This report documents the **current post-January-2026 format** as primary, with the prior format noted for context since a lot of secondary sources conflate the two.

---

## 1. Overview

**What it is:** TOEFL iBT ("Test of English as a Foreign Language, internet-based test") is a standardized English proficiency exam for non-native speakers, primarily used to demonstrate readiness for study at English-medium universities.

**Who administers it:** **ETS (Educational Testing Service)**, a US-based nonprofit testing organization (also known for the GRE, TOEIC, and — historically — the SAT). ETS owns the TOEFL and TOEFL iBT trademarks and produces all official test content and prep materials.

**Who takes it:** Mainly international students applying to universities/colleges in the **United States and Canada**, where TOEFL has historically been the dominant admissions test. It's also accepted by institutions and immigration/government bodies in **160+ countries**, but its stronghold is North America — some graduate programs, scholarship boards (e.g., Fulbright), and professional licensing bodies also require it.

**TOEFL vs. IELTS:**
| | TOEFL iBT | IELTS |
|---|---|---|
| Administered by | ETS (US) | British Council / IDP / Cambridge |
| Primary use case | Academic admission (university) | Academic **and** general/immigration (IELTS General Training variant) |
| Strongest region | US, Canada | UK, Australia, New Zealand, Canada (immigration) |
| Format | Fully computer-based, all sections on one machine | Computer or paper-based; Speaking is a live interview with a human examiner (in-person or video) |
| Accent exposure | Mostly North American English in audio | Mix of British, Australian, and other accents |
| Scoring (as of 2026) | 1–6 band scale (was 0–120 through 2025) | 0–9 band scale |

TOEFL is generally the safer default for a student targeting a US or Canadian university; IELTS is generally preferred for UK/Australia/immigration pathways. Many universities now accept either.

---

## 2. Test Structure (Current Format — Effective January 21, 2026)

ETS calls this the "enhanced" or "next-generation" TOEFL iBT. Total testing time dropped to **approximately 90 minutes** (some sources say 67–90 minutes depending on adaptive routing), down from ~3 hours (pre-2023) and ~116 minutes (2023–2025).

**Section order changed**: Reading → Listening → Writing → Speaking (Writing now comes before Speaking; previously Speaking was third).

| Section | Approx. Time | Items | Format notes |
|---|---|---|---|
| **Reading** | ~30 min | ~50 items (varies with adaptive routing) | Multistage **adaptive**: two modules; performance on Module 1 determines whether Module 2 is the easier or harder version |
| **Listening** | ~29 min | ~47 items | Also multistage adaptive, same module-routing logic as Reading |
| **Writing** | ~23 min | 12 tasks | Not adaptive; fixed task set |
| **Speaking** | ~8 min | 11 tasks | Not adaptive; fixed task set |

**Key structural changes vs. the pre-2026 test:**
- **Adaptivity is new.** Reading and Listening now route test-takers into an easier or harder second module based on first-module performance (module-level adaptivity, not per-question). This is analogous to how the DET already works, and to how Duolingo-style CAT testing operates — worth noting since your app already has DET experience with this concept, though for a *practice tool* built from static JSON, true adaptivity isn't necessary (see Section 5).
- **No unscored/experimental questions** (a change ETS made back in 2023 — every question now counts).
- **No scheduled breaks** anywhere in the test.
- **The Speaking and Writing sections were completely redesigned** — the old "independent essay," "integrated essay," and the 4-task Speaking format (1 independent + 3 integrated tasks) are **gone**, replaced by entirely new task types (see Section 3).
- **Score scale changed** from 0–120 to a 1–6 CEFR-aligned band scale (Section 4).

**For context — the 2023–2025 interim format** (still what most search results and prep sites describe, since the Jan 2026 change is very recent): ~116 minutes total, Reading (2 passages, ~700 words each, 10 questions each), Listening (28 questions, 3–4 lectures + 2–3 conversations), Speaking (4 tasks: 1 independent "give your opinion" + 3 integrated read/listen/speak tasks, ~17 min), Writing (2 tasks: 1 integrated essay + 1 "Writing for an Academic Discussion" forum-post task, which had itself replaced the old independent essay in July 2023). If your existing knowledge of TOEFL is "read a passage, give your opinion in 45 seconds, write two essays" — that's this now-superseded format.

---

## 3. Question Types in Detail (Current, Post-Jan-2026 Format)

This section is written with an eye toward "which of these can become a discrete practice drill," matching how the DET Practice Mode broke its four Part-A skills into `ReadSelectDrill`, `FillBlankDrill`, `ReadCompleteDrill`, `InteractiveReadingDrill`, etc.

### 3.1 Reading — 3 task types, ~50 items total

1. **Complete the Words** — a short academic paragraph (~70–100 words) with 10 words missing letters/fragments; the test-taker must type the missing letters to complete each word correctly (spelling matters). This is a vocabulary-in-context / word-formation task at its core.
   - *Drill analog:* very close to your existing `FillBlankDrill` mechanic (typed answer, letter-count/reveal hint), just gapped at the letter level within a word rather than gapping whole words in a sentence.
2. **Read in Daily Life** — short practical/everyday texts (15–150 words): emails, text-message threads, social media posts, notices, menus, flyers, ads, invoices. Each has 2–3 multiple-choice questions (detail, purpose, inference about a real-world text).
   - *Drill analog:* multiple-choice comprehension on a short authentic-style text — straightforward to build as an original-content MC drill, similar in shape to your `ReadCompleteDrill`/`InteractiveReadingDrill` machinery.
3. **Read an Academic Passage** — a short academic passage (~200 words, down from 700+ words pre-2026) on history, natural science, social science, or the arts, with 5 multiple-choice questions per passage covering:
   - Main Purpose / Main Idea
   - Detail
   - Vocabulary in Context
   - Inference
   - Rhetorical Purpose ("why does the author mention X")
   - NOT/EXCEPT questions
   - Two newer types: **Important Idea / Select the Sentence** (essentially the old "sentence insertion" concept, now framed as picking the sentence that best expresses a key idea) and **Paragraph Relationship** (how two parts of the passage relate)
   - *Drill analog:* directly maps onto a classic MC quiz drill (like your `QuizActivity`) with a passage panel — essentially the same shape as DET's `InteractiveReadingDrill` split-screen pattern.

### 3.2 Listening — 4 task types, ~47 items total

1. **Listen and Choose a Response** (15–19 items, CEFR A1–B2) — short, single-exchange dialogue snippets; pick the appropriate response. Tests basic pragmatic/functional listening.
2. **Listen to a Conversation** (~10 items, A2–C1) — short two-person dialogues (e.g., student–advisor, roommate conversations), with comprehension questions.
3. **Listen to an Announcement** (6–10 items, A2–C1) — single-speaker campus-style announcements (e.g., library hours, event notices).
4. **Listen to an Academic Talk** (8–16 items) — mini-lectures on academic topics, the closest analog to the old-format "lecture" listening passages.

Across these, the recurring **question types** (per ETS blueprint and third-party analysis) are:
- Main idea / gist
- Detail (directly stated)
- Function/purpose ("why does the speaker say this")
- Attitude/tone (what the speaker feels or implies through tone)
- Organization/connecting content (how ideas relate structurally)
- Inference

- *Drill analog:* audio-clip-plus-MC-questions drills — would need self-recorded or TTS-generated audio (same pattern already used in the Pronunciation feature, which self-hosts audio and does OpenAI TTS for anything Wikimedia doesn't cover). Short single-exchange and announcement items are easy TTS candidates; multi-turn conversations and lectures are more production work but still buildable as original scripts read by TTS voices.

### 3.3 Writing — 3 task types, 12 items total, ~23 min

1. **Build a Sentence** (10 items, ~7 min) — given a scrambled set of words, arrange them into one grammatically correct sentence. Pass/fail machine-scored. This is essentially an **Unjumble** drill — you already have this exact template built (`Unjumble`, template #3 in your 14-template list).
2. **Write an Email** (~7 min, 80–120 words) — respond to a prompt requiring a practical email (make a request, propose a solution, respond to an academic scenario). Scored 0–5 by AI + human raters on content/organization/language use.
3. **Write for an Academic Discussion** (~10 min) — add a post to a simulated online class-discussion forum, responding to a professor's prompt and engaging with (fictional) classmates' posts. Also scored 0–5. (Note: this task itself dates to the July 2023 change, when it replaced the old "independent essay"; it has carried over unchanged into the 2026 restructuring.)
   - *Drill analog:* both writing tasks are free-text production with no single correct answer — outside the scope of an auto-scored drill like your existing templates (which are all click/select/type-exact-match). A practice version would realistically be: show the prompt, let the student type/speak their answer, teacher gives live feedback in Zoom — closer to how you already framed **DET's speaking tasks** (no auto-scoring, "talk through how it went"). Build a Sentence is the one Writing task type with a clean auto-checkable answer.

### 3.4 Speaking — 2 task types, 11 items total, ~8 min

1. **Listen and Repeat** (7 items) — hear a sentence about a shared scenario (e.g., a campus tour, a step-by-step process), repeat it exactly after a beep. Sentences get progressively longer. An accompanying static image sets context. Scored on exact wording, word order, and intelligibility/pronunciation — not content.
   - *Drill analog:* extremely close to your Pronunciation feature's existing mechanics — play audio, student repeats, no "correctness" scoring possible without speech recognition, but the format (increasingly long sentences, single scenario/image) is trivially reproducible as original content with TTS audio.
2. **Take an Interview** (4 items) — a simulated real-time interview: 4 questions on one shared everyday topic (context builds question-to-question rather than resetting), no prep time, no notes, ~45-second spoken response per question, heard once.
   - *Drill analog:* structurally almost identical to what you already built for DET's **Interactive Speaking** (`InteractiveSpeakingDrill.jsx`) — a chained sequence of topic-linked questions with no prep/reveal step, no scoring, teacher gives live feedback. You could very plausibly reuse most of that component's shape for a TOEFL version.

There is no longer an "independent opinion" speaking task or a read/listen/speak "integrated" task in the current format — those were the hallmark of TOEFL Speaking pre-2026 and are gone.

---

## 4. Scoring

**Current scale (effective January 21, 2026):** each of the 4 sections (Reading, Listening, Speaking, Writing) is scored on a **1.0–6.0 band scale**, in 0.5-point increments, aligned to CEFR levels:

| Band | CEFR |
|---|---|
| 1 | A1 |
| 2 | A2 |
| 3 | B1 |
| 4 | B2 |
| 5 | C1 |
| 6 | C2 |

**Overall score** = the **average** of the four section scores (not a sum), rounded to the nearest half-band (e.g., an average of 5.25 rounds to 5.5).

**Transition period (2026–2028):** score reports show *both* the new 1–6 band score *and* a legacy 0–120-equivalent number (the midpoint of the corresponding old-scale range), so universities that haven't updated their published requirements yet can still interpret the score. Scores are valid for 2 years from the test date; unofficial Reading/Listening scores are available immediately, official scores in ~3 days, PDF reports 1 day after that.

**For context — the pre-2026 scale** (still what most published university admission-requirement pages reference, since institutional policy pages lag the Jan-2026 change): 0–120 total, sum of four 0–30 section scores. Typical requirements: 61+ for community colleges, 80–100 for most mainstream university programs, 100–110+ for competitive/Ivy-League-tier programs. Many schools also set **section-level minimums**, not just a total-score floor — worth carrying over as a general truth into any 1–6-scale framing (e.g., a school might require an overall 4.0 *and* a Writing/Speaking minimum of 3.5).

**Practical implication for building practice content:** because scoring rubrics (Fluency, Intelligibility, Language Use, Organization/Relevancy for Speaking; a 0–5 rubric with AI+human raters for the two Writing free-response tasks) are ETS's own proprietary rating instruments, a practice tool should **not claim to produce a real TOEFL band score** — same rule you already apply to DET. Live teacher feedback in Zoom, not an automated score, is the safe and honest approach, exactly as done for DET's speaking practice.

---

## 5. What's Practice-able Without Infringement

This maps directly onto the reasoning already applied to DET Practice Mode.

### Safe to build (structural/format-based, no ETS content involved)
All of the following are **test *formats*, not copyrightable expression** — a format (e.g., "10 scrambled words → build a grammatical sentence," "hear 4 linked interview questions, answer each in ~45 seconds, no prep") is not itself protected; only ETS's *specific* passages, prompts, audio scripts, and images are. Original hand-authored content in the same shape is the same legal posture your DET mode already occupies:
- **Build a Sentence** → reuse the existing `Unjumble` template almost as-is.
- **Read in Daily Life** and **Read an Academic Passage** → original short passages + MC questions, same shape as `QuizActivity`/`ReadCompleteDrill`.
- **Complete the Words** → original short paragraphs with letter-level gaps, similar build to `FillBlankDrill` but gapping inside words.
- **Listen and Repeat** → original sentence sets read via TTS, same self-hosted-audio pattern as the Pronunciation feature.
- **Take an Interview** / **Write an Email** / **Write for an Academic Discussion** → original topical prompts, teacher-scored live (no auto-scoring claim), same pattern as DET's speaking practice (`SpeakingPromptDrill` family).
- **Listening task types** (announcements, conversations, academic talks) → original scripts + TTS audio, same production pipeline already proven out for Pronunciation and could extend to DET-style content.

### Risk areas — avoid
- **Do not reproduce or closely paraphrase actual ETS/TOEFL passages, prompts, or audio scripts.** ETS's official prep materials (*Official Guide to the TOEFL iBT Test*, TOEFL Practice Online, official sample questions on ets.org) are copyrighted; scraping or transcribing them into your JSON content would be infringement, same as scraping real DET questions would be.
- **"TOEFL" and "TOEFL iBT" are registered trademarks of ETS.** Per ETS's own published trademark-usage guidelines (ets.org/legal/trademarks.html):
  - Never use the marks as part of a product/company name, domain name, or app name (i.e., don't build something branded "TOEFL Practice Pro" or similar).
  - Never reproduce the ETS or TOEFL logos.
  - If referencing the name at all (e.g., "practice modeled on the TOEFL iBT test format"), it must be used descriptively/adjectivally, not as a standalone noun, must not be more visually prominent than your own branding, and must not imply endorsement or affiliation.
  - ETS explicitly states it "does not operate, license, endorse or recommend" third-party schools or study materials — meaning no marketing language implying official partnership, certification, or affiliation.
  - Given this is an internal teacher tool (not a commercially distributed product referencing TOEFL), the practical exposure is low, but the same posture your CLAUDE.md already states for DET ("NO official branding/logos... just practice drills modeled on the test's format") should carry over identically: call it something like "TOEFL-style Practice" or "Academic English Test Practice," never claim official affiliation, and keep ETS's name usage purely descriptive if used at all.
- **Do not build or market an auto-scoring engine that claims to predict a real TOEFL band score.** ETS's rating rubrics and AI-scoring models are proprietary; a practice tool can give structural feedback (word count, time, format-following) but the DET-style pattern of "no scoring claim, teacher gives live feedback" is the safe posture here too.

### Bottom line
The same architecture and legal posture that already worked for DET Practice Mode — local hand-authored JSON, original content in the test's *format*, no verbatim material, no branding implying affiliation, no fake scoring — transfers cleanly to TOEFL. If anything, TOEFL's new (Jan 2026) short-passage/short-task format (200-word academic passages, 70–100-word gapped paragraphs, single-scenario audio sets) is *more* practical to hand-author at volume than the old 700-word passages and multi-task integrated speaking format were, since each item is smaller and faster to write.

---

## 6. Sources

- [TOEFL iBT Test Content - A Breakdown of Test Sections](https://www.ets.org/toefl/test-takers/ibt/about/content.html) — official ETS test structure page (fetched directly)
- [TOEFL iBT Score Breakdown - What Your Scores Mean](https://www.ets.org/toefl/test-takers/ibt/scores/understand-scores.html) — official ETS scoring page (fetched directly)
- [Use of ETS Trademarks | Legal](https://www.ets.org/legal/trademarks.html) — official ETS trademark usage guidelines (fetched directly)
- [ETS Licensing Policies | Legal](https://www.ets.org/legal/permissions/licensing.html)
- [TOEFL iBT Enhancements Debuting July 2023](https://www.ets.org/news/press-releases/toefl-ibt-enhancements-debuting-july-2023.html) — official ETS press release on the 2023 shortening
- [The New TOEFL iBT 2026: All the Changes You Need to Know – Mentor Language Institute](https://mliesl.edu/contents/the-new-toefl-ibt-2026-all-the-changes-you-need-to-know/)
- [TOEFL Exam Pattern 2026: 4 Sections, About 90 Minutes, New Format](https://www.toeflmocktests.com/blog/toefl-exam-pattern-2026/)
- [TOEFL iBT 2026 Format | Complete Guide to Test Structure & Sections](https://toeflpractice.io/toefl-2026-format)
- [TOEFL 2026: Everything That Changed - New Format, New Scoring, New Tasks](https://www.esl-tests.com/blog/2026-02-19/toefl-ibt-2026-changes-new-format-scoring-tasks-explained)
- [New TOEFL iBT Reading Question Types for 2026 Explained](https://study.com/toefl/reading/what-are-the-new-toefl-2026-reading-question-types.html)
- [TOEFL 2026 Reading - Complete the Words, Read in Daily Life, and Academic Passage](https://college-council.com/en/blog/toefl-2026-reading-new-tasks-strategies)
- [TOEFL Reading Question Types 2026: Complete Guide with Examples](https://www.toeflmocktests.com/blog/toefl-reading-question-types-2026/)
- [TOEFL® Listening Section | Format, Questions & Strategies](https://study.com/toefl/listening.html)
- [The 7 TOEFL Listening Question Types (with sample questions)](https://magoosh.com/toefl/toefl-listening-question-types/)
- [TOEFL Writing Tasks: Format, Timing & Scoring (2026 Guide)](https://study.com/toefl/writing/what-are-the-3-new-toefl-2026-writing-tasks-including-the-email-task.html)
- [TOEFL Write an Email: A Complete Guide (2026)](https://magoosh.com/toefl/toefl-write-an-email/)
- [The Enhanced TOEFL Speaking Section (2026): Every Change, Explained | My Speaking Score Blog](https://www.myspeakingscore.com/blog/enhanced-toefl-speaking)
- [TOEFL Speaking 2026: New Format, Tasks & Free Practice Test](https://www.myspeakingscore.com/toefl-speaking-2026)
- ["Interview" Task in TOEFL Speaking 2026: What It Is and How It's Scored](https://www.myspeakingscore.com/blog/the-new-interview-task-in-the-enhanced-toefl-speaking-section-what-it-is-and-how-its-scored)
- [How TOEFL Listen and Repeat Is Scored (and How to Train)](https://www.fluentprep.online/blog/master-toefl-listen-and-repeat)
- [Good TOEFL Score: 2026 Guide to New & Old Scales](https://magoosh.com/toefl/what-is-a-good-toefl-score/)
- [TOEFL iBT Score Requirements for Top 50 US Universities (2026)](https://www.preparebuddy.com/blog/toefl-score-requirements-top-us-universities/)
- [TOEFL vs. IELTS Comparison: Which is better for you?](https://www.nomadcredit.com/blog/toefl-vs-ielts-which-is-better-for-you)
- [IELTS vs TOEFL: Choose Your Test | British Council](https://takeielts.britishcouncil.org/blog/toefl-or-ielts)
- [Revised TOEFL iBT Format Commencing July 26th, 2023 | Edwise](https://www.edwiseinternational.com/blogs/revised-toefl-ibt-format-commencing.html)

**Caveat on source quality:** Most non-ETS sources above are TOEFL prep/test-prep-industry blogs (Magoosh, TOEFLMock, My Speaking Score, study.com, etc.) rather than primary ETS documentation, because ETS's own public site describes the current format only at a summary level (the `content.html` page fetched directly above) and does not publish a full public "test blueprint" PDF the way it does for some other exams. These third-party sources were cross-checked against each other and against the one official ETS structural page for consistency, and where they agreed independently (e.g., item counts, task names verbatim like "Build a Sentence" and "Listen and Repeat") that was treated as reliable corroboration. Given how recent the January 2026 change is, it would be worth spot-checking ETS's official `ets.org/toefl` pages again before building content at scale, in case ETS publishes more detailed official guidance.
