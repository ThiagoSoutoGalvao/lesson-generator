---
name: Phase 10 Word Categorisation Activity Architecture
description: Word categorisation activity implementation — component interaction, JSON schema, drag/click UI patterns
type: project
---

## Word Categorisation Activity — Implementation Summary

As of 2026-05-03, the Word Categorisation activity has been added to Lesson Generator as the fifth activity type. This activity allows students to sort words into 2–3 semantic categories (e.g. Formal/Informal, Countable/Uncountable, parts of speech).

### Frontend Component
**File:** `resources/js/components/WordCategorisationActivity.jsx`

- Single background image (Unsplash, based on `activity.keyword`)
- Category columns laid out in flex row (2–3 categories, equal width)
- Word pool at bottom with drag-and-drop + click interaction
- State management: `pool` (shuffled words), `placements` (word→category mapping), `selected` (click workflow), `checked` (locked after validation)
- Drag uses `useRef` to avoid re-renders mid-drag; `dragRef` stores word and source location
- Click workflow: select word (yellow) → click category → word moves
- Fisher-Yates shuffle used on initial pool and "Try Again" reset
- Feedback: correct placements green, incorrect red with hint showing correct category name
- Keyboard: Escape deselects, F toggles fullscreen
- Full SavePanel integration (same as other activities)

### Backend Integration
**File:** `app/Services/ClaudeService.php`

- **New method:** `generateWordCategorisation(string $documentText, string $prompt): array`
  - Uses `max_tokens: 1024` (smaller than quiz/flashcards at 2048)
  - Sanitises UTF-8 before sending to Claude
  - Returns structured array: `type`, `topic`, `keyword`, `categories` (each with name + words array)

- **New private method:** `buildWordCategorisationPrompt(string $documentText, string $prompt): string`
  - Enforces 2–3 categories (never more)
  - All categories must have equal word count (4–6 words each)
  - Words must be unambiguously correct for their category
  - Single word or short phrase (max 3 words)
  - Suggests category types: Formal/Informal, Countable/Uncountable, tenses, parts of speech, sentiment, topic-based

### JSON Schema (Claude Output)
```json
{
  "type": "word_categorisation",
  "topic": "Formal vs Informal",
  "keyword": "office meeting",
  "categories": [
    { "name": "Formal", "words": ["commence", "obtain", "sufficient", "request"] },
    { "name": "Informal", "words": ["start", "get", "enough", "ask"] }
  ]
}
```

### Key Design Patterns
1. **Shuffle ownership:** Claude returns words in order per category; frontend shuffles all words into a single pool using Fisher-Yates
2. **Dual interaction:** Both drag-and-drop (HTML5 Drag API) and click workflow (select then place) supported for accessibility
3. **Single keyword:** Unlike quiz (per-question) or flashcards (per-card), word categorisation uses one keyword for entire activity background
4. **Unambiguous correctness:** Prompt enforces that words are clearly correct for one category, not borderline cases
5. **Equal category sizes:** Constraint prevents one category being much larger than others

### Request Flow
1. Teacher selects document + activity type (`word_categorisation`) + prompt
2. POST to `/api/activities/generate` with `document_id`, `type`, `prompt`, optional `page_from`/`page_to`
3. `ActivityController::generate()` fetches document, slices text if needed, calls `ClaudeService::generateWordCategorisation()`
4. Backend returns JSON, frontend renders `WordCategorisationActivity` component
5. Teacher can save via SavePanel; activity JSON stored in DB for reuse

### UI Conventions Inherited
- Dark overlay + Unsplash background (consistent with Quiz, Flashcards, Unjumble, DialogGapFill)
- Header: topic + score (after check), Save/Fullscreen/Close buttons
- Instruction text updates based on state (no selection, word selected, all placed)
- "Check Answers" button green, "Try Again"/"Close" buttons appear post-check
- Tile colors: white/15 (unplaced), yellow/90 (selected), green/80 (correct), red/80 (incorrect)
- Cursor: grab on tiles (draggable), default on checked board

### Error Handling
- If background fetch fails, falls back to dark blue gradient
- If all words are placed but student never clicks "Check Answers", button remains visible
- "Try Again" completely resets state: reshuffles pool, clears placements, unlocks board, deselects word
- No validation of inputs client-side; all word order validation happens backend (via prompt to Claude)

### Naming & Conventions
- Activity type slug: `word_categorisation` (underscore, not camelCase or hyphen)
- Component name: `WordCategorisationActivity` (PascalCase)
- Database column: `type` stores `'word_categorisation'`
- Router params: `type=word_categorisation` in ActivityController switch/match
