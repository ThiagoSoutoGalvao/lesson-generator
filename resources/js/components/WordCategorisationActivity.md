# WordCategorisationActivity — Drag-and-drop word sorting activity

## Overview

This React component renders an interactive word categorisation activity where the teacher or student drags words from a pool at the bottom into the correct category columns. The activity displays 2–3 categories (e.g. Formal/Informal, Countable/Uncountable) across the screen, each as a drop zone with a dashed border. All words are initially shuffled into a pool below, and the student must sort them correctly. The component supports both drag-and-drop and click-based interaction (select a word, then click a category). Once all words are placed, a "Check Answers" button appears; after checking, correct placements turn green and incorrect ones turn red with a hint showing the correct category. The student can try again or close the activity.

This component fits into the Lesson Generator suite of fullscreen activities alongside Quiz, Flashcards, and Unjumble exercises. It inherits the same design language: Unsplash background image, header with Save/Fullscreen/Close buttons, and dark overlay with semi-transparent white text for high contrast during Zoom screen sharing.

## File Location

`resources/js/components/WordCategorisationActivity.jsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `activity` | object | Yes | The activity data object returned by Claude (contains `topic`, `keyword`, `categories` array) |
| `onClose` | function | Yes | Callback fired when the teacher clicks the Close button in the header or the final Close button after checking answers |

## State

- `pool` — array of word strings currently in the unplaced pool. Initialised by shuffling all words. Updates when a word is dragged/clicked into a category or returned to the pool.
- `placements` — object mapping word string → category name. Represents which words have been placed where. Updated when a word is placed or returned.
- `selected` — string or null. The word currently selected by click interaction (highlighted yellow). Null if no word is selected or after a placement. Allows click workflow: select word → click category.
- `checked` — boolean. False during play, true after "Check Answers" is clicked. Once true, the board is locked (no dragging/clicking), and words are coloured green (correct) or red (incorrect), with hints shown on wrong answers.
- `bgUrl` — string or null. The Unsplash image URL fetched from `/api/background` based on the activity's `keyword`. Falls back to a dark blue gradient if the fetch fails.
- `showSave` — boolean. Controls visibility of the SavePanel overlay (allows teacher to save the activity with a name and tags).

## Key Hooks Used

- `useState` — manages pool, placements, selected, checked, bgUrl, showSave state
- `useEffect` (first) — fetches background image from `/api/background` on mount
- `useEffect` (second) — attaches keyboard event listener for Escape (deselect word) and F (toggle fullscreen), cleaned up on unmount
- `useRef` — `dragRef` stores the current drag operation (word being dragged, where it started) to avoid state re-renders during drag

## User Interactions

**Drag-and-drop workflow:**
- Click and hold a word tile (in pool or any category), drag it to a category column, release to place it
- Dragging a word from one category to another category moves it (no duplicate created)
- Dragging a word from a category back to the pool area returns it to the pool
- During drag, the `dragRef` is updated; on drop, the drop handler reads `dragRef` and places/returns the word

**Click workflow:**
- Click a word in the pool or any category to select it (highlighted yellow with text "X selected — click a category above")
- Click a category column header to place the selected word there
- Click the pool area (bottom section) to return the selected word to the pool if it was in a category
- Click the same word again to deselect it

**Check and feedback:**
- After all words are placed, a "Check Answers" button appears (green)
- Click "Check Answers" to lock the board and reveal feedback
- Correct placements turn green with no hint
- Incorrect placements turn red with a small green text hint below the word showing the correct category name
- Once checked, the board is read-only (no dragging, no clicking to move words)

**Action buttons:**
- "Try Again" button (after checking) resets `pool` to shuffled words, clears `placements`, unlocks the board, and deselects any selected word
- "Close" button exits the activity (calls `onClose()`)
- "Save" button (header) opens SavePanel so the teacher can save this activity to the library
- Fullscreen button (header) toggles browser fullscreen mode using the `useFullscreen` hook
- F key toggles fullscreen
- Escape key deselects the current selected word

## What It Renders

The component renders as a `fixed inset-0` fullscreen container with the background image (or fallback gradient) and a dark semi-transparent overlay (`bg-black/60`). Inside:

1. **Header** — Left side shows activity topic + score (if checked); right side has Save, Fullscreen, and Close buttons
2. **Category zones** — Flex layout displaying 2–3 equal-width category columns, each with a dashed white border, header with category name, and a flex-wrap area for placed word tiles
3. **Word pool** — Bottom section with instruction text (changes based on selection state) and horizontal flex layout of remaining words to place
4. **Action buttons** — "Check Answers" appears when all words are placed; "Try Again" and "Close" appear after checking
5. **SavePanel** — Conditional overlay (if `showSave` is true)

Word tiles use colour-coded backgrounds:
- **Unplaced (in pool)** — semi-transparent white (`bg-white/15`) with light hover effect
- **Selected** — bright yellow (`bg-yellow-400/90`) with darker text for contrast
- **Checked + correct** — green (`bg-green-500/80`)
- **Checked + incorrect** — red (`bg-red-500/80`) with green hint text below

## How It Fits Into the App

This component is rendered by `ActivityController` (backend) and `GeneratePage` (frontend) when the activity type is `"word_categorisation"`. The teacher selects a document, types a prompt like "Create 5 formal and 5 informal words from this unit", and submits the form. The backend calls `ClaudeService::generateWordCategorisation()`, which returns JSON with the categories and words. React mounts `WordCategorisationActivity` with this data. The student then sorts words while the teacher watches on screen share. Once finished or satisfied, the teacher clicks Close to return to the activity library. The Save button allows the teacher to store this exact activity (categories, words, topic, keyword) for reuse in future lessons, avoiding the need to regenerate it each time.
