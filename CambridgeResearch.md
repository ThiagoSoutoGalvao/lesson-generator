# Cambridge English Qualifications — Research Report

Prepared for: Lesson Generator (solo developer/teacher, 1-on-1 online English teaching app)
Purpose: evaluate Cambridge English Qualifications (B2 First / C1 Advanced primarily) as a candidate for a "Cambridge Practice Mode," using the same architecture and legal/ethical lens as the existing DET Practice Mode — local hand-authored JSON content, teacher-run live in Zoom, no verbatim official test content, no official branding, no scoring engine claiming to predict a real result.

---

## 1. Overview

**Cambridge English Qualifications** are a suite of English-language proficiency exams administered by **Cambridge Assessment English**, part of **Cambridge University Press & Assessment** (a department of the University of Cambridge, UK). They are used to prove English ability for study, work, and immigration purposes and are recognized by thousands of universities, employers, and government agencies worldwide.

### Key structural difference from IELTS / TOEFL

- **Cambridge English Qualifications are fixed-level, pass/fail qualifications tied to specific CEFR levels.** A candidate registers for an exam targeting a specific level (e.g. B2 First targets B2), and the result is a **certificate that is valid for life** — there is no "expiry."
- **IELTS and TOEFL are level-agnostic, numeric-score tests.** A candidate takes the same test regardless of level, receives a score on a continuous scale (IELTS: 0–9 bands; TOEFL iBT: 0–120 points), and that score is generally only considered valid for about **2 years** by receiving institutions.
- This means Cambridge exams also have a built-in "grading buffer": most Cambridge exams report a result at the level above or below the target level if the candidate's performance falls just outside the main target band (see Section 4).

### The five main Cambridge English Qualifications and their CEFR levels

| Exam | Common abbreviation | CEFR level targeted | Notes |
|---|---|---|---|
| **A2 Key** | KET | A2 | Entry-level qualification; ~110 minutes total; simplest of the five |
| **B1 Preliminary** | PET | B1 | Intermediate; for students moving from basic to independent use of English |
| **B2 First** | FCE | B2 | Most widely taken Cambridge exam; proves ability to work/study independently in English |
| **C1 Advanced** | CAE | C1 | High-level qualification; accepted by 9,000+ institutions for university-level study/work |
| **C2 Proficiency** | CPE | C2 | Highest Cambridge English qualification; near-native academic/professional fluency |

This report focuses primary detail on **B2 First** and **C1 Advanced**, since those best match a typical adult 1-on-1 online student (the same population this app already serves via the DET Practice Mode), and gives lighter coverage to A2 Key, B1 Preliminary, and C2 Proficiency.

---

## 2. Test Structure — B2 First and C1 Advanced

Both exams have the same **four papers**: Reading and Use of English (combined into one paper), Writing, Listening, and Speaking. Reading/Use of English, Writing, and Listening are typically taken together in one sitting; Speaking is often scheduled as a separate session (done face-to-face, in pairs, with two examiners — see Section 3).

### B2 First (FCE) — total ~3 hours 30 minutes (written papers) + 14 minutes per pair (Speaking)

| Paper | Duration | Parts | Questions | Weight |
|---|---|---|---|---|
| Reading and Use of English | 1 hr 15 min | 7 | 52 | 25% (of 4 equally-weighted skills) |
| Writing | 1 hr 20 min | 2 | 2 pieces, 140–190 words each | 25% |
| Listening | ~40 min | 4 | 30 | 25% |
| Speaking | 14 min per pair | 4 | — | 25% |

### C1 Advanced (CAE) — total ~4 hours (written papers) + 15 minutes per pair (Speaking)

| Paper | Duration | Parts | Questions | Weight |
|---|---|---|---|---|
| Reading and Use of English | 1 hr 30 min | 8 | 56 | 20% |
| Writing | 1 hr 30 min | 2 | 2 pieces, 220–260 words each | 20% |
| Listening | ~40 min | 4 | 30 | 20% |
| Speaking | 15 min per pair | 4 | — | 20% |

### How the two exams differ structurally

- **Reading and Use of English:** C1 Advanced has **8 parts** vs. B2 First's **7** — C1 Advanced adds a "cross-text multiple matching" part (comparing short extracts from four texts on a theme) not present at B2, and splits the matching/gapped-text work across two separate parts (gapped text + multiple matching) rather than B2's single combined structure.
- **Writing:** Both have a compulsory Part 1 essay + a choice of one Part 2 task, but word counts scale up (140–190 at B2 vs. 220–260 at C1) and the C1 Part 1 essay requires synthesizing and evaluating two given viewpoints from a short input text, a heavier analytical/argumentative load than B2's opinion essay. Task choices also differ slightly (B2 offers article/email/review/story/report as Part 2 options; C1 offers letter/email/proposal/report/review — no story option at C1).
- **Listening:** Same 4-part shape at both levels (short extracts → monologue → matching → longer interview/conversation), but C1's texts are longer, denser, and use more idiomatic/abstract language; question counts and exact part order also shift slightly (see Section 3 for the specific sub-parts).
- **Speaking:** Same 4-part shape at both levels, but B2's individual long turn (Part 2) uses a **pair of photographs** compared side by side, while C1's individual long turn uses **three photographs**, of which the candidate picks two to compare — a step up in complexity, not a different task type.
- **Overall difficulty progression** is via longer/denser texts, more abstract topics, wider vocabulary range, and heavier analytical writing demands — the underlying task *types* (cloze, transformation, matching, essay-plus-choice, sentence completion, paired discussion, etc.) are largely shared or directly analogous between the two levels.

---

## 3. Question Types in Detail

### 3.1 Reading and Use of English

| Part | B2 First | C1 Advanced | Task description |
|---|---|---|---|
| 1 | Multiple-choice cloze (8 Qs) | Multiple-choice cloze (8 Qs) | Gapped text; choose the correct word/phrase (A/B/C/D) for each gap — tests vocabulary, collocation, phrasal verbs |
| 2 | Open cloze (8 Qs) | Open cloze (8 Qs) | Gapped text; candidate supplies the missing word from memory (no options) — tests grammar (articles, prepositions, linkers, auxiliaries) |
| 3 | Word formation (8 Qs) | Word formation (8 Qs) | A root word is given in capitals beside each gap; candidate must transform it (e.g. noun → adjective, add a prefix/suffix) to fit the sentence |
| 4 | Key word transformation (6 Qs) | Key word transformation (6 Qs) | Rewrite a sentence using a given "key word," keeping the meaning the same, within a fixed number of words |
| 5 | Multiple choice reading (6 Qs) | Multiple choice reading (6 Qs) | Read a text (usually a story or article); answer detail/inference/attitude/opinion questions with 4 options each |
| 6 | Gapped text (6 Qs) | Cross-text multiple matching (4 Qs) — **C1 only, no B2 equivalent** | C1 Part 6: four short texts on a related theme; answer questions that require comparing opinions/information across the texts |
| 7 | Multiple matching (10 Qs) | Gapped text (6 Qs) | B2 Part 6 / C1 Part 7: sentences/paragraphs have been removed from a text and placed in jumbled order below; candidate places each back in the correct gap |
| — | — | Multiple matching (10 Qs) | C1 Part 8 (≈ B2 Part 7): a text is divided into sections, or several short texts are given; candidate matches statements/questions to the section/text they relate to |

**This is directly relevant to Lesson Generator's existing templates:**
- **Key word transformation** is functionally identical in format to the app's existing **Sentence Transformation** activity template (original sentence + key word + stem → reveal transformed answer).
- **Word formation** is functionally identical in format to the app's existing **Word Formation** activity template (root word displayed large, gapped sentence revealed).
- Multiple-choice cloze, open cloze, multiple matching, and gapped text could map onto variations of the existing **Cloze**, **Quiz** (multiple choice), and **Matching Pairs** templates with minimal new component work — mostly a content/prompt-shape exercise rather than new UI.

### 3.2 Writing

| Part | B2 First | C1 Advanced |
|---|---|---|
| 1 (compulsory) | Essay: give an opinion on a given question, with supporting reasons, using two given "content points" as prompts (140–190 words) | Essay: read two short opposing viewpoints on a topic (given as input text), then write a discursive essay evaluating both and giving a personal opinion (220–260 words) |
| 2 (choice of one) | Article, email/letter, review, story, or report (140–190 words) | Letter/email, proposal, report, or review (220–260 words) |

Not naturally a "drill" format the way the other papers are — this is closer to what a teacher already does live via feedback/correction. Could still support a practice mode as writing-prompt banks (topic + genre + word count target), but there's no obvious auto-checkable interaction the way cloze/matching/multiple-choice have.

### 3.3 Listening

| Part | B2 First | C1 Advanced |
|---|---|---|
| 1 | 8 short unrelated extracts (~30 sec each, various speakers/contexts); one multiple-choice question per extract | 3 short conversations; 2 multiple-choice questions per conversation (6 total) |
| 2 | One long monologue (3–4 min); sentence completion, 10 gaps to fill with words heard | One 3-minute monologue; sentence completion, 8 gaps |
| 3 | 5 short related monologues on a theme (~30 sec each); multiple matching — match each speaker to one of 8 options | One 4-minute conversation between two+ speakers; 6 multiple-choice questions |
| 4 | One longer interview or conversation (3–4 min); 7 multiple-choice questions | 5 short monologues (~30 sec each) on a theme; two separate multiple-matching tasks against 5 speakers each (10 questions total) |

Question types across both levels: **multiple choice**, **sentence completion** (gap-fill from what's heard), and **multiple matching** (speaker-to-statement). All three are naturally drillable with self-hosted audio, mirroring exactly how the Pronunciation feature already handles local audio playback — the DET Practice Mode's `-ed` endings / minimal pairs drill loop pattern (`DrillLoop.jsx`) is architecturally close to what a Listening multiple-choice or matching drill would need.

### 3.4 Speaking

Both levels use the same 4-part shape. **Distinctive vs. IELTS/TOEFL: Cambridge Speaking is done in pairs** — two candidates, two examiners (one asks questions/interlocutor, one only assesses) — simulating real conversational interaction, not a one-on-one interview (IELTS) or a solo computer-recorded response (TOEFL iBT).

| Part | B2 First | C1 Advanced | Task type |
|---|---|---|---|
| 1 | ~2 min | 2 min | Interview: examiner asks each candidate personal-information/opinion questions individually |
| 2 | 1 min speak + 30 sec partner response | 1 min speak + 1 min partner response | Individual long turn: candidate compares two (B2) or two-of-three (C1) photographs and answers a related question; the other candidate briefly responds |
| 3 | 2 min discussion + 1 min decision | 2 min discussion + 1 min decision | Collaborative task: candidates are given prompt material (words/pictures) and must discuss then reach a joint decision |
| 4 | ~4 min | ~5 min | Discussion: examiner leads a broader discussion with both candidates on themes raised in Part 3 |

For a 1-on-1 teacher-led context (this app's whole use case), the "pair" element is naturally replaced by teacher-as-partner — same as how DET's Interactive Speaking already handles a single-student scenario chain without a second candidate. This maps well onto the existing Part B speaking architecture (`SpeakingPromptDrill.jsx`) already built for DET: prep/prompt reveal, no timer, teacher runs it live.

---

## 4. Scoring — The Cambridge English Scale

Since January 2015, all major Cambridge English Qualifications report results on the **Cambridge English Scale**, a common numeric scale (roughly 80–230 depending on exam) that spans across all the exams, allowing scores to be compared across levels.

- Each exam has its own scale range tied to its target CEFR level, with **three pass grades — A, B, C** — plus the possibility of a result at the **level below** (a near-miss that still certifies a lower CEFR level) or, for some exams, the **level above** (an exceptionally strong performance that certifies the next CEFR level up).
- **B2 First** scale: roughly 140–190.
  - Grade A (~180–190) → certifies **C1**
  - Grades B/C (~160–179) → certifies **B2**
  - 140–159 → **Level B1** (a "fail" for B2 First's target grade, but still a certified B1 result rather than a flat fail)
- **C1 Advanced** scale: roughly 160–210.
  - Grade A (~200–210) → certifies **C2**
  - Grades B/C (~180–199) → certifies **C1**
  - 160–179 → **Level B2** (below-target result, still certified)
- The overall score is an **average across the four skills** (Reading, Writing, Listening, Speaking) plus Use of English where it's assessed as part of Reading — a candidate does not need to pass every paper individually, weak performance in one paper can be offset by strength in others.
- Because grade bands overlap between adjacent exams (e.g. B2 First's Grade A band overlaps with C1 Advanced's Grade C band, both landing in "C1"), Cambridge explicitly designed the scale so exams at different levels are directly comparable — a genuinely different scoring philosophy from IELTS's flat band descriptors or TOEFL's raw point totals.
- Certificates **never expire** ("valid for life") — a deliberate contrast Cambridge itself markets against IELTS/TOEFL's ~2-year validity window.

**Implication for a practice-mode scoring approach (matching what DET Practice Mode already does):** just as DET Practice Mode deliberately has "no scoring engine that claims to predict a real score," any Cambridge practice content should show raw practice results (e.g. "7/10 correct on this Reading Part 1 set") rather than attempting to project a Cambridge English Scale score or a pass/fail grade — projecting an official-sounding numeric result would edge toward implying the tool has real predictive/diagnostic authority it doesn't have, and Cambridge's own scale methodology is a statistically calibrated, proprietary scoring model this app has no access to or license to replicate.

---

## 5. What's Practice-able Without Infringement

### Safe: format/structure is not copyrightable

Question-type *formats* — multiple-choice cloze, open cloze, word formation, key-word transformation, gapped text, multiple matching, sentence completion, paired discussion prompts, etc. — are **task structures**, not copyrightable expression. Building **original, hand-authored content** in these formats (new sentences, new passages, new prompts, written from scratch) is the same legally clean approach the DET Practice Mode already takes, and Cambridge's own official prep-book publishers (Cambridge University Press itself, plus many third-party ELT publishers) build entire commercial businesses on exactly this: original practice material modeled on the official format.

**Directly relevant overlap with existing templates — call this out explicitly:**
- **Key word transformation** (B2/C1 Reading and Use of English Part 4) is the same format as Lesson Generator's existing **Sentence Transformation** template. No new component needed — just Cambridge-flavored content (register, topic range, the specific transformation patterns Cambridge tests: passive voice, reported speech, comparatives, conditionals, etc.).
- **Word formation** (Part 3 of both exams) is the same format as Lesson Generator's existing **Word Formation** template. Same conclusion — content work, not build work.
- Multiple-choice cloze, open cloze, and gapped text map reasonably well onto the existing **Cloze** template with adjustments; multiple matching maps onto **Matching Pairs**; Listening multiple-choice and Reading multiple-choice both map onto the existing **Quiz** template.
- Genuinely new component work would mainly be needed for: cross-text multiple matching (a 4-text comparison layout not currently in the app), the Speaking collaborative/discussion tasks (closest existing analog is DET's Interactive Speaking chain), and Listening sentence-completion (needs a fill-in-the-gap-while-listening interaction, not currently built, though architecturally close to Fill in the Blanks from DET Part A).

### Risk areas — must avoid

1. **Verbatim past-paper content.** Cambridge explicitly states exam materials are copyrighted, must be treated as confidential, and **must not be reproduced in whole or in part — including posting on websites — without written permission**; they do not grant permission for electronic publication of past-paper questions, mark schemes, or examiner reports, and pursue copyright infringement through an Anti-Piracy Brand Protection team. This means: never transcribe, paraphrase-too-closely, or otherwise lift actual passages/questions from real B2 First/C1 Advanced past papers or official practice books into the app's JSON content — same rule already followed for DET.
2. **Trademarked names/branding.** "Cambridge English," "B2 First," "FCE," "C1 Advanced," "CAE," "C2 Proficiency," "CPE," and the Cambridge crest/logo are trademarks of Cambridge Assessment/the University of Cambridge, which actively protects and licenses its marks (explicit permission-request process for any third-party logo use, an "Anti-Piracy Brand Protection" enforcement function, and a public contact — brand@admin.cam.ac.uk — for reporting unauthorized use). The app's UI copy must avoid anything that could imply official affiliation, endorsement, or accreditation — e.g. describing the feature internally/publicly as **"Cambridge-style" or "exam-format practice"** rather than badging it as "Official FCE Prep" or reusing Cambridge's crest/visual identity. This mirrors exactly how DET Practice Mode already avoids Duolingo's official branding/verbatim content.
3. **No official-sounding score prediction.** As in Section 4 — don't present a computed "Cambridge English Scale score" or a pass/fail grade from practice-drill results; Cambridge's scale is a proprietary, statistically-calibrated model this app cannot legitimately reproduce, and presenting a fake one risks misleading the student about their real readiness (the same reasoning DET Practice Mode already applies with "no scoring engine that claims to predict a real score").

### Net assessment

Cambridge English Qualifications are at least as practice-able as the DET was, using the identical model: **local, hand-authored JSON content mimicking official *format*, run live by the teacher, explicitly branded as unofficial practice, no verbatim content, no fake official score.** Two of the format types (Sentence Transformation, Word Formation) require essentially zero new UI work since matching templates already exist — this is a meaningfully lower build cost than DET Practice Mode had at its Phase 1 starting point.

---

## 6. Sources

- [B2 First exam format — Cambridge English (official)](https://www.cambridgeenglish.org/exams-and-tests/qualifications/first/format/)
- [C1 Advanced exam format — Cambridge English (official)](https://www.cambridgeenglish.org/exams-and-tests/qualifications/advanced/format/)
- [Comparing Cambridge English Qualifications to other exams — Cambridge English Support Site](https://support.cambridgeenglish.org/hc/en-gb/articles/202838386-Comparing-Cambridge-English-Qualifications-to-other-exams)
- [Comparing scores to IELTS — B2 First and C1 Advanced (PDF, official)](https://www.cambridgeenglish.org/images/461626-cambridge-english-qualifications-comparing-scores-to-ielts.pdf)
- [Converting practice test scores to Cambridge English Scale scores (PDF, official)](https://www.cambridgeenglish.org/Images/210434-converting-practice-test-scores-to-cambridge-english-scale-scores.pdf)
- [The methodology behind the Cambridge English Scale (PDF, official)](https://www.cambridgeenglish.org/images/177867-the-methodology-behind-the-cambridge-english-scale.pdf)
- [Cambridge English Scale — Wikipedia](https://en.wikipedia.org/wiki/Cambridge_English_Scale)
- [B2 First — Wikipedia](https://en.wikipedia.org/wiki/B2_First)
- [C1 Advanced — Wikipedia](https://en.wikipedia.org/wiki/C1_Advanced)
- [B2 First (FCE) — EF Guide to English Exams](https://www.ef.edu/english-tests/cambridge-exams/fce/)
- [C1 Advanced (CAE) — EF Guide to English Exams](https://www.ef.edu/english-tests/cambridge-exams/cae/)
- [Cambridge exams explained — EF](https://www.ef.edu/english-tests/cambridge-exams/)
- [A2 Key (KET) — EF Guide to English Exams](https://www.ef.edu/english-tests/cambridge-exams/ket/)
- [General English exams: CAE, CPE, FCE, KET, PET — British Council](https://www.britishcouncil.org.lb/en/exam/cambridge/which/general-english)
- [Cambridge English: B2 First (FCE) Reading & Use of English — examenglish.com](https://www.examenglish.com/FCE/fce_reading.html)
- [C1 Advanced (CAE) — What is the exam structure? — Global Exam](https://global-exam.com/blog/en/c1-advanced-cae-what-is-the-exam-structure/)
- [Cambridge C1 Advanced Speaking section: structure and training — Global Exam](https://global-exam.com/blog/en/cambridge-c1-advanced-speaking-section/)
- [Legal — Copyright | Cambridge University Press & Assessment (official)](https://www.cambridge.org/legal/copyright)
- [Can I reproduce Cambridge past examination papers on the school's website/my website? — Cambridge Help](https://help.cambridgeinternational.org/hc/en-gb/articles/203544371-Can-I-reproduce-Cambridge-past-examination-papers-on-the-school-s-website-my-website)
- [How do I apply for permission to use Cambridge copyrighted material? — Cambridge Help](https://help.cambridgeinternational.org/hc/en-gb/articles/115004418469-How-do-I-apply-for-permission-to-use-Cambridge-copyrighted-material)
- [Protecting the Cambridge brand — University of Cambridge](https://www.cam.ac.uk/brand-resources/trademark-and-licensing)
- [The trade marks — University of Cambridge](https://www.cam.ac.uk/brand-resources/trademark-and-licensing/the-trade-marks)
- [Who can use the University logo — University of Cambridge](https://www.cam.ac.uk/brand-resources/guidelines/using-the-logo)
- [IELTS vs TOEFL vs Cambridge: Which Exam Is Right for You? — Direct English Live](https://www.directenglishlive.com/blogs/english-exams/ielts-vs-toefl)
- [How Are The IELTS, PTE, Cambridge and TOEFL Tests Different? — Mezzoguild](https://mezzoguild.com/english-tests)
