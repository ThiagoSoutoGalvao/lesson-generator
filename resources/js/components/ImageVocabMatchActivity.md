# ImageVocabMatchActivity — Image-to-word matching game with visual feedback

## Overview

This React component renders an interactive matching activity where students pair vocabulary words with images. The interface displays a grid of thematic images at the top and word tiles at the bottom. The student clicks a word to select it, then clicks an image to match. Correct matches are locked with a green overlay and the word label appears on the image; incorrect matches trigger a visual shake and fade within 600ms. The activity completes when all pairs are matched correctly.

The component supports fullscreen display for Zoom screen sharing, keyboard shortcuts for interaction, and a save feature for reuse via the `SavePanel`. Unlike Quiz and Flashcard activities which use per-question Unsplash backgrounds, ImageVocabMatch uses per-pair (per-image) backgrounds — one image per vocabulary word.

## File Location

`resources/js/components/ImageVocabMatchActivity.jsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| activity | object | Yes | The activity object containing: `pairs` (array of `{ keyword, word }` objects), `topic` (string for header display) |
| onClose | function | Yes | Callback fired when the user clicks the Close button or needs to exit the activity |

**Example activity shape:**
```javascript
{
  type: 'image-vocab-match',
  topic: 'Travel vocabulary',
  pairs: [
    { keyword: 'airport terminal', word: 'Terminal' },
    { keyword: 'suitcase luggage', word: 'Suitcase' },
    { keyword: 'passport document', word: 'Passport' }
  ]
}
```

## State

- `imageUrls` — Array of image URLs (one per pair), initially filled with `null` placeholders. Updated after all background images are fetched from the API. Used to display or show loading skeleton while fetching.
- `wordOrder` — Array of indices (0 to total-1) representing the current shuffled order of words. Mutated when words are matched (filtered to remove matched index). Starts with a Fisher-Yates shuffle on mount.
- `selected` — Index into `wordOrder` representing which word tile is currently selected by the student, or `null` if no word is selected. Toggled on word click, cleared on successful match or Escape keypress.
- `matched` — Object with shape `{ imageIdx: wordLabel, ... }`. Keys are image/pair indices, values are the word strings. Used to lock matched images, display word labels on matched images, and detect completion.
- `wrongImage` — Index of the image that was just clicked with an incorrect word selection, or `null`. Triggers a red border/scale animation for 600ms, then resets.
- `finished` — Boolean. Set to `true` when `Object.keys(matched).length === total`. Causes the component to render the completion overlay instead of the main activity.
- `showSave` — Boolean controlling visibility of the `SavePanel` overlay.
- `isFullscreen` — Boolean from the `useFullscreen` hook; reflects whether the browser is in fullscreen mode.

## Key Hooks Used

### `useFullscreen()`
Custom hook (imported from `@/hooks/useFullscreen.js`) that manages browser fullscreen API state. Returns `{ isFullscreen, toggle }` where `toggle` fires on F key or fullscreen button click.

### `useEffect` (Image Fetching)
Runs once on component mount. Fetches background images for all pairs in parallel via `/api/background` endpoint with each pair's `keyword` as the topic. Fails gracefully — any failed fetch results in `null` (rendered as loading skeleton). All 50+ parallel requests wait to resolve before updating state.

### `useEffect` (Keyboard Shortcuts)
Runs once on mount and cleanup on unmount. Listens for:
- **Escape** — Deselects the currently selected word
- **F** — Toggles fullscreen mode

## User Interactions

### Word Tile Click
Clicking a word tile at the bottom toggles selection:
- If the tile is already selected: deselects it (sets `selected` to `null`)
- If a different tile is selected: switches selection to the new tile
- If no tile is selected: selects the clicked tile and shows a blue highlight + helper text

### Image Click
Clicking an image tile in the grid:
- **Ignored if:** no word is selected OR the image is already matched
- **On correct match:** 
  - Image border turns green, overlay becomes semi-transparent green
  - Word label appears centered at the bottom of the image
  - Removes the selected word from `wordOrder` (shrinks the word list)
  - Clears selection
  - If all pairs are now matched, sets `finished` to `true`
- **On incorrect match:**
  - Image border turns red, overlay becomes semi-transparent red, tile scales down 5% (`scale-95`)
  - Red state lasts 600ms, then resets
  - Word remains selected so student can try another image

### Fullscreen Toggle
Clicking the fullscreen button (⛶ / ⊡) or pressing F triggers browser fullscreen API. Icon updates to reflect current state.

### Save Button
Clicking Save overlays the `SavePanel`, which allows the teacher to save the activity to the library with a custom name and tags. On completion, panel closes.

### Close Button
Clicking the ✕ button or "Close" on the completion screen fires the `onClose` callback, returning to the previous page.

### Try Again Button
Appears on the completion screen. Resets all state (shuffles word order, clears matched, clears selection, sets finished to false) to restart the activity.

## What It Renders

### Main Activity State
A fullscreen fixed overlay with a deep blue gradient background (`linear-gradient(135deg, #0f2027 → #203a43 → #2c5364)`) and a dark overlay (`bg-black/65`) for contrast.

**Header (top):**
- Left: Activity topic and progress counter (e.g. "Travel vocabulary" + "2 / 5 matched")
- Right: Save, Fullscreen, and Close buttons (all text icons with hover states)

**Word tiles (top-to-middle, Phase A restructure):**
- Wrapping flex layout, centered in a narrow section between header and image grid
- Each word is a button with rounded corners and 2px border
- Selected word: bright blue background, blue border, 105% scale, box shadow
- Unmatched word: semi-transparent white background, white/20 border, hover brightens
- Above word tiles (if any word is selected): helper text in gray saying "Click an image to match '[WORD]'" — or click the word again to deselect"
- Word tiles remain visible at all times, so students can always see which words are left

**Image grid (middle-to-bottom, Phase A change):**
- Responsive: 2 columns if ≤4 pairs, 3 columns if 5–6 pairs, 4 columns if 7+ pairs
- Each tile is a button with rounded corners and a 2px border
- Border color changes based on state:
  - Green + cursor-default if matched
  - Red + scale-95 if wrong (animated 600ms)
  - White/50 if clickable (selected word exists)
  - White/15 if inactive
- Matched images show a semi-transparent overlay with the matched word label in a green badge at the bottom
- Unmatched images show a loading skeleton (`bg-white/10 animate-pulse`) while fetching
- Grid automatically resizes as pairs are matched (as remaining unmatched images shrink the required grid space)

### Completion Screen
A centered modal overlay (same gradient background) with:
- Large "Complete!" heading (text-5xl)
- Subtitle: "All [total] words matched correctly."
- Two buttons: "Try Again" (blue, primary action) and "Close" (semi-transparent white)

## How It Fits Into the App

**ImageVocabMatch** is one of seven activity types in Lesson Generator, generated when the teacher submits a prompt asking for image-vocabulary matching (e.g. "Create image matches for travel vocabulary from unit 4"). The teacher also selects a pair count (4, 6, or 8) before generation.

The backend `ClaudeService::generateImageVocabMatch()` receives the pair count and returns structured JSON with exactly that many `{ keyword, word }` pairs. Keywords are descriptive multi-word search phrases (e.g., "woman drinking coffee cafe") to improve Unsplash image relevance. The `ActivityController` validates the pair count (must be 4, 6, or 8) and passes it to `ClaudeService`.

The component fetches thematic images for each pair using the existing `/api/background` endpoint — called once per pair in parallel for speed. Images are requested using each pair's descriptive `keyword`, which produces more visually relevant results than a simple word lookup.

When the teacher presses Save, the activity JSON is stored in the `activities` table via `SavePanel`, allowing it to be reused in future classes without regeneration.

This activity type is optimized for:
- **Vocabulary reinforcement** — Students must recall word meanings by matching them to visual representations
- **Presentation mode** — Large clickable images and words work well on shared screens with a mouse/trackpad
- **Engagement** — The visual-feedback animations (color changes, scaling) provide immediate positive/negative reinforcement
- **Pace control** — Unlike quizzes, there is no timer, giving the teacher time to explain answers

**Phase A improvements:** Words moved to the top so they remain always visible; grid adapts responsively (2×2 for 4 pairs, 2×3 for 6 pairs, 2×4 for 8 pairs); keywords became descriptive multi-word phrases for better Unsplash results.

**Storage notes:** The activity JSON (with `pairs` array, `topic`, and `type`) is stored as-is in the `activities` table's `content` column. On reload from the library, the same `pairs` and `topic` are passed to this component, ensuring identical behavior.
