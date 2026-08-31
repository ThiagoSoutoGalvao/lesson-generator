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
├── _lesson-brief-template.md      ← copy this for each new lesson
├── lights/
│   ├── Lights - table of contents.pdf
│   ├── lesson-01/ brief.md
│   ├── lesson-02/ brief.md
│   └── …
├── glow/
│   └── …
└── radiant/
    └── …
```

- Folders lowercase. Lessons zero-padded: `lesson-01`, never `Lesson 1`.
- Files starting with `_` are not lessons (template, notes).
- Coursebook page exports / images for a lesson go in that lesson's folder.

**Before building activities for a lesson**, its owner writes `brief.md` by
copying `_lesson-brief-template.md` and expanding the one-line entry from the
table of contents into target language, vocabulary and the activity checklist.

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

28 teaching lessons. Starting split — adjust to match who teaches which level.

| Teacher   | Owns                     | Lessons                          |
|-----------|--------------------------|----------------------------------|
| Fernando  | LIGHTS                   | 1 – 6                            |
| Sapulha   | LIGHTS · GLOW            | Lights 7–8 · Glow 1–4            |
| Daniel    | GLOW · RADIANT           | Glow 5–8 · Radiant 1–2           |
| Hianna    | RADIANT                  | 3 – 8                            |
| Sérgio    | RADIANT                  | 9 – 12 · + consistency review    |

---

## 6. Status board

`todo` → `brief` (brief written) → `building` → `done` (all 5 activities saved)

### Lights
| # | Topic (from ToC)                                                          | Owner    | Status |
|---|-------------------------------------------------------------------------|----------|--------|
| 1 | to be / there be (past); adjectives for places; dates & years; in/on   | Fernando | todo   |
| 2 | past continuous; past time expressions; adverbs of manner              | Fernando | todo   |
| 3 | present continuous vs base-form everyday verbs; clothes & accessories  | Fernando | todo   |
| 4 | routine verbs; days; time; food & drink; simple present (no 3rd p.); frequency | Fernando | todo |
| 5 | simple present 3rd person; object pronouns; personality adjectives     | Fernando | todo   |
| 6 | can (all forms); verb vocabulary; adverbs of manner; rules & regulations | Fernando | todo |
| 7 | there be (all forms); parts of a house; places in a city + prepositions | Sapulha | todo  |
| 8 | future time expressions; free-time activities; be going to; will        | Sapulha | todo  |

> Note: the Lights ToC lists 8 content lessons + lesson 9 (assessment / project). The rows
> above condense it to the 8 buildable lessons.

### Glow
| # | Topic (from ToC)                                                          | Owner    | Status |
|---|-------------------------------------------------------------------------|----------|--------|
| 1 | to be / there be (past); adjectives for places & events; dates & years; in/on | Sapulha | todo |
| 2 | past continuous; past time expressions; adverbs of manner              | Sapulha  | todo   |
| 3 | simple past: regular & irregular                                       | Sapulha  | todo   |
| 4 | simple past: negatives & questions; sequencers & connectors; prepositions of movement | Sapulha | todo |
| 5 | seasons & weather; animals; comparative sentences                      | Daniel   | todo   |
| 6 | superlative adjectives; kitchen vocabulary                             | Daniel   | todo   |
| 7 | modals of obligation / permission: can, have to, must, should; parts of the body | Daniel | todo |
| 8 | passive voice: present & past (work on participles)                    | Daniel   | todo   |

### Radiant
| #  | Topic (from ToC)                                                         | Owner  | Status |
|----|-----------------------------------------------------------------------|--------|--------|
| 1  | present perfect (ever / never)                                        | Daniel | todo   |
| 2  | present perfect (for / since) + yet / just / already; contrast with past | Daniel | todo |
| 3  | uses of -ing: gerund, present participle, verb patterns               | Hianna | todo   |
| 4  | conditionals: zero, first, second                                     | Hianna | todo   |
| 5  | word building: prefixes, suffixes, compound words                     | Hianna | todo   |
| 6  | narrative tenses + adverbs of manner                                  | Hianna | todo   |
| 7  | collocations: commonly confused verbs; verb + preposition             | Hianna | todo   |
| 8  | reported speech                                                       | Hianna | todo   |
| 9  | indefinite pronouns (something, everywhere…) + one more topic         | Sérgio | todo   |
| 10 | phrasal verbs (separable & non-separable)                             | Sérgio | todo   |
| 11 | minimal pairs (phonetics & spelling)                                  | Sérgio | todo   |
| 12 | project management: analyse material, gather info, deliver a presentation | Sérgio | todo |
