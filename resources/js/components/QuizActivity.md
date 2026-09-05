# QuizActivity — Multiple-choice quiz with visual feedback and scoring

## Overview

This component displays a multiple-choice quiz where students answer questions one by one, receiving immediate visual feedback on each answer. Each question displays large, clear text with four answer buttons. A correct answer highlights in green, an incorrect selection highlights in red, and the other options dim. After answering, a "Next" button appears to advance to the next question. A score counter and question progress indicator appear in the header. When all questions are answered, a results screen shows the final score as a percentage and offers "Play Again" or "Close" options.

The component is optimized for Zoom screen sharing — large text, high contrast against a background image from Unsplash, fullscreen support via the F key or button, and Space key to advance after answering. In Phase A, an optional `quiz.instruction` field was added above the question text to provide a one-time task instruction (e.g., "Choose the correct answer" or "Choose the correct word to complete the sentence").

## File Location

`resources/js/components/QuizActivity.jsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| quiz | object | Yes | The quiz data object containing `type`, `topic`, `instruction` (optional), and `questions` array |
| onClose | function | Yes | Callback function to close the quiz and return to the previous screen |

## State

- `currentIndex` — Zero-indexed position in the `quiz.questions` array; starts at 0, increments when the student clicks "Next →"
- `selectedAnswer` — Index of the selected answer (0–3) or `null` if no answer chosen yet; resets to `null` when advancing to the next question
- `score` — Running count of correct answers; incremented only when the student selects an option with `correct: true`
- `finished` — Boolean flag; when `true`, the results screen is displayed instead of the activity
- `backgrounds` — Array of Unsplash image URLs (one per question), fetched in parallel on mount; `null` entries indicate fetch failure
- `showSave` — Boolean controlling visibility of the `SavePanel` overlay
- `isFullscreen` — Boolean from the `useFullscreen` hook; reflects whether the browser is in fullscreen mode

## Key Hooks Used

- `useEffect` (lines 21–29) — Fetches all question background images in parallel on mount using each question's `keyword` (or falls back to `quiz.topic`); stores URLs in `backgrounds`
- `useEffect` (lines 31–33) — Resets `selectedAnswer` to `null` whenever `currentIndex` changes (when advancing to the next question)
- `useEffect` (lines 35–42) — Sets up keyboard listeners for Space (next/advance) and F (toggle fullscreen); cleans up on unmount
- `useFullscreen` (line 15) — Custom hook managing the browser fullscreen API; returns `isFullscreen` state and a `toggle()` function

## User Interactions

**Question navigation:**
- The quiz displays one question at a time
- Left side shows "Question X / Total" in the header
- Right side shows live score and buttons for Save, Fullscreen, and Close

**Answer buttons (A, B, C, D):**
- Each question has 4 answer buttons labeled A–D
- Before answering: buttons appear semi-transparent white (hover effect brightens them)
- After clicking an answer: buttons become disabled and styling changes:
  - **Correct answer:** Green background (`bg-green-500`), white text, fully opaque
  - **Wrong selected answer:** Red background (`bg-red-500`), white text
  - **Other wrong answers:** Dim gray, still visible but clearly not selected
- Clicking an answer also increments `score` if the answer is correct

**Advancing:**
- "Next →" button appears only after an answer is selected
- On the last question, button label changes to "See Results"
- Can be triggered by clicking the button or pressing **Space** key
- After the last question, advances to the results screen

**Instruction text (Phase A addition):**
- If the quiz has an `instruction` field, it displays above the question text in small, light gray text
- Provides a one-time task instruction (e.g., "Choose the correct answer") rather than repeating it for each question
- Helps students understand the task at the start

**Save button:**
- Clicking shows the `SavePanel` overlay, allowing the teacher to save the quiz to the library
- Closes when `SavePanel` calls its `onDone` callback

**Fullscreen button:**
- Clicking or pressing **F** toggles fullscreen mode
- Icon shows '⛶' (expand) when not fullscreen, '⊡' (shrink) when fullscreen

**Close button (✕):**
- Calls `onClose()` to exit the quiz and return to the previous page

## What It Renders

### Main Activity (not finished)

A full-screen fixed overlay (`inset-0`) with:
1. **Background:** Unsplash image fetched for the current question (or a dark blue gradient fallback if no image)
2. **Overlay:** Semi-transparent black (`bg-black/55`) for contrast over the background
3. **Header bar:** 
   - Left: Question counter (e.g. "Question 3 / 5")
   - Right: Live score, Save button, Fullscreen button, Close button (all with hover effects)
4. **Main content area (centered):**
   - Optional instruction text in light gray (if `quiz.instruction` is present)
   - Large, bold question text (responsive: `text-3xl` to `text-4xl`)
   - Grid of 4 answer buttons (`grid-cols-2` layout, 2×2 grid)
   - Each button shows a label (A, B, C, D) followed by the answer text
   - Buttons are styled as glassmorphic pills with smooth transitions
5. **Next button:** Appears below answers only after answering; blue background with hover effect

### Results Screen (finished)

A centered modal overlay (same gradient background) with:
- Large "Quiz Complete!" heading (`text-5xl`)
- Score display: "You scored **X** out of **Y**" with score in yellow
- Percentage display in gray (e.g. "80%")
- Two buttons: "Play Again" (blue, resets the quiz) and "Close" (semi-transparent white, calls `onClose()`)

## How It Fits Into the App

`QuizActivity` is rendered by `GeneratePage` (or its parent activity router) when the activity type is `"quiz"`. The teacher clicks "Generate" on `GeneratePage`, selects the Quiz activity type, enters a prompt (or uses the pre-filled default), and submits. The backend `ClaudeService::generateQuiz()` returns structured JSON with the quiz schema. The `ActivityController::generate()` returns this JSON to the frontend, which then displays `QuizActivity`.

During the activity, the teacher shares their screen on Zoom. The student sees the quiz fullscreen and answers each question, receiving immediate visual feedback. After all questions are answered, the results show the final score. The teacher can then click "Save" to store the quiz in the activity library for future reuse without regeneration.

The instruction field (added in Phase A) was introduced to provide a one-time task description at the top of the quiz rather than including it in every question text. This improves screen real estate and reduces redundancy in the generated prompt output.
