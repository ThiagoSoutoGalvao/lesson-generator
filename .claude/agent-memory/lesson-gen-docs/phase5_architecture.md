---
name: Phase 5 architecture — Activity type routing and flashcard patterns
description: Flow of activity generation, JSON schema structure, and component patterns discovered in Phase 5
type: project
---

## Activity Generation Flow

**Frontend → Backend → Claude → Frontend (display)**

1. GeneratePage: Teacher selects document, chooses activity type (quiz or flashcards), types prompt
2. POST /api/generate with: document_id, prompt, type
3. ActivityController: Validates, routes via match() statement to ClaudeService method
4. ClaudeService: buildPrompt() + sanitizeUtf8() → HTTP to Claude API → json_decode() → return array
5. ActivityController: Return activity array as JSON
6. GeneratePage: Receive activity, check activity.type, mount QuizActivity or FlashcardActivity
7. Activity component: Render fullscreen, manage user interactions, fetch backgrounds from /api/background, call onClose to return to form

## Activity JSON Schema Structure

Both quiz and flashcard responses include:
- `type` — "quiz" or "flashcards" (used for routing on frontend)
- `topic` — 1-2 word keyword for Unsplash image search (e.g. "travel", "vocabulary")

Quiz-specific:
- `questions` array with: question, keyword (per-question image search term), answers array (text + correct boolean)

Flashcards-specific:
- `cards` array with: word, definition, example, keyword (per-card image search term)

## Key Patterns

**UTF-8 sanitization:** All Claude API calls sanitize document text first using iconv('UTF-8', 'UTF-8//IGNORE', $text). This prevents json_decode() errors from broken characters in extracted PDF text.

**Prompt schema enforcement:** Both prompts (buildQuizPrompt, buildFlashcardsPrompt) include explicit JSON structure in the prompt text itself, plus rules. This is more reliable than Claude's function-calling feature for simple structured output.

**Activity component architecture:**
- Both QuizActivity and FlashcardActivity receive: activity (data) + onClose (callback)
- Fetch backgrounds asynchronously in useEffect on mount (one per card/question using keyword field)
- Render fullscreen overlay with semi-transparent overlay on background image
- Only hide form when activity is successfully generated (activity !== null)

**Progress tracking patterns:**
- Quiz: score counter (questions answered correctly / total) + question navigator
- Flashcards: known cards set (JavaScript Set for O(1) lookup) + progress bar (width = knownIds.size / total * 100)
- Flashcards: deck filtering for spaced repetition (second pass with only "still learning" cards)

**Activity type selector on GeneratePage:**
- Two toggle buttons (not dropdown)
- Placeholder text changes based on selected type
- Current selection highlighted in blue (bg-blue-600 vs bg-white)
- Stored in state as activityType, sent to backend as type param

## Next Phase Expectations

Phase 6 will add Unjumble activity type. New method needed: generateUnjumble(). Will follow same pattern:
- buildUnjumblePrompt() with JSON schema
- Return array with type: "unjumble", topic, sentences array (each with shuffled words, correct order)
- Unjumble component will render similar to others
- ActivityController match() statement will add 'unjumble' case
- GeneratePage will add third button to activity type selector
