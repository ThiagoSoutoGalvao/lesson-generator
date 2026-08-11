# Lesson Generator — Pronunciation Feature
## Context File & Implementation Roadmap

---

## 1. What This Document Is

This is the context file for adding a Pronunciation Feature to the existing
Lesson Generator app. Read this fully before touching any code. Every
decision recorded here was made deliberately — do not introduce new patterns,
rename things, or restructure phases without flagging it explicitly first.

Workflow for every phase: **build → test manually → commit → next phase.**
Never bundle multiple phases into one push. Always stop at the checkpoint
described at the end of each phase and wait for confirmation before continuing.

---

## 2. What Lesson Generator Already Is

Lesson Generator is a Laravel + React (Inertia.js) web app for a solo English
teacher who teaches one-on-one lessons online via Zoom. The teacher uploads a
PDF of their course book, prompts a Claude AI agent to generate interactive
classroom activities, and displays them fullscreen during Zoom sessions.

Existing activity types (already built):
- Multiple choice quiz
- Flashcards
- Unjumble exercise

Existing infrastructure already in place:
- `documents` table: stores extracted text from PDFs, has a `source_type` field
- Claude API integration: reads document text, generates activity JSON
- Fullscreen presentation mode: already works for existing activities
- Saved activity library: teacher can save and reuse generated activities
- Unsplash API: thematic background images for activities
- Upload page: where the teacher triggers activity generation — this is where
  the new Pronunciation buttons will live

Stack: Laravel, React, Inertia.js, Tailwind CSS, Windows/Herd local dev,
GitHub, Railway deployment.

---

## 3. What We Are Adding

A self-contained **Pronunciation Feature** that lives inside Lesson Generator
as a new section of the upload page and a new set of routes/pages. It does
NOT depend on PDF uploads or the Claude API — it is a standalone teaching
tool driven by pre-built datasets and self-hosted audio files.

The feature has two parts:

### Part A — Interactive Phonemic Chart Page
A dedicated page showing the full 44-sound British English phonemic chart
(Adrian Underhill layout, Received Pronunciation). The teacher can open this
at any time during a lesson and tap any symbol to hear the sound played.
Fullscreen mode available for Zoom sharing.

This is the standard chart teachers already know from classroom posters.
Layout must match the familiar Underhill groupings exactly:
- Monophthongs (pure vowels) — 12 sounds
- Diphthongs (gliding vowels) — 8 sounds
- Consonants — 24 sounds

Each cell in the chart shows:
- The IPA symbol (large, tappable)
- One example word underneath (small)
- Plays audio on tap

### Part B — Pronunciation Drill Templates
Three drill types, all launched from the upload page. None require a PDF
upload. All are displayed fullscreen during Zoom — teacher controls
everything, student responds verbally, teacher clicks on their behalf.

**1. Phoneme Drill (Minimal Pairs)**
- Teacher selects two confusable sounds (e.g. /ɪ/ vs /iː/)
- App shows a drill loop: play a word, student calls out A or B, teacher clicks
- Instant visual feedback (correct = green flash, incorrect = red flash)
- Choices labeled A and B clearly (student calls out the letter verbally)
- Pre-built dataset of minimal pairs grouped by confusable sound pairs
- Particularly useful for Brazilian Portuguese speakers: /ɪ/ vs /iː/,
  /æ/ vs /ʌ/, /θ/ and /ð/ (don't exist in Portuguese), /v/ vs /b/

**2. -ed Endings Drill**
- Drills the three pronunciation rules for regular simple past -ed endings:
  - /t/ — after voiceless consonants: walked, laughed, kissed, watched
  - /d/ — after voiced consonants and vowels: lived, called, played, opened
  - /ɪd/ — after /t/ or /d/ sounds: wanted, needed, started, waited
- Loop: teacher plays a word, student calls out A (/t/), B (/d/), or C (/ɪd/)
- Teacher clicks the right answer, feedback flashes on screen
- Optional "Show Rule" button: reveals the phonetic rule on screen as a
  teaching moment before or after drilling
- Pre-built curated word list, grouped by ending category

**3. Sound Introduction Card**
- Fullscreen card introducing one phoneme at a time
- Shows: IPA symbol (large), category label (e.g. "voiced fricative"),
  mouth position note (brief plain-English description), 3 example words
  each with a play button
- Teacher uses this to introduce a new sound before a drill or listening task
- Pre-built dataset: one card per phoneme, 44 total

---

## 4. Audio Sourcing

### Strategy
Self-host all audio files. Do not depend on any third-party API or embed at
runtime. Download once, commit to the repo under `public/audio/pronunciation/`.

### Sources to use
- **Phoneme sounds**: Source freely available IPA phoneme recordings. The
  British Council "Sounds Right" app audio is the quality benchmark — source
  equivalent free recordings. Forvo (https://forvo.com) has community
  contributed pronunciation audio that can be used for individual words.
- **Example words for drills**: short real-word recordings, native British
  English speaker, clear and consistent volume.

### File naming convention
```
public/audio/pronunciation/
  phonemes/         ← one file per phoneme, named by IPA symbol
    iː.mp3
    ɪ.mp3
    e.mp3
    ...
  words/            ← one file per example word used in drills
    ship.mp3
    sheep.mp3
    walked.mp3
    ...
```

### Important
Before building real content on top of these files, spot-check a sample of
audio for clarity and consistent volume. If quality is inconsistent, raise
the issue before proceeding — do not silently work around it.

---

## 5. Data Structure

All pronunciation content is driven by local JSON data files (no database
tables needed for v1 — this keeps it simple and easy to update).

```
resources/js/data/pronunciation/
  phonemes.json         ← 44 phonemes: symbol, example word, audio path,
                           category (monophthong/diphthong/consonant),
                           chart position (row, col for Underhill grid)
  minimalPairs.json     ← grouped by sound pair: each group has a label
                           and array of {word, audio, correctSound}
  edEndings.json        ← three groups (/t/, /d/, /ɪd/): each has array
                           of {word, audio, ending}
  soundCards.json       ← 44 entries: symbol, category, mouthPosition,
                           exampleWords [{word, audio}] x3
```

These JSON files are the single source of truth. They are imported directly
into React components — no API call needed, no Laravel route needed for
the data itself (only for serving the Inertia pages).

---

## 6. UI & UX Decisions

### Where it lives in the app
On the existing upload page, add a new grouped section below the existing
activity buttons:

```
[ Quiz ]  [ Flashcards ]  [ Unjumble ]      ← existing, no changes

──── Pronunciation ────────────────────────
[ Phonemic Chart ]
[ Phoneme Drill ]  [ -ed Endings ]  [ Sound Introduction ]
```

"Phonemic Chart" opens a new dedicated page.
The three drill buttons open a drill setup screen (pick options) then launch
fullscreen drill mode.

### Fullscreen behaviour
All pronunciation screens must support the same fullscreen mode already used
by existing activity templates. Reuse whatever fullscreen mechanism already
exists in the app — do not build a second one.

### Drill screen layout (shared by Phoneme Drill and -ed Endings)
```
┌─────────────────────────────────────┐
│                              3 / 10 │  ← thin progress, no gamified bar
│                                     │
│         ◉  ))    [word here]        │  ← large tappable play button
│                                     │
│    A   /sound/      B   /sound/     │  ← two or three large choice cards
│    word example     word example    │     clearly labeled A, B (or C)
│                                     │
└─────────────────────────────────────┘
```

- Large tap targets (works on teacher's phone or tablet if needed)
- High contrast, readable through Zoom screen share compression
- IPA symbol shown under each choice label
- Feedback: full-card green/red flash on click, auto-advance after ~1.5s
- No sound plays automatically — teacher taps the play button deliberately

### Phonemic chart layout
Follows the Underhill grid exactly. Build as a CSS grid or SVG — not a static
image — so symbols are tappable and audio plays on click. Each cell: IPA
symbol (large) + example word (small below). Tapping plays the phoneme audio.
Fullscreen button in the corner.

---

## 7. Phase Plan

### Phase 1 — Data files + audio folder structure
- Create the JSON data files in `resources/js/data/pronunciation/`
- Populate `phonemes.json` with all 44 sounds (symbol, example word, category,
  Underhill chart position)
- Populate `soundCards.json` with mouth position notes and 3 example words each
- Populate `minimalPairs.json` with at least 10 pairs per confusable group,
  prioritising Brazilian Portuguese problem sounds
- Populate `edEndings.json` with at least 10 words per ending category (/t/,
  /d/, /ɪd/)
- Create the `public/audio/pronunciation/phonemes/` and
  `public/audio/pronunciation/words/` folders with placeholder README files
- **Do not source audio files yet** — placeholders only, audio comes in Phase 2
- **Checkpoint**: JSON files are complete and valid, folder structure exists,
  no audio yet. Review data before proceeding.

### Phase 2 — Audio files
- Source and download phoneme audio files (44 sounds) into
  `public/audio/pronunciation/phonemes/`
- Source and download word audio files for all words referenced in the JSON
  files into `public/audio/pronunciation/words/`
- Spot-check at least 10 files covering tricky sounds (/ɪ/, /iː/, /θ/, /ð/,
  /æ/, /ʌ/) and the -ed ending words for volume consistency and clarity
- Update all audio paths in the JSON files to match actual filenames
- **Checkpoint**: all audio files present, paths correct, spot-check passed.
  Play a sample in the browser before proceeding.

### Phase 3 — Laravel routes + Inertia pages (shell only)
- Add routes in `routes/web.php` for:
  - `GET /pronunciation` → phonemic chart page
  - `GET /pronunciation/drill/{type}` → drill page (type: phoneme, ed-endings,
    sound-introduction)
- Create corresponding Inertia page components (React) as empty shells:
  - `resources/js/Pages/Pronunciation/Chart.jsx`
  - `resources/js/Pages/Pronunciation/Drill.jsx`
- Add the Pronunciation section buttons to the existing upload page component
  — link them to the new routes
- **Checkpoint**: buttons appear on upload page, clicking them navigates to
  the (empty) new pages without errors. Commit.

### Phase 4 — Phonemic Chart page
- Build the interactive Underhill grid in `Chart.jsx`
- Use `phonemes.json` as the data source
- CSS grid layout matching the standard Underhill groupings
  (monophthongs top-left, diphthongs top-right, consonants bottom)
- Each cell: IPA symbol + example word, tappable, plays phoneme audio on click
- Fullscreen button reusing existing fullscreen mechanism
- Visual highlight on the currently playing cell
- **Checkpoint**: open the chart page, tap at least 5 symbols across the three
  groups, confirm audio plays and layout matches the standard Underhill chart.
  Test in fullscreen. Commit.

### Phase 5 — Sound Introduction Card
- Build the Sound Introduction drill in `Drill.jsx` (or a sub-component)
- Reads from `soundCards.json`
- Fullscreen card: large IPA symbol, category label, mouth position note,
  3 example words each with individual play buttons
- Navigation: previous / next card arrows
- Fullscreen mode
- **Checkpoint**: cycle through at least 5 sound cards, play all 3 example
  words on each, confirm layout is clean and readable at fullscreen zoom.
  Commit.

### Phase 6 — Phoneme Drill (Minimal Pairs)
- Build the drill loop for minimal pairs in `Drill.jsx`
- Entry screen: teacher selects which sound pair group to drill
- Drill loop:
  - Show progress counter (e.g. 3 / 10)
  - Large play button — teacher taps to play the word audio
  - Two large choice cards labeled A and B with IPA symbol + example word
  - Teacher clicks A or B on the student's behalf
  - Correct: green flash, auto-advance after 1.5s
  - Incorrect: red flash, show correct answer, auto-advance after 2s
  - End screen: score summary (X / 10 correct)
- Read from `minimalPairs.json`, shuffle words within a session
- **Checkpoint**: run a full 10-item drill session for at least 2 different
  sound pair groups. Test correct and incorrect paths. Test in fullscreen.
  Commit.

### Phase 7 — -ed Endings Drill
- Build the -ed endings drill, reusing the drill loop structure from Phase 6
- Three choices instead of two: A (/t/), B (/d/), C (/ɪd/)
- "Show Rule" button: toggles a rule panel showing the phonetic rule for each
  ending (which consonant types trigger which ending)
- Entry screen: option to drill all endings mixed, or one ending at a time
- Read from `edEndings.json`
- **Checkpoint**: run a full mixed drill session and a single-ending session.
  Test the Show Rule toggle. Test in fullscreen. Commit.

### Phase 8 — Polish & integration review
- Review all pronunciation pages on mobile screen size (teacher may use a
  tablet or phone)
- Confirm all buttons on the upload page are correctly grouped and labeled
- Confirm fullscreen works consistently across all pronunciation pages
- Fix any audio timing issues (double-tap, audio cut-off, etc.)
- **Checkpoint**: full walkthrough of every pronunciation feature end-to-end.
  Final commit for this feature branch. Ready to merge or deploy.

---

## 8. What NOT to Build (Scope Guard)

Do not add any of the following unless explicitly requested in a new brief:
- Voice recording or speech recognition of any kind
- Student-facing links or student accounts
- Progress tracking across sessions (no database persistence for drill scores)
- American English pronunciation variant
- Grammar drills (the existing Claude-powered activity templates already
  cover grammar — this feature is pronunciation only)
- Gamification (streaks, XP, badges, leaderboards)
- Any new Claude API calls for pronunciation content — all content is
  pre-built in JSON files

---

## 9. Future Topics — Beyond the Original Scope

Phases M1–M8 (Phonemic Chart, Phoneme Drill / Minimal Pairs, -ed Endings,
Sound Introduction) are fully shipped — see `Claude.md` §12 for the actual
build log, content batches, and styling passes; this document was the
original brief and was not kept in sync phase-by-phase, so `Claude.md` is the
source of truth for what exists today.

This section catalogs candidate future pronunciation topics, evaluated
specifically against this feature's architecture constraints (local JSON
content, self-hosted audio via the existing TTS/Wikimedia pipeline, no
database, no runtime Claude API calls, teacher-run live in Zoom). Nothing
here is approved to build — each topic still needs an explicit go-ahead and
its own phase plan (see §10 for Word Stress's, which is ready to build).

### Tier 1 — straightforward, reuse the existing drill pattern directly
- **Word Stress** — spec'd out in §10, next up.
- **Homophones** (their/there/they're, know/no, write/right) — near-identical
  mechanic to the Phoneme Drill's "hear it, pick the right one" loop; the
  existing TTS word pipeline handles the audio with zero new tooling.
- **Silent Letters** (knife, comb, listen, hour) — tap-the-silent-letter or a
  category-sort drill; content is just a curated word list, no new audio
  approach needed.

### Tier 2 — good value, need a bit more design thought before spec'ing
- **Sentence Stress** — click the stressed (content) words in a sentence vs.
  unstressed function words; teaches rhythm once individual phonemes are
  solid. Needs sentence-level audio, not just single words.
- **Weak Forms** — hear "to"/"for"/"was" inside a sentence, judge weak
  (schwa) vs. strong form. Same sentence-audio need as Sentence Stress.
- **Consonant Clusters** (str-, -sts, spl-) — same shape as the -ed Endings
  drill, just a different sound-grouping rule and word list.

### Tier 3 — deferred, pricier to build (do not build without explicit re-confirmation)
- **Intonation** (rising vs. falling — questions vs. statements) — the whole
  teaching point is pitch *contour* over a full sentence, not a clip that can
  be judged correct/incorrect the way a phoneme or stress placement can.
  Meaningfully harder to source, and harder to spot-check for quality than
  anything built so far.
- **Linking / Connected Speech** ("an apple" → "a-napple", gonna/wanna) —
  highest teaching value for natural-sounding speech, but the hardest
  content to source or TTS-generate cleanly: it's a subtle phonetic
  phenomenon that's easy for TTS to render wrong in ways that aren't obvious
  without a phonetics-trained ear checking every file.

---

## 10. Next Up — Word Stress Drill (Spec)

### Why this one first
Most requested-sounding gap in the current lineup, and high value
specifically for Brazilian Portuguese speakers: Portuguese stress is far
more regular/predictable than English's, so BP speakers systematically
mis-stress multisyllabic English words. It also reuses the existing
`DrillLoop` component and the select → drilling → results phase pattern
(`MinimalPairsDrill.jsx` / `EdEndingsDrill.jsx`) with no changes to shared
code — same reason it was picked as the cheapest-to-build option among the
suggestions above.

### Interaction design
Reuses `DrillLoop` as-is (no prop changes needed). Per drill item, the
"choices" are the *same word* rendered once per syllable, with a different
syllable capitalized/bold in each — e.g. for "photograph":
`PHO-to-graph` / `pho-TO-graph` / `pho-to-GRAPH`. The teacher plays the
audio, the student calls out which rendering matches what they heard, the
teacher clicks it. This maps directly onto `DrillLoop`'s existing
`choices: [{ key, ipa, example }]` shape — no new choice type needed,
just build the syllable-marked string into the `example` field per choice.
Choice count varies naturally with syllable count (2–4), which `DrillLoop`
already supports via its adaptive grid.

### Data model — `resources/js/data/pronunciation/wordStress.json`
```json
[
  {
    "category": "2-syllable nouns",
    "words": [
      { "word": "photograph", "syllables": ["pho", "to", "graph"], "stressIndex": 0, "audio": "/audio/pronunciation/words/photograph.mp3" }
    ]
  },
  {
    "category": "noun/verb stress pairs",
    "words": [
      { "word": "record (noun)", "syllables": ["RE", "cord"], "stressIndex": 0, "audio": "/audio/pronunciation/words/record-noun.mp3" },
      { "word": "record (verb)", "syllables": ["re", "CORD"], "stressIndex": 1, "audio": "/audio/pronunciation/words/record-verb.mp3" }
    ]
  }
]
```
Grouped by category (mirrors `edEndings.json`'s group shape) so the select
screen can offer "2-syllable / 3-syllable / noun-verb pairs" the same way
`EdEndingsDrill` offers "mixed / one ending at a time". Noun/verb pairs (record
n. vs. record v., etc.) are a natural, high-value bonus category — the
classic case where English stress placement alone changes word class — but
are a nice-to-have for a later content batch, not required for the first
working version.

### Component plan
- `resources/js/components/WordStressDrill.jsx` — same fullscreen-overlay
  shell as `EdEndingsDrill.jsx`/`MinimalPairsDrill.jsx` (background photo +
  dark overlay, `.lg-surface-soft` cards, category-select → drilling →
  results phases), `buildSession()` shuffles a category's word list and maps
  each word into a `DrillLoop` item with syllable-marked `choices`.
- `PronunciationDrillPage.jsx` gains a `type === 'word-stress'` branch
  rendering `<WordStressDrill />`.
- `UploadPage.jsx`'s `PronunciationLauncher` grid gains a 4th drill button
  (currently `sm:grid-cols-3` for Phoneme Drill / -ed Endings / Sound
  Introduction — becomes a 4-button grid, same pattern as DET's launcher
  growing from a 3- to 4-button row when Vocabulary Practice was added).

### Audio
Reuses the existing TTS pipeline (`scripts/generate-pronunciation-audio.mjs`
`words` mode) unchanged in *behavior*, but `buildWordList()` needs a new loop
reading `wordStress.json` (same pattern as its existing loops over
`soundCards.json`/`minimalPairs.json`/`edEndings.json`) so new word-stress
words get picked up automatically. Noun/verb pairs need distinct filenames
per part of speech (e.g. `record-noun.mp3` / `record-verb.mp3`) since they're
different pronunciations of the same spelling. Check for the known silent
5,760-byte TTS failure mode after generating, same as every prior audio batch.

### Phase plan
**Phase W1 — Data** ✅ COMPLETED
- Wrote `wordStress.json`: 26 words across 3 categories (2-syllable — 8,
  3-syllable — 8, noun/verb stress pairs — 10 / 5 pairs), mixing
  initial- and final-stress words so the drill isn't guessable from a
  pattern.
- Validated via a Node script: JSON parses, every `stressIndex` is within
  range of its `syllables` array.

**Phase W2 — Audio** ✅ COMPLETED
- Extended `buildWordList()` to read `wordStress.json` (skipping the pair
  entries), and added a dedicated `buildStressPairList()`/
  `generateStressPairs()` path for the 10 noun/verb pair words, each with a
  short context sentence + explicit stress-syllable instruction so the two
  forms of the same spelling actually come out pronounced differently.
- Generated all 26 new audio files. Hit the known silent-5,760-byte bug once
  (`contract-noun.mp3`); fixing it via `--force` accidentally regenerated
  *all 387* previously-committed word files, introducing 9 new silent files
  among them. Caught in two passes — a byte-size scan found the 9 silent
  files, but `git status` was what revealed the full 387-file blast radius.
  Fixed by deleting the 9 silent files and regenerating without `--force`,
  then `git checkout -- public/audio/pronunciation/words/` to restore every
  other previously-committed file to its original version, leaving only the
  genuinely new content in the working tree. See `Claude.md` §12 for the
  full account — worth reading before running this script with `--force`
  again.
- Checkpoint passed: all 412 files in `words/` present, zero silent files,
  and `git status` confirms only the 26 genuinely new files are new/changed.

**Phase W3 — Component + wiring** ✅ COMPLETED
- Built `WordStressDrill.jsx` (select → drilling → results, reusing
  `EdEndingsDrill.jsx`'s structure) and wired it into
  `PronunciationDrillPage.jsx` (`type === 'word-stress'`) and the
  `PronunciationLauncher` grid (grew from 3 buttons to a 2×2 grid of 4).
- `DrillLoop.jsx` gained one opt-in prop, `plainBigText`, so the big choice
  label can render plain syllable-marked text instead of being forced into
  IPA slashes — the only change needed to the shared engine.

**Phase W4 — Verify** ✅ COMPLETED (folded into the same pass as W3)
- Temp-QA-user + Playwright pass: ran full sessions for all 3 categories
  plus Mixed always clicking the first choice — non-hardcoded scores (3/8,
  5/10, 8/20) confirmed real per-item scoring; screenshot-reviewed the
  3-choice and 2-choice drilling screens for correct syllable marking and no
  stray slashes; confirmed the noun/verb pair audio files are genuinely
  distinct (different byte sizes, both fetch successfully). Zero
  console/page errors.
- `Claude.md` §12 updated with the full build log.

---

## 11. Working Style Reminders

- One phase at a time. Do not start Phase N+1 until the Phase N checkpoint
  is confirmed.
- If something in the existing codebase is unclear (how fullscreen works, how
  Inertia pages are structured, how existing activity types are registered),
  read the existing code first before asking or assuming.
- The JSON data files are the single source of truth for content. If a word
  or sound is missing from a JSON file, add it there — do not hardcode content
  in components.
- Keep React components focused: one component per drill type is fine, but
  extract the shared drill loop (play button + choices + feedback + progress)
  into a reusable `DrillLoop` component during Phase 6 so Phase 7 just
  passes different props.
- Do not modify existing activity templates, the Claude API integration, the
  document upload pipeline, or the saved library — this feature is additive
  only.