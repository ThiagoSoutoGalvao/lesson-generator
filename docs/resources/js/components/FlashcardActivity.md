# FlashcardActivity — Interactive flashcard display component

## Overview

This React component renders a fullscreen flashcard activity where students learn vocabulary one card at a time. Students see a word on the front of a card, tap to flip and reveal its definition and example sentence on the back, then mark whether they "got it" (know the word) or still need to learn it. Cards that are marked "still learning" repeat in a second pass, while mastered cards are removed. When all cards are learned, a completion screen appears.

The component manages the entire flashcard learning loop: displaying cards with flip animations, tracking which cards are known, reshuffling unseen cards for spaced repetition, and showing progress with a visual bar. Each card's background is a thematic image fetched from the Unsplash API (e.g. a travel photo for a travel vocabulary card).

## File Location

`resources/js/components/FlashcardActivity.jsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| activity | object | Yes | The flashcard activity data. Must have `cards` (array of flashcard objects), `topic` (string). Each card in the array must have `word` (string), `definition` (string), `example` (string), and optionally `keyword` (string). |
| onClose | function | Yes | Callback function called when the user clicks the close button (✕). Parent should hide this component and return to the form. |

## State

- `index` — Current position in the `deck` array (starts at 0). Increments when user advances. Resets to 0 if cards need another pass.
- `flipped` — Boolean. Tracks whether the current card is flipped to show the definition. Resets to false when advancing to the next card.
- `knownIds` — A JavaScript Set containing the indices of all cards the user has marked as "got it". Used to track learning progress and filter for a second pass.
- `deck` — Array of card indices. Starts as all card indices (0, 1, 2, ...). After the user marks cards, the deck is filtered to only include indices of cards marked "still learning" for a second pass. This creates the spaced repetition effect.
- `finished` — Boolean. True when all cards have been learned. Triggers the completion screen.
- `backgrounds` — Array of image URLs (one per card). Fetched asynchronously from the Unsplash API. Maps to card indices (backgrounds[0] is the image for card at index 0).

## Key Hooks Used

- `useState` — Manages all of the above state variables: card position, flip state, known cards set, deck order, finish status, and background images.
- `useEffect` (on mount) — Fetches background images from `/api/background` for each card, using the card's keyword (or the activity topic as fallback). Runs once when the component mounts, not on every render. Collects all image URLs and stores them in the `backgrounds` array.

## User Interactions

- **Tap/click the card** — Flips the card to reveal the definition and example on the back. Clicking again flips it back to the word side.
- **"Still Learning" button** — Appears only when the card is flipped. Marks the card for another pass (does not add to `knownIds`), then moves to the next card.
- **"Got It" button** — Appears only when the card is flipped. Marks the card as known (adds to `knownIds`), then moves to the next card. Once all cards are marked "got it", the completion screen appears.
- **Close button (✕)** — Top right corner. Calls `onClose` to dismiss the activity and return to the form.
- **Restart button** — Visible on the completion screen only. Resets all state to the beginning and replays all cards from scratch.

## What It Renders

The component renders a fullscreen overlay with:

1. **Header** — Shows the current card number (e.g. "Card 3 / 8"), learned count (green text showing how many cards are marked "got it"), and a close button.
2. **Progress bar** — A thin green bar that fills from left to right as more cards are marked known. Width is proportional to `(knownIds.size / total) * 100`.
3. **Card (centre)** — A large 3D-rotated card (using CSS transforms for the flip animation). Front side shows the word in large bold text with a "Tap to flip" hint. Back side shows the definition (medium text) and example sentence (smaller, italicised). The card has a semi-transparent frosted-glass look (backdrop blur).
4. **Buttons below card** — "Still Learning" and "Got It" buttons appear only when flipped. They are invisible (opacity-0, no pointer events) until the card is flipped, so clicking the card to reveal the definition doesn't accidentally trigger a button.
5. **Completion screen** — When `finished` is true, the entire view changes to a "All done!" message showing how many cards were learned, with "Start Over" and "Close" buttons.
6. **Background** — A fullscreen image either from Unsplash (if loaded) or a dark blue gradient fallback. There is a semi-transparent black overlay (bg-black/60) on top to ensure text remains readable.

## How It Fits Into the App

GeneratePage calls this component after Claude successfully generates flashcard activity data. The parent passes the `activity` object (containing `cards` array, `topic`, etc.) and an `onClose` callback. When the user finishes learning or clicks close, this component calls `onClose`, and GeneratePage hides it and returns to the form, ready for the teacher to generate another activity. The flashcard content is generated by `ClaudeService.generateFlashcards()` which returns the structured JSON that this component expects.
