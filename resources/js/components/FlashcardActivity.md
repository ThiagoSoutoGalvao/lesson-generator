# FlashcardActivity — Interactive flashcard learning component with flip animation and question mode

## Overview

This component displays a fullscreen flashcard learning experience. Students see cards one at a time, flip them to reveal the definition, and mark each card as either "Got It" (learned) or "Still Learning" (needs more practice). Cards marked as "Still Learning" loop back at the end of the deck and are revisited until all cards are marked as learned. The component now includes a **question mode toggle** that flips the learning direction: students can study "Word → Definition" (normal mode) or "Definition → Word" (question mode, where the definition is shown first and the student must guess the word).

## File Location

`resources/js/components/FlashcardActivity.jsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| activity | Object | Yes | The flashcard activity data structure containing a `cards` array; each card has `word`, `definition`, `example`, and `keyword` fields |
| onClose | Function | Yes | Callback to close the activity and return to the previous screen |

## State

- `index` — Current position in the deck (starts at 0)
- `flipped` — Boolean flag indicating whether the current card is flipped to show the back
- `knownIds` — Set of card indices that the student marked as "Got It"
- `deck` — Array of card indices; starts with all cards, then filters to only "Still Learning" cards after each full pass
- `finished` — Boolean flag; becomes true when all cards have been marked as learned
- `backgrounds` — Array of background image URLs (one per card), fetched from `/api/background` on mount
- `showSave` — Boolean flag controlling visibility of the save panel overlay
- `questionMode` — Boolean flag; when true, shows definition on front and word on back (opposite of normal mode)

## Key Hooks Used

- `useEffect` (lines 26–34) — On mount, fetches background images in parallel for every card via `/api/background`, using each card's `keyword` or falling back to the activity's `topic`. Stores URLs in `backgrounds` state.
- `useEffect` (lines 58–65) — Sets up keyboard event listener: Space toggles card flip, F toggles fullscreen. Cleans up listener on unmount.
- `useFullscreen()` (custom hook) — Provides `isFullscreen` boolean and `toggleFullscreen()` function for native fullscreen API integration.

## User Interactions

### Card Flip
- **Click the card** — toggles `flipped` state; front/back are rotated via CSS 3D transform
- **Space key** — toggles card flip without fullscreen
- The card shows front content by default:
  - **Normal mode:** Word (large, bold) on front; definition + example on back
  - **Question mode:** Definition + example + "What's the word?" hint on front; word (large, bold) on back
- Action buttons ("Still Learning" / "Got It") only appear when the card is flipped (`opacity-0 pointer-events-none` when not flipped)

### Mark as Learned or Still Learning
- **"Got It" button** — Adds the card's index to `knownIds` set, advances to next card or restarts loop if needed
- **"Still Learning" button** — Advances to next card without marking it; the card stays in `stillLearning` array and will be shown again at the end of the current loop
- Both buttons reset the card to unflipped state when advancing

### Toggle Question Mode
- **Mode button** (header, purple when active) — Toggles `questionMode` state and resets the current card to unflipped
- Button text changes to reflect the current mode: "Word → Definition" or "Definition → Word"
- Purple styling (`bg-purple-500/30`, `text-purple-200`) when active; subtle white styling when inactive

### Advance Logic
The `advance(newKnownIds)` function:
1. Moves to the next card (`index + 1`)
2. If no more cards in the deck:
   - Filters `deck` to only include indices NOT in `newKnownIds` (the "Still Learning" cards)
   - If no "Still Learning" cards remain, sets `finished = true`
   - Otherwise, resets `deck` to the "Still Learning" array, `index = 0`, and `flipped = false` to start a new loop
3. Otherwise, increments `index` and resets `flipped = false`

### Restart
- **"Start Over" button** (on finished screen) — Resets deck to all cards, clears `knownIds`, sets `finished = false`, `index = 0`, `flipped = false`

### Save Activity
- **Save button** (header) — Opens the `SavePanel` overlay; once saved, user can reload this exact activity later

### Fullscreen
- **Fullscreen button** (header, shows ⛶ or ⊡) — Toggles fullscreen mode; keyboard shortcut F does the same
- Tooltip shows "Fullscreen (F)" or "Exit fullscreen (F)" depending on state

## What It Renders

A fullscreen container with a gradient background (or background image if available) divided into:

1. **Header** — progress counter ("Card 1 / 8"), learned counter with green text, question mode toggle button (with purple styling when active), save button, fullscreen button, close button
2. **Progress bar** — Green bar at the top; width represents `(knownIds.size / total) * 100%`
3. **Card area** — The main flashcard with 3D flip animation; front and back are rendered simultaneously but only one is visible at a time via `backfaceVisibility: hidden` and `transform: rotateY(180deg)`
4. **Action buttons** — "Still Learning" (white/translucent) and "Got It" (green) buttons, only visible when card is flipped
5. **Finished screen** — Shows "All done!" message with card count, plus "Start Over" and "Close" buttons

## How It Fits Into the App

FlashcardActivity is rendered by the `ActivityPage` component when displaying a saved or newly generated flashcard activity. The teacher initiates the activity, and FlashcardActivity takes over the entire screen. When the teacher or student finishes, `onClose()` returns them to the library or previous page. The component is reusable: the same component displays both generated-on-the-fly flashcards and previously saved activities, since both are passed as the `activity` prop with identical structure.

Background images are fetched asynchronously on mount, and if an image fails to load, a gradient fallback is used. Keyboard controls (Space to flip, F for fullscreen) enable hands-free operation during live Zoom lessons.

## Notes

- The card flip animation uses CSS 3D transforms (`transformStyle: preserve-3d`, `backfaceVisibility: hidden`, `rotateY`) for smooth, performant 3D rotation. This is not a Tailwind built-in; inline styles are used instead.
- The component does not handle fullscreen exit via Escape key (that's handled by `useFullscreen` hook).
- Question mode is a per-session state: toggling it does not persist across page navigation or activity reload. The next time the activity is opened, it will default to normal mode.
