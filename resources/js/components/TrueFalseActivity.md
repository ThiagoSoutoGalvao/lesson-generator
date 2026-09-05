# TrueFalseActivity — Reading comprehension with True/False/Not Given statements

## Overview

This component displays a reading comprehension activity where students read a passage and answer six statements about it by choosing **True**, **False**, or **Not Given**. The passage is visible in a side panel and can be hidden with the P key or the "Hide/Show passage" button. Students see one statement at a time, click their answer, receive immediate feedback with an explanation, then advance to the next statement. A running score is displayed throughout. At the end, a results screen shows the final score as a percentage and offers "Try Again" or "Close" options.

The layout is optimized for Zoom screen sharing: large text, high contrast against a background image from Unsplash, and fullscreen support via the F key or button.

## File Location
`resources/js/components/TrueFalseActivity.jsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| activity | object | Yes | The activity data object containing `topic`, `keyword`, `passage`, and `statements` array |
| onClose | function | Yes | Callback function to close the activity and return to the previous screen |

## State

- `currentIndex` — The zero-indexed position in the `statements` array; starts at 0 and increments when the student clicks "Next"
- `chosen` — The option the student selected for the current statement (`'True'`, `'False'`, `'Not Given'`, or `null` if no choice yet); resets to `null` when advancing to the next statement
- `answers` — An array of booleans where each element is `true` if the student's answer matched the correct answer, `false` otherwise; grows by one element each time the student answers
- `finished` — A boolean flag; when `true`, the results screen is shown instead of the activity
- `showPassage` — A boolean that controls the visibility of the reading passage panel on the left; can be toggled with the P key or the button in the header
- `bgUrl` — The URL of the Unsplash background image fetched from the `/api/background` endpoint; falls back to a gradient if the fetch fails
- `showSave` — A boolean that controls whether the `SavePanel` overlay is visible
- `fontSizeIdx` — Zero-indexed position in the `FONT_SIZES` array (values 0–2 corresponding to `text-xl`, `text-2xl`, `text-3xl`); controls the size of both passage text and statement text; starts at 1 (medium size)
- `isFullscreen` — A boolean (managed by the `useFullscreen` hook) that tracks whether the browser is in fullscreen mode

## Key Hooks Used

- `useEffect` (line 33–37) — Fetches the Unsplash background image on first render using the activity's `keyword` or `topic` as the search term
- `useEffect` (line 39–41) — Resets `chosen` to `null` whenever `currentIndex` changes (when the student advances to the next statement)
- `useEffect` (line 43–51) — Sets up keyboard listeners for Space (advance after answering), P (toggle passage visibility), and F (toggle fullscreen); cleans up on unmount
- `useFullscreen` (line 26) — Custom hook that manages the browser fullscreen API and returns `isFullscreen` state and a `toggle()` function

## User Interactions

**Answer buttons (True / False / Not Given):**
- Disabled after the student has chosen an answer
- Clicking an unanswered button sets `chosen` and records the answer in the `answers` array
- **True** button uses green styling (base color `bg-green-500/20`, selected `bg-green-500`)
- **False** button uses red styling (`bg-red-500/20` → `bg-red-500`)
- **Not Given** button uses amber/yellow styling (`bg-amber-500/20` → `bg-amber-500`)
- After answering: the correct option highlights fully (100% opacity color), wrong chosen option is struck through and dimmed, and unchosen options dim further

**Passage visibility:**
- "Hide passage" / "Show passage" button in the header toggles `showPassage`
- Keyboard shortcut: **P** key also toggles
- When `showPassage` is `true`, a panel on the left (50% of width on desktop via `md:w-1/2`, full width below md breakpoint) shows the passage text in the selected font size
- When `false`, the statement and buttons expand to fill the space

**Font size adjustment (Phase A addition):**
- Two buttons in the header: **A-** (decrease) and **A+** (increase) control the text size of both the passage and statement text
- **A-** button decreases `fontSizeIdx` down to 0 (small: `text-xl`), disabled when already at minimum
- **A+** button increases `fontSizeIdx` up to 2 (large: `text-3xl`), disabled when already at maximum
- Default is 1 (medium: `text-2xl`)
- Both the passage panel text and the statement text scale together using `FONT_SIZES[fontSizeIdx]`
- This allows teachers to adjust readability for students sitting far from the screen or who need text enlarged

**Score display:**
- Real-time score in the header: `"Score: {correct_count}"` displayed in yellow
- The score is recalculated whenever `answers` changes as `answers.filter(Boolean).length`

**Next / See Results button:**
- Appears only after the student has answered
- Label is "Next →" on all statements except the last, which says "See Results"
- Clicking advances to the next statement or triggers `finished = true` and shows the results screen
- Can also be triggered by pressing **Space**

**Save button:**
- Shows `SavePanel` overlay when clicked, allowing the teacher to save the activity
- Closes the panel when `SavePanel` calls its `onDone` callback

**Fullscreen button:**
- Calls `toggleFullscreen()` from the hook
- Icon shows '⛶' (expand) when not fullscreen, '⊡' (shrink) when in fullscreen
- Keyboard shortcut: **F** key
- Once the activity is full screen, it still fills the screen (no responsive changes needed because `fixed inset-0` is already set)

**Close button (✕):**
- Calls `onClose()` to close the activity

## What It Renders

**During activity (not finished):**
1. **Background layer:** A full-screen background image from Unsplash (or gradient fallback) with a semi-transparent black overlay (65% opacity)
2. **Header:** Topic name, statement counter (e.g. "Statement 1 / 6"), live score, A-/A+ font size buttons, passage toggle, save button, fullscreen toggle, close button
3. **Left panel (if showPassage):** A frosted glass card (white/8 background, 50% of container width) containing the reading passage in light gray text; scales with font size (text-xl / text-2xl / text-3xl)
4. **Right panel (or full width if passage is hidden):** 
   - Large, bold statement text scaled by `FONT_SIZES[fontSizeIdx]` (text-xl / text-2xl / text-3xl)
   - Three answer buttons stacked vertically
   - Feedback message (green if correct, red if wrong) with explanation text — shown only after answering
   - "Next" or "See Results" button — shown only after answering

**Results screen (finished):**
- Centered white box with:
  - "Complete!" heading (text-5xl)
  - Score display: `"{score} out of {total} correct"`
  - Percentage displayed in gray below
  - Two buttons: "Try Again" (blue, resets the activity) and "Close" (white/20, calls `onClose()`)

## How It Fits Into the App

`TrueFalseActivity` is rendered by `ActivityDisplay` (in `ActivityPage` or the activity router) when the activity type is `"true_false"`. The teacher clicks "Generate" on the `GeneratePage`, Claude returns a True/False/Not Given activity in the correct JSON format, and `ActivityController::generate()` stores it in the session or database. Then the activity page loads this component, passing the activity data and an `onClose` handler.

The teacher shares their screen on Zoom and the student sees the activity fullscreen. The student reads the passage (if visible) and answers each statement. The teacher can toggle the passage visibility to give thinking time before revealing it again, hide it during independent work, or unhide it to help struggling students. After completing all six statements, the results show a percentage score.

If the teacher clicks "Save" during the activity, `SavePanel` saves the activity to the database with a name and tags, and it becomes available in the activity library for future reuse.
