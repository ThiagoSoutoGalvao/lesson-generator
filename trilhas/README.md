# Aurora Trilhas — Build Guide

How the five Aurora teachers assemble **Lights**, **Glow** and **Radiant** into one
company activity library inside Lesson Generator. This file is the source of truth
for conventions, ownership and progress.

---

## 1. Where you work

- Log in with the shared **Aurora account** (`aurora@…` — password in the team
  password manager). Everything saved under it is visible to all five of us.
- Your personal beta login is still yours, for your own students. The Aurora
  login is **only** for trilha content.
- All five of us can be logged in at the same time.

---

## 2. The `trilhas/` folder

```
trilhas/
├── README.md                     ← this file
├── lights/Lights - table of contents.pdf
├── glow/Glow - table of contents.pdf
└── radiant/Radiant - table of contents.pdf
```

Just the three table-of-contents PDFs now — that's the raw source material.
Everything else (the lesson-by-lesson plan and progress tracking) lives in the
app, not in files. See §6 below.

---

## 2b. Planning a lesson — do it in the app

Each lesson's brief (target language, vocabulary, level notes, source) is
filled in **inside the app**, not as a separate file:

1. Log in with the Aurora account, go to **Library**.
2. Click the **Trilha** filter (Lights / Glow / Radiant) — a coverage grid
   appears: lessons × the 5 baseline activity types, with a ✓ for each one
   already saved.
3. Click the **📝** button on a lesson's row to expand its brief — write it
   before you build, or fill it in as you go, whichever fits how you work.
   It saves per lesson and everyone sees the same thing.
4. The ✓ checkmarks are the "is this lesson done" checklist — once all 5
   columns are ✓ for a lesson, it's done. No separate status field to update.

We tried a git/Drive-file version of this first (a `brief.md` per lesson,
cutting coursebook PDFs into per-lesson folders) — it didn't stick, mainly
because cutting PDFs into folders was slow and the files lived somewhere
separate from where the activities actually get built. The in-app version
replaces that entirely.

---

## 3. Naming activities in the app

You never type the full name — pick the structured fields in the save panel and
the app composes it to this exact shape:

```
TRILHA L## · Type · Focus
```

| Field   | Rule                                                                    | Example                              |
|---------|------------------------------------------------------------------------|--------------------------------------|
| TRILHA  | Uppercase, one of `LIGHTS` `GLOW` `RADIANT`                            | `LIGHTS`                             |
| L##     | Zero-padded lesson number                                              | `L03`                                |
| Type    | The activity type, as the app labels it                                | `Quiz`                               |
| Focus   | Sentence case, ≤ 6 words, the specific language point. Don't repeat the trilha, lesson or type. | `Present continuous & everyday verbs` |

Examples:

```
LIGHTS  L03 · Quiz         · Present continuous & everyday verbs
LIGHTS  L07 · Flashcards   · Parts of a house
GLOW    L05 · True / False · Comparatives — animals & weather
GLOW    L08 · Cloze        · Passive voice in the present
RADIANT L08 · Transform    · Reported speech: statements
RADIANT L11 · Odd One Out  · Minimal pairs — /ɪ/ vs /iː/
```

- Separator is always ` · ` (space, middle dot, space).
- Not allowed in Focus: student names, dates, `final`, `v2`, `copy`, `NEW`.
- Always set **Built by** to your own name.

---

## 4. When a lesson is "done"

Every lesson gets the same five activities as a baseline (add more if it needs
them). Same backbone every lesson = a methodology, not a pile of activities.

1. **Presentation** — the grammar / topic taught (topic prompt, no PDF needed)
2. **Reading Text** — a passage recycling the lesson's language + vocabulary
3. **Vocabulary** — Flashcards or Image Match
4. **Grammar practice** — Quiz, or Transform / Error Correction / Cloze
5. **Speaking** — Discussion Questions

---

## 5. Ownership

28 teaching lessons. **This split is being reworked — treat it as provisional.**
Radiant 9–12 are currently unassigned (previously Sérgio, who isn't on the team).

| Teacher   | Owns                     | Lessons                          |
|-----------|--------------------------|----------------------------------|
| Fernando  | LIGHTS                   | 1 – 6                            |
| Sapulha   | LIGHTS · GLOW            | Lights 7–8 · Glow 1–4            |
| Daniel    | GLOW · RADIANT           | Glow 5–8 · Radiant 1–2           |
| Hianna    | RADIANT                  | 3 – 8                            |
| TBD       | RADIANT                  | 9 – 12                           |

---

## 6. Status board

Live build progress (which activities are saved) is the **Library coverage
grid in the app** — see §2b. This table is just the static reference: each
lesson's ToC topic and current owner.

### Lights
| # | Topic (from ToC)                                                          | Owner    |
|---|-------------------------------------------------------------------------|----------|
| 1 | to be / there be (past); adjectives for places; dates & years; in/on   | Fernando |
| 2 | past continuous; past time expressions; adverbs of manner              | Fernando |
| 3 | present continuous vs base-form everyday verbs; clothes & accessories  | Fernando |
| 4 | routine verbs; days; time; food & drink; simple present (no 3rd p.); frequency | Fernando |
| 5 | simple present 3rd person; object pronouns; personality adjectives     | Fernando |
| 6 | can (all forms); verb vocabulary; adverbs of manner; rules & regulations | Fernando |
| 7 | there be (all forms); parts of a house; places in a city + prepositions | Sapulha |
| 8 | future time expressions; free-time activities; be going to; will        | Sapulha |

> Note: the Lights ToC lists 8 content lessons + lesson 9 (assessment / project). The rows
> above condense it to the 8 buildable lessons.

### Glow
| # | Topic (from ToC)                                                          | Owner    |
|---|-------------------------------------------------------------------------|----------|
| 1 | to be / there be (past); adjectives for places & events; dates & years; in/on | Sapulha |
| 2 | past continuous; past time expressions; adverbs of manner              | Sapulha  |
| 3 | simple past: regular & irregular                                       | Sapulha  |
| 4 | simple past: negatives & questions; sequencers & connectors; prepositions of movement | Sapulha |
| 5 | seasons & weather; animals; comparative sentences                      | Daniel   |
| 6 | superlative adjectives; kitchen vocabulary                             | Daniel   |
| 7 | modals of obligation / permission: can, have to, must, should; parts of the body | Daniel |
| 8 | passive voice: present & past (work on participles)                    | Daniel   |

### Radiant
| #  | Topic (from ToC)                                                         | Owner  |
|----|-----------------------------------------------------------------------|--------|
| 1  | present perfect (ever / never)                                        | Daniel |
| 2  | present perfect (for / since) + yet / just / already; contrast with past | Daniel |
| 3  | uses of -ing: gerund, present participle, verb patterns               | Hianna |
| 4  | conditionals: zero, first, second                                     | Hianna |
| 5  | word building: prefixes, suffixes, compound words                     | Hianna |
| 6  | narrative tenses + adverbs of manner                                  | Hianna |
| 7  | collocations: commonly confused verbs; verb + preposition             | Hianna |
| 8  | reported speech                                                       | Hianna |
| 9  | indefinite pronouns (something, everywhere…) + one more topic         | TBD    |
| 10 | phrasal verbs (separable & non-separable)                             | TBD    |
| 11 | minimal pairs (phonetics & spelling)                                  | TBD    |
| 12 | project management: analyse material, gather info, deliver a presentation | TBD |
