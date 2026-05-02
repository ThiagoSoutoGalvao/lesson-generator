# UnjumbleActivity — Interactive sentence unjumble exercise with drag-and-drop

## Overview

This component renders a fullscreen unjumble activity where students reorder scrambled words to form correct sentences. Words can be moved using either click-to-place or HTML5 drag-and-drop. Students drag or click word tiles from a word bank into an answer area to build the correct sentence, then check their work. The component tracks the score across multiple sentences, provides visual feedback (green for correct, red for wrong, yellow for revealed), and displays a final results screen when all sentences are complete.

This is one of the three core activity types in Lesson Generator, displayed fullscreen during Zoom lessons.

## File Location

`resources/js/components/UnjumbleActivity.jsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| activity | object | Yes | The activity data returned by the Claude API, containing `type`, `topic`, and an array of `sentences` (each with `sentence`, `words`, and optional `keyword`) |
| onClose | function | Yes | Callback fired when the student clicks the close button (✕). Typically resets the GeneratePage to its idle state |

## State

The component manages the following pieces of state:

- `currentIndex` — Which sentence the student is currently working on (0-based index). Starts at 0, increments when "Next" is clicked.
- `available` — Array of word tiles the student has not yet placed. Initially shuffled from the correct sentence. Each tile has a unique `id` and `word` text.
- `placed` — Array of word tiles the student has clicked into the answer area, in the order they were placed. Initially empty.
- `checkStatus` — The state of the current attempt: `'idle'` (user is arranging words), `'correct'` (user's sentence matches), `'wrong'` (user's sentence doesn't match), or `'revealed'` (correct answer was shown).
- `score` — Number of sentences the student has answered correctly. Incremented when `checkStatus` becomes `'correct'`.
- `finished` — Boolean. Set to `true` when the student moves past the final sentence, triggering the results screen.
- `backgrounds` — Array of Unsplash image URLs, one per sentence. Each URL is fetched in parallel on mount using the sentence's `keyword` or the activity's `topic`.

## Key Hooks Used

- `useState` — Manages all game state: current sentence index, available word tiles (word bank), placed tiles (answer area), check status, score, finished flag, and background image URLs.
- `useEffect` — Runs once on mount. Fetches a background image for each sentence from the `/api/background` endpoint in parallel using `Promise.all()`. Each fetch uses the sentence's `keyword` or the activity's `topic` as the search term. If a fetch fails, stores `null` for that sentence.
- `useRef` — Stores drag state (`dragRef.current = { tile, from }`) without triggering re-renders. This prevents React from recalculating the component on every drag start/end event. The `from` field is either `'available'` (dragged from word bank) or `'placed'` (dragged from answer area).

## User Interactions

### Placing and Removing Words
- **Click word tile in word bank** — Calls `handlePlace()`, which removes the tile from `available` and adds it to `placed`. Disabled if `checkStatus` is not `'idle'`.
- **Click word tile in answer area** — Calls `handleUnplace()`, which removes the tile from `placed` and returns it to `available`. Disabled if `checkStatus` is not `'idle'`.
- **Drag word tile from word bank into answer area** — Triggers `onDragStart()` (records drag source), then `onDropIntoPlaced()` (calls `handlePlace()`). Only allowed if dragging from `'available'` zone and status is `'idle'`.
- **Drag word tile from answer area back into word bank** — Triggers `onDragStart()`, then `onDropIntoAvailable()` (calls `handleUnplace()`). Only allowed if dragging from `'placed'` zone and status is not preventing interaction.

### Game Control Buttons
- **"Check" button** (shown when all words are placed) — Calls `handleCheck()`. Joins the placed words with spaces and compares to the correct sentence. If they match, sets status to `'correct'` and increments score. Otherwise, sets status to `'wrong'`. Button is disabled until `available.length === 0` (all tiles placed).
- **"Reveal Answer" button** (shown in `'idle'` state, and again if `'wrong'`) — Calls `handleReveal()`. Populates the answer area with the correct words in order, clears the word bank, and sets status to `'revealed'`. Tiles in the revealed answer are styled in yellow and not draggable.
- **"Try Again" button** (shown after `'wrong'` attempt) — Calls `handleTryAgain()`. Reshuffles the correct words back into the word bank, clears the answer area, and resets status to `'idle'` so the student can attempt again.
- **"Next →" or "See Results" button** (shown after `'correct'` or `'revealed'`) — Calls `handleNext()`. If not the final sentence, increments `currentIndex`, reshuffles the next sentence's words, and resets status to `'idle'`. If this was the last sentence, sets `finished` to `true` to show the results screen.

### Results and Navigation
- **"Play Again" button** (on results screen) — Calls `handleRestart()`. Resets `currentIndex` to 0, score to 0, reshuffles the first sentence, and returns to `'idle'` state.
- **"Close" button** (top right header, or on results screen) — Calls `onClose()`, which is passed from the parent and typically closes the activity and returns to the previous page.

## What It Renders

**During activity (while `finished === false`):**
- **Background layer** — Full-screen background image (fetched from Unsplash via `/api/background`) with a dark semi-transparent overlay (60% black opacity) for text readability. Falls back to a blue gradient if no image is available.
- **Header bar** (top, with z-index) — Shows the current sentence number (e.g. "Sentence 2 / 5"), the score (with yellow highlight), and a close button (✕).
- **Status message** (above answer area) — Large, color-coded text that changes based on the current attempt:
  - `'idle'`: "Drag or click the words into the correct order"
  - `'correct'`: "✓ Correct!"
  - `'wrong'`: "✗ Not quite — try again or reveal the answer"
  - `'revealed'`: "Here is the correct sentence"
- **Answer area (drop zone)** — Large white/translucent box (min-height 88px) where words are placed in order. Has a dashed white border. Displays placeholder text "Drag or click words here…" when empty. Tiles in the answer area are styled based on feedback:
  - `'idle'` state: White/translucent background, draggable, clickable to remove
  - `'correct'` state: Green background, not draggable, cursor shows "not allowed"
  - `'wrong'` state: Red background, draggable, can be reordered
  - `'revealed'` state: Yellow background, not draggable
- **Word bank (drop zone)** — Flexible container below the answer area showing all available (unplaced) word tiles as buttons. Tiles are larger now: `px-5 py-3 text-base`. All tiles are marked `draggable="true"` and show `cursor-grab` style to indicate drag capability.
- **Action buttons** (below word bank) — Contextual buttons that appear/hide based on status:
  - In `'idle'` state: "Reveal Answer" and "Check" (Check is disabled until all tiles are placed)
  - In `'wrong'` state: "Try Again" and "Reveal"
  - In `'correct'` or `'revealed'` state: "Next →" (or "See Results" on the final sentence)

**After all sentences are complete (`finished === true`):**
- Full-screen results screen with dark background, showing:
  - Large "Well done!" heading
  - Score summary in large text (e.g. "You got 4 out of 5 correct", with the score in yellow)
  - Two action buttons: "Play Again" (restarts from sentence 0) and "Close" (fires `onClose` prop)

## Drag-and-Drop Implementation Details

The component uses the HTML5 Drag and Drop API for an enhanced interactive experience (with click-to-place as a fallback):

- **`dragRef` (useRef)** — Stores a reference to the current drag operation (`{ tile, from }`) without triggering React re-renders. Persists across drag start, move, and drop events.
- **`onDragStart(tile, from)`** — Fired when a tile is grabbed. Records the tile being dragged and which zone it came from (`'available'` or `'placed'`). Sets `dragRef.current`.
- **`onDropIntoPlaced(e)`** — Drop handler for the answer area. Prevents default browser behavior (`e.preventDefault()`), checks that a tile is being dragged from the word bank (not within the answer area itself), and calls `handlePlace()` if valid.
- **`onDropIntoAvailable(e)`** — Drop handler for the word bank. Prevents default behavior, checks that a tile is being dragged from the answer area, and calls `handleUnplace()` if valid.
- **`onDragEnd()`** — Fired at the end of any drag operation. Clears `dragRef.current` to avoid stale state.
- **`onDragOver` on drop zones** — Both drop zones have `onDragOver={(e) => e.preventDefault()}` handlers to enable dropping.
- **Tile size** — Word tiles are now larger (`px-5 py-3 text-base`) to make dragging easier and improve readability.

The design allows students to use whichever interaction method is most comfortable: drag-and-drop for fluid movement, or click-to-place for accessibility.

## How It Fits Into the App

This component is imported and rendered by the Activity Display page (likely inside a `GeneratePage` or similar) when the activity type is `'unjumble'`. The activity data is generated by the `ClaudeService` (backend) which sends a teacher's prompt and document text to the Claude API and receives a structured JSON object containing a list of sentences with scrambled words.

The component is purely presentational — it does not save the activity or send data back to the server. It is designed as a fullscreen, interactive learning tool to be shared during a live Zoom lesson. When the student clicks "Close", the parent component typically navigates back to the activity selection or library page.
