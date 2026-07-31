# Lesson Generator — Project Brief & Technical Roadmap

---

## 1. Project Overview

**Lesson Generator** is a web application for English teachers who teach one-on-one online. Teachers upload a course book PDF (or audio file), type a natural language prompt, and the app generates interactive classroom activities via the Claude API — displayed fullscreen for Zoom screen sharing.

Activities can be saved and reused across sessions.

---

## 2. The Problem It Solves

Teachers on platforms like Wordwall spend significant time manually creating exercises. Lesson Generator replaces that with a prompt: select a unit, describe what you want, get a ready-to-use activity in seconds.

---

## 3. Target Users

- **V1:** Solo use — the teacher building the app
- **V2:** 5 colleagues invited for beta feedback
- **V3:** Monetization — subscription model for language teachers

---

## 4. Core Features

### Activity Types (14 templates)
1. **Multiple Choice Quiz** — question + 4 answer buttons, color feedback, score counter, navigation
2. **Flashcards** — word/definition flip cards, "Got it / Still learning" deck logic, question mode toggle
3. **Unjumble** — scrambled sentence word tiles, drag or click to reorder, reveal answer
4. **Dialog Gap-Fill** — scripted dialogue with blanks, 3 A/B/C card options per blank
5. **True/False/Not Given** — reading passage + 6 statements, P key toggles passage panel
6. **Image Vocabulary Match** — word tiles + image grid, click-to-match, number badges, batch image loading
7. **Word Categorisation** — drag-and-drop words into 2–3 categories, Check Answers color feedback
8. **Word Formation** — root word displayed large, gapped sentence revealed on tap
9. **Odd One Out** — set of word tiles, click the odd one out, explanation revealed
10. **Cloze** — gapped passage with word bank, click blank to reveal answer
11. **Discussion Questions** — large question + follow-up prompts, arrow key navigation
12. **Sentence Transformation** — original sentence + key word + stem, reveal transformed answer
13. **Error Correction** — sentence with underlined error, reveal correct form + explanation
14. **Matching Pairs** — two-column term ↔ definition grid, click-to-match, wrong flash animation

### Other Features
- **PDF & audio upload** — PDF text extracted per page (`smalot/pdfparser`); audio transcribed via Whisper
- **Section focus** — Vocabulary / Grammar / Listening / Reading pills prepend focus hint to prompt
- **Unsplash backgrounds** — per-activity thematic image (Picsum fallback); local static images for layout shell (`/public/backgrounds/`)
- **Save & library** — activities saved with book/lesson/folder tags, relaunchable
- **Fullscreen mode** — F key or button; keyboard shortcuts (Space = next, R = reveal, P = passage)
- **Accessibility** — navbar A-/A+ font control (CSS custom properties + `!important`); per-activity font size and color selectors

---

## 5. Technical Stack

- **Frontend:** React (Vite), Shadcn/ui, Tailwind CSS v4 (CSS-first, config in `resources/css/app.css`), React Router
- **Backend:** Laravel (PHP 8.4), Laravel Herd (local), MySQL
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`), OpenAI Whisper (`whisper-1`) for audio
- **Auth:** Laravel Breeze (session-based); `SESSION_DRIVER=database` in production
- **Deployment:** Railway (FrankenPHP via Railpack), Railway MySQL plugin
- **Live URL:** `https://lesson-generator-production-9da7.up.railway.app`

---

## 6. Development Workflow

**Build → Test manually → Commit → Move on.** Never start the next phase without committing the current one.

---

## 7. Completed Phases

- **Phase 1** ✅ — Laravel + React + Tailwind + Shadcn project setup
- **Phase 2** ✅ — PDF upload and text extraction (per-page, UTF-8 sanitized)
- **Phase 3** ✅ — Claude API integration (`ClaudeService`, `ANTHROPIC_API_KEY`)
- **Phase 4** ✅ — Quiz activity with Unsplash backgrounds
- **Phase 5** ✅ — Flashcard activity with flip animation and deck logic
- **Phase 6** ✅ — Unjumble activity with drag-and-drop (HTML5 Drag API)
- **Phase 7** ✅ — Save & library (`activities` table, `SavePanel`, folder/book/lesson tags)
- **Phase 8** ✅ — Fullscreen presentation mode (`useFullscreen` hook in `resources/js/hooks/`)
- **Phase 9** ✅ — Polish: page range selector, error handling, Breeze auth, 4 new templates, glass UI
- **Phase A** ✅ — UI fixes: quiz `instruction` field, TrueFalse font toggle, ImageVocabMatch pair count (4/6/8/12)
- **Phase B** ✅ — Better image keywords: 3–5 word descriptive scene phrases across all prompt builders
- **Phase C** ✅ — Section focus pills (Vocabulary / Grammar / Listening / Reading) on GeneratePage
- **Phase D** ✅ — Flashcard question mode toggle (Definition → Word)
- **Phase E** ✅ — Browser-side file size check before upload; amber banner with compression links
- **Phase F** ✅ — 7 new templates: Odd One Out, Cloze, Discussion Questions, Sentence Transformation, Error Correction, Matching Pairs, Word Formation
- **Phase G** ✅ — Audio upload + Whisper transcription (background queue job, `TranscribeAudioJob`, status polling)
- **Phase H** ✅ — Local background images in `/public/backgrounds/` replace Unsplash for layout shell
- **Phase I** ✅ — Navbar font control (CSS vars `--tf-size`/`--tf-color`/`--tf-family`); per-activity A-/A+ on all 14 templates
- **Phase J** ✅ — Per-activity font color swatches (5 colors); UI polish on DialogGapFill, TrueFalse, DiscussionQuestions, ErrorCorrection, MatchingPairs

---

## 8. Phase 10 — Deployment ✅ COMPLETED

**Platform:** Railway (Hobby plan, ~$5/month)
**Stack:** FrankenPHP (Railpack auto-detection) + Railway MySQL plugin

**Key facts:**
- Start command: `php artisan migrate --force && php artisan queue:work --tries=3 --timeout=300 & /start-container.sh`
- Queue worker runs in same container as web server (avoids inter-container filesystem isolation)
- `bootstrap/app.php` — `$middleware->trustProxies(at: '*')` for Railway reverse proxy
- Local disk is ephemeral — PDF text and transcripts stored in MySQL, not filesystem
- `vite.config.js` entry: `resources/js/App.jsx` (capital A — Linux is case-sensitive)
- `guest.blade.php` loads CSS only, no `app.js` (fixes Vite manifest 500 on login page)
- Config/route/view caching happens at build time; `start-container.sh` clears and re-caches at runtime

**User scoping:**
- `user_id` on `documents` and `activities` tables; all controllers scoped to `auth()->id()`
- Migrations are idempotent (`Schema::hasColumn` guard) — safe to re-run
- Records with `null` user_id are orphaned (pre-scoping data, invisible to all users)

**Registration:** CLOSED — register routes removed from `routes/auth.php`. 4 beta users: Fernando, Sapulha, Daniel, Hianna.

**Railway env vars:**
- `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://...` (must be `https` — mixed-content errors otherwise)
- `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`, `CACHE_STORE=database`, `FILESYSTEM_DISK=local`
- `ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY`, `OPENAI_API_KEY`, `LOG_LEVEL=error`, `PORT=8080`

---

## 9. Phase 11 — Monetization (ACTIVE)

**Goal:** Get the first paying customer.

### Pricing

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 10 generations/month, no audio upload, no save |
| **Pro** | $12/month | Unlimited generations, all 14 templates, audio upload, save & library |
| **School** | $49/month | Everything in Pro, up to 5 teacher accounts |

### Technical Setup: Stripe + Laravel Cashier

**Install:**
```bash
composer require laravel/cashier
php artisan vendor:publish --tag="cashier-migrations"
php artisan migrate
```

**`.env` keys:** `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`

**`config/services.php`:**
```php
'stripe' => [
    'model'   => App\Models\User::class,
    'key'     => env('STRIPE_KEY'),
    'secret'  => env('STRIPE_SECRET'),
    'webhook' => ['secret' => env('STRIPE_WEBHOOK_SECRET'), 'tolerance' => 300],
],
```

**User model:** add `use Laravel\Cashier\Billable;` trait.

**Webhook:** `POST /stripe/webhook` → must be CSRF-exempt in `bootstrap/app.php`.
Events: `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded/failed`

**Generation counting:** Add `generations_this_month` (int) + `generations_reset_at` (date) to `users` table. Guard in `ActivityController::generate()`:
```php
if (!$user->subscribed('default') && $user->generations_this_month >= 10) {
    return response()->json(['message' => 'Free limit reached. Upgrade to Pro.'], 403);
}
$user->increment('generations_this_month');
```
Reset monthly via a scheduled Artisan command.

**Checkout:**
```php
return $user->newSubscription('default', 'price_1ABC...')
    ->checkout(['success_url' => route('billing.success'), 'cancel_url' => route('billing.cancel')]);
```

**Billing portal:** `return $user->redirectToBillingPortal(route('home'));`

### What to Build

- **Upgrade modal** — shown when free user hits 10 generations: "Upgrade to Pro for $12/month"
- **Pricing page** (`/pricing`) — three tiers side by side, each "Get started" button → Stripe Checkout
- **Account page** (`/account`) — current plan, generations used this month, next billing date, "Manage billing"
- **Navbar badge** — "Free — X/10 generations used" for free users; hidden on Pro

### Action List

1. ✅ Message beta users re: $12/month willingness
2. ✅ Create Stripe account, set up Pro + School products
3. ✅ Install Laravel Cashier, run migrations locally
4. ✅ Record 60-second screen demo
5. ✅ Post in Facebook TEFL groups and subreddits
6. ✅ Add `STRIPE_KEY` and `STRIPE_SECRET` to Railway Variables

**Commit target:** `Phase 11: Stripe + Cashier setup, pricing page, generation limits`

> See `docs/phase11-marketing.md` for marketing strategy and revenue targets.

---

## 10. Phase K — Activity UI Polish ✅ COMPLETED

Improvements across four activity templates:

**Quiz:**
- Font size extended to 5 steps (`text-2xl` → `text-6xl`); option cards scale proportionally via `OPTION_SIZES`
- Previous button added; answers stored per question index so navigating back restores answered state; score recalculates dynamically
- Font color bar added (White / Yellow / Orange / Red / Cyan) — same palette now standard across all templates

**Flashcard:**
- Font color bar added (same 5-color palette)
- `example2` field added to Claude prompt and rendered on card (back and question-mode front)
- `EXAMPLE_SIZES` array scales examples proportionally with A-/A+
- Font sizes extended to 5 steps for word (`text-4xl`→`text-8xl`), definition (`text-lg`→`text-4xl`), examples (`text-sm`→`text-2xl`)
- Card height increased to 420px to accommodate larger sizes

**Word Formation:**
- Font color bar added (same 5-color palette)
- `FORM_SIZES` array added — word class label (`noun`, `verb`, etc.) now scales with font size, one tier below the sentence

**Error Correction:**
- `EXPLANATION_SIZES` array added — explanation scales with A-/A+, always one Tailwind step below the sentence
- Color palette updated to match standard (White / Yellow / Orange / Red / Cyan)

**Standard color palette** (all templates going forward):
```js
{ label: 'White',  cls: 'text-white',      bg: '#ffffff' }
{ label: 'Yellow', cls: 'text-yellow-300', bg: '#fde047' }
{ label: 'Orange', cls: 'text-orange-400', bg: '#fb923c' }
{ label: 'Red',    cls: 'text-red-400',    bg: '#f87171' }
{ label: 'Cyan',   cls: 'text-cyan-300',   bg: '#67e8f9' }
```

---

## 11. Phase L — Presentation Tool ✅ COMPLETED

**Goal:** Evolve the Grammar Explainer into a standalone animated Presentation tool. Teachers can type any topic and get a fullscreen slide deck — no PDF required.

### Phase L1 — Animation & Layout ✅

- **Direction-aware slide push** — `direction` state set on Next/Prev/keyboard/dot-click; slide container uses `key={slideIdx-direction}` to remount on navigation, triggering `.pres-enter-right` / `.pres-enter-left` CSS animations (350ms ease-out translateX)
- **Staggered content build** — `.stagger-block` CSS class with `nth-child` delays (60ms, 180ms, 300ms, 420ms, 540ms) on `.slide-content` children; avoids React re-triggering the animation on unrelated state changes (e.g. font size)
- **Grammar term pulse** — `.slide-content strong { animation: pres-term-pulse 0.9s … 0.75s }` — bold `**terms**` glow briefly on slide enter
- **Layout** — `overflow-y-auto` removed; content is `flex-1 flex items-center justify-center` — true fullscreen, no scrolling
- **Font size** — 5 steps at module scope (`TITLE_SIZES`, `RULE_SIZES`, `FORM_SIZES`, `EXAMPLE_SIZES`); standard palette; `textColor` applies to title as well

### Phase L2 — Standalone Presentation Tool ✅

- **UploadPage** — third tab `🎞 Presentation` (indigo theme); `PresentationGenerator` component with topic input + optional extra instructions field
- **API** — `POST /api/presentation/generate` → `ActivityController::generatePresentation()` → `ClaudeService::generatePresentation()` — no document required; generalised prompt works for any topic (grammar, vocabulary, culture, exam tips, etc.)
- **Routing** — on success, navigates to `/generate` with `{ state: { activity } }`; `GeneratePage` initialises from `location.state` so presentation opens immediately
- **Type: `presentation`** — uses same JSON schema and `GrammarExplainerActivity` component as `grammar_explainer`
- **Save/Library** — `presentation` added to `SavedActivityController` validator, `LibraryPage` labels/colors/filters/launcher

**Key files:**
- `resources/js/components/GrammarExplainerActivity.jsx` — shared renderer for both types
- `resources/css/app.css` — `pres-enter-*`, `pres-fade-up`, `pres-term-pulse`, `.stagger-block` nth-child rules
- `app/Services/ClaudeService.php` — `generatePresentation()` + `buildPresentationPrompt()`
- `app/Http/Controllers/ActivityController.php` — `generatePresentation()` method
- `resources/js/pages/UploadPage.jsx` — `PresentationGenerator` + three-tab layout

### Phase L3 — Presentation UX Improvements ✅

- **Slide count selector** — `SLIDE_OPTIONS = [4, 5, 6, 7, 8, 10]` pill buttons in `PresentationGenerator`; defaults to 6; sent as `slides` in POST body; validated `min:4 max:10` in controller; passed through to `buildPresentationPrompt()`
- **Prompt enforces exact count** — prompt now says "Generate EXACTLY {n} slides — do not generate fewer"; previously Claude treated `4 to 6` as a ceiling and defaulted low
- **Examples per slide increased** — prompt changed from "2 to 3 examples" to "4 to 6 examples per slide"
- **`max_tokens` bumped** — 4096 → 6000 to accommodate larger payloads (10 slides × 6 examples)
- **Extra instructions field** — limit raised from 500 → 3000 characters (backend validator); textarea is now 5 rows tall and vertically resizable (`resize-y`) so pasted book text is readable
- **Prompt label updated** — "Extra instructions / examples from the book" to clarify the paste-from-book use case
- **PDF / print export** — "⬇ PDF" button in header calls `window.print()`; a hidden `.pres-print-root` div renders all slides stacked (one per page) and becomes visible only during print via `@media print { body * { visibility: hidden } .pres-print-root { display: block !important; visibility: visible } }`; solid `#1a1a2e` navy background (no image), accent colours preserved via `print-color-adjust: exact`; interactive view hidden with `print:hidden`; layout: meta line → title → rule box → optional form box → numbered examples

### Phase L4 — Split-Screen Slide Layout ✅

- **Problem:** with 4–6 examples per slide, the single-column layout (title → rule → form → examples → nav) overflowed the viewport and pushed the Prev/Next buttons off-screen.
- **Fix:** `GrammarExplainerActivity.jsx` slide content restructured into a split-screen layout, mirroring `TrueFalseActivity`'s passage/statement pattern:
  - Left panel (`md:w-[56%]`) — topic label, title, rule box, optional form box; vertically centered
  - Right panel (`flex-1`) — examples list in a `flex-1 min-h-0 overflow-y-auto` scroll region; Prev/Next buttons pinned below via `shrink-0`, always visible regardless of example count or font size
  - `.stagger-block` CSS animation delays (`nth-child`-scoped per parent) are unaffected by the two-column split since each panel is its own flex container
- Verified via Playwright against a live-generated 8-slide deck at 1280×720 with font size maxed — examples scroll internally, nav buttons stay fully visible on every slide.

**Dev gotcha:** if `npm run dev` (Vite) is force-killed rather than stopped gracefully, it can leave `public/hot` behind. Laravel's `@vite` directive then keeps trying to load assets from the (no longer running) dev server at `localhost:5173`, causing a blank page with `ERR_CONNECTION_REFUSED` even after `npm run build`. Fix: delete `public/hot` so Laravel falls back to the built assets in `public/build`.

---

## 12. Phase M — Pronunciation Feature (IN PROGRESS)

**Goal:** standalone phonemic chart + drill templates for teaching English pronunciation (Adrian Underhill RP chart, minimal-pairs drills, -ed endings drill, sound introduction cards) driven entirely by local JSON + self-hosted audio — no Claude API, no database. Full spec in `PronunciationFeature.md`; phases proceed one at a time with a manual checkpoint before continuing.

**Architecture note:** `PronunciationFeature.md` was written assuming an Inertia.js setup (`routes/web.php` page routes, `resources/js/Pages/...`). This app is actually a React Router SPA behind one Laravel catch-all route (`resources/js/App.jsx`, pages in `resources/js/pages/`, lowercase). Phase 3+ routes go in `App.jsx`, not `routes/web.php`; the upload page is tab-based (`UploadPage.jsx`), not the button row the doc describes.

### Phase M1 — Data files ✅ COMPLETED
- `resources/js/data/pronunciation/{phonemes,soundCards,minimalPairs,edEndings}.json`
- 44 phonemes (12 monophthongs / 8 diphthongs / 24 consonants) with Underhill-style chart grid positions (`row`/`col`)
- 6 minimal-pair groups prioritising Brazilian Portuguese confusions (/ɪ/ vs /iː/, /æ/ vs /ʌ/, /θ/ vs /ð/, /v/ vs /b/, /ʃ/ vs /tʃ/, /ɒ/ vs /ʌ/) — flat word list per group tagged with `correctSound` (not paired word-to-word — simpler to shuffle for the drill loop)
- 3 `-ed` ending groups (/t/, /d/, /ɪd/), 12 words each, with rule text included
- `public/audio/pronunciation/{phonemes,words}/` folder scaffold

### Phase M2 — Audio ✅ COMPLETED
- 44 phoneme files: 36 (all 24 consonants + 12 monophthongs) sourced from Wikimedia Commons IPA reference recordings — the same audio used on Wikipedia's own IPA chart pages (`IPA_consonant_chart_with_audio`, `IPA_vowel_chart_with_audio`), fetched via `Special:FilePath/{filename}.ogg` and transcoded `.ogg` → `.mp3` with `ffmpeg-static` (Safari/iOS has no native Ogg Vorbis support); 8 diphthongs via OpenAI TTS since Wikimedia has no diphthong recordings (English glides aren't part of the universal cardinal-vowel chart)
- 263 word files via OpenAI TTS (`gpt-4o-mini-tts`, voice `fable`, instructed for neutral British RP)
- **TTS is unreliable for isolating a single phoneme sound** — asking it to isolate e.g. `/ð/` mid-word produced 40+ seconds of rambling instead of a clean ~1s sound. It's fine for whole words and for diphthongs said as natural short words/interjections (`day`, `eye`, `hair`...). This is why the 36 consonant/monophthong files use Wikimedia instead of TTS.
- **Silent-output failure mode**: TTS occasionally returns a valid-looking but silent clip — every observed instance was exactly 5,760 bytes (`think.mp3` first, then 4 more words in the full batch). Worth grepping for that exact byte count if regenerating or adding words later.
- Scripts (one-off, not part of the app runtime): `scripts/generate-pronunciation-audio.mjs` (OpenAI TTS; modes `spotcheck`/`phonemes`/`diphthongs`/`words`/`all`, `--force` to regenerate) and `scripts/fetch-wikimedia-phonemes.mjs` (Wikimedia fetch + ffmpeg transcode for the 36 consonant/monophthong files)

### Phase M3 — Routes + page shells ✅ COMPLETED
- React Router routes in `App.jsx` (not `routes/web.php` — see architecture note above): `/pronunciation` → `PronunciationChartPage.jsx`, `/pronunciation/drill/:type` → `PronunciationDrillPage.jsx` (`type` one of `phoneme`, `ed-endings`, `sound-introduction`)
- 4th "🔊 Pronunciation" tab added to `UploadPage.jsx` (`PronunciationLauncher`) alongside PDF/Audio/Presentation — Phonemic Chart button + 3 drill buttons
- Shells import their real JSON data source and render a data-driven summary line (e.g. "44 phonemes...") to prove the wiring end-to-end before building real UI in M4+; each page has a "← Back to Upload" link
- No `chromium-cli` available in this environment for the `run` skill's browser-driven pattern — verified instead with a throwaway Playwright script using `playwright` (`chromium.launch()`), driven through a temporary QA user created/deleted via `php artisan tinker` (never touches real beta user data). Confirms login → all 4 destinations → zero console errors.

### Phase M4 — Interactive phonemic chart ✅ COMPLETED
- `PronunciationChartPage.jsx` rebuilt as a full `fixed inset-0 z-50` fullscreen overlay (same pattern as the activity components, e.g. `QuizActivity.jsx`) instead of a plain routed page — covers the nav header the same way activities do
- Underhill-style grid built straight from `phonemes.json`'s `row`/`col` fields via inline `style={{ gridColumn, gridRow }}` per cell (not Tailwind grid utilities, since positions are per-item and dynamic): monophthongs (4 cols) top-left, diphthongs (5 cols) top-right, consonants (6 cols) below
- Tap a cell → `new Audio(phoneme.audio).play()`, cell highlights (teal + scale) until `onended` fires
- Reuses `useFullscreen` hook (F key / button, same as other activities); Escape or ✕ navigates back to `/upload`
- State lives in the page component and is passed down as plain props (`playingSymbol`, `onPlay`) through `PhonemeSection` → `PhonemeCell` — first draft used a module-level pub/sub to "avoid prop drilling" for a 2-level-deep tree, which was overengineered and had a real bug (mutable module state breaks under fast refresh); caught and simplified before committing

### Phase M — Launcher polish + back-navigation fix ✅ COMPLETED
- `PronunciationLauncher` (in `UploadPage.jsx`) buttons enlarged (`py-8`/`py-6`, bigger text, hover-scale) so they stand out on the upload page — tweak this function if sizing needs to change again
- `UploadPage` now accepts an initial tab via router state (`location.state?.tab`), so pronunciation pages can navigate back to the Pronunciation tab specifically instead of always landing on the default PDF tab: `navigate('/upload', { state: { tab: 'pronunciation' } })`
- Drill pages' back control changed from a styled `<Link>` to a real `<button>`, matching the chart page's ✕ button

### Phase M5 — Sound Introduction card ✅ COMPLETED
- `components/SoundIntroductionCard.jsx`, rendered by `PronunciationDrillPage` when `type === 'sound-introduction'` (the other two drill types still show the M3 placeholder shell)
- Same fullscreen-overlay pattern as the chart page; cycles through all 44 `soundCards.json` entries — large IPA symbol, category label, mouth-position note, 3 example words each with their own play button (highlights while playing)
- Prev/Next buttons + Left/Right arrow keys, clamped (not wrapping) at both ends

### Phase M6 — Phoneme Drill (Minimal Pairs) ✅ COMPLETED
- `components/DrillLoop.jsx` — shared drill loop extracted per the spec's working-style note, used by both M6 and (to come) M7: progress counter, big play button, 2–4 choice cards (grid columns adapt), green/red flash on click (wrong answer also reveals the correct card), auto-advance (1.5s correct / 2s wrong), exports a `shuffle()` helper. Takes `items`/`choices`/`onFinish`/`headerExtra` props — `headerExtra` slot exists specifically so M7's "Show Rule" toggle can be passed in without changing `DrillLoop` itself.
- `components/MinimalPairsDrill.jsx` — fullscreen overlay (same pattern as chart/sound-card pages) with three phases: group-select grid (6 buttons from `minimalPairs.json` labels) → drilling (renders `DrillLoop`) → results (score out of 10, "Drill Again" / "Choose Another Group"). Each session shuffles the group's word list and takes 10; the two choice cards are fixed per session, keyed by the group's `sounds` values with an anchor example word looked up from the first matching entry.
- `PronunciationDrillPage.jsx` now renders `MinimalPairsDrill` directly for `type === 'phoneme'` (bypassing the old placeholder `DRILL_INFO` entry, which was removed); `ed-endings` still shows the M3 placeholder.
- Verified via a throwaway Playwright script driven through a temporary QA user (created/deleted via a standalone bootstrap script, not `tinker` — `php artisan tinker --execute` chokes on `@` in the argument on this Windows/PowerShell setup): login → Pronunciation tab → Phoneme Drill → group select → played + answered all 10 items → correct/wrong flash and score (3/10, confirming scoring isn't hardcoded) → results screen → "Choose Another Group" back-nav. Zero console/page errors. Escape-to-upload navigation verified separately (works correctly in isolation); pairing it with a fullscreen-toggle click first eats the first Escape via the browser's native Fullscreen API handling — pre-existing behavior shared with the chart/sound-card pages, not something new here.

### Phase M7 — -ed Endings Drill ✅ COMPLETED
- `components/EdEndingsDrill.jsx` — same three-phase pattern as `MinimalPairsDrill` (select → drilling → results), reusing `DrillLoop` unmodified with 3 fixed choices (`/t/`, `/d/`, `/ɪd/`, anchor example word = first word in each `edEndings.json` group). Entry screen offers "Mixed — all three endings" (pools all 36 words) or one ending at a time (12 words each); session size capped at 12 either way.
- "Show Rule" toggle passed in via `DrillLoop`'s `headerExtra` slot exactly as planned in M6 — `EdEndingsDrill` owns the `showRule` boolean and renders a banner above `DrillLoop` listing all three `rule` strings from the JSON (not scoped to the current word — a static reference panel works for both mixed and single-ending modes without needing to lift per-item state out of `DrillLoop`).
- `PronunciationDrillPage.jsx` now renders `EdEndingsDrill` directly for `type === 'ed-endings'`; the `DRILL_INFO`/`BackButton`-placeholder scaffold from M3 is gone entirely — the fallback case is now just "unknown drill type" for a bad `:type` param.
- Verified with the same temporary-QA-user + Playwright pattern as M6: mixed-mode session with Show Rule toggled on/off (rule text confirmed visible/hidden), 12-item mixed session answered (6/12, consistent with always picking choice A against a random correct key), then a single `/ɪd/` session answered the same way (0/12, since choice A (`/t/`) is never correct when every item's answer is fixed to `/ɪd/` — confirms per-item scoring isn't hardcoded to "always right"). Zero console/page errors across both runs.

### Phase M8 — Polish & integration review ✅ COMPLETED
- Explicit "← Back" button added to the header of `MinimalPairsDrill`, `EdEndingsDrill`, and `SoundIntroductionCard` (a separate follow-up ask, ahead of the M8 pass) — unconditionally navigates to `/upload` with the Pronunciation tab active from any phase (select/drilling/results), unlike the existing ✕ which steps back to the select screen first when mid-drill. `PronunciationChartPage` was intentionally left with just the ✕ — it was never part of that request and has no multi-phase state to escape from.
- **Mobile audit** — a Playwright script measured `document.documentElement.scrollWidth` vs `clientWidth` at phone (390×844) and tablet (834×1194) for the launcher tab and all 5 pronunciation screens. Found a real bug: at phone width every page overflowed horizontally by the same fixed amount (708px vs 390px client width) — same number on every route, which pointed at something global rather than anything pronunciation-specific.
- **Root cause**: `Layout.jsx`'s header `<nav>` (3 page links + the Aa/A−/A+/color accessibility control + Log out) was a single non-wrapping flex row, wide enough to push the whole document past the viewport on a phone — which pushed the accessibility control and Log out button fully off-canvas (not just visually cramped, actually unreachable without manual horizontal scroll). This affects every page, not just pronunciation ones, but it's what the pronunciation launcher tab actually looks like on a phone, so it's in scope for "review pronunciation pages on mobile" per the spec. Fixed by adding `flex-wrap` to both the header's outer flex container and the `<nav>` itself — wraps onto two rows below ~700px width, single row unchanged above that. Re-ran the audit: zero overflow on every page at both viewports.
- Visually reviewed all 5 screens at both viewports via screenshot — chart grid, drill select screens, drill-loop choice cards (2 and 3 column), and the sound card all render with legible text and adequate tap targets at 390px; tablet width (the primary expected device) was already clean.
- **Audio cut-off bug**: `DrillLoop.jsx` already paused its `Audio` object on unmount (from M6), but `PronunciationChartPage.jsx` and `SoundIntroductionCard.jsx` did not — tapping a sound then immediately navigating away (e.g. via the new Back button) left the clip playing in the background after the component unmounted. Fixed by adding the same `useEffect(() => () => audioRef.current?.pause(), [])` cleanup pattern to both.
- Fullscreen behavior confirmed already consistent across all 5 screens — all use the same `useFullscreen` hook, F-key toggle, and Escape handling; no divergence found.
- Full regression pass after both fixes (temporary QA user + Playwright): chart tap-to-play, phoneme drill session, ed-endings drill session, sound-card arrow navigation, and mid-audio navigation on both the chart and sound-card pages — zero console/page errors.

**Pronunciation feature (Phases M1–M8) is now complete.**

---

## 13. Phase N — DET Practice Mode (IN PROGRESS)

**Goal:** DET-format (Duolingo English Test) reading/vocabulary and speaking practice for one student, teacher-run live in Zoom — no scoring engine, no recording, no DET branding/verbatim content. Full spec in `# DET Practice Mode — Feature Roadmap.md`. Part A (Read and Select, Fill in the Blanks, Read and Complete, Interactive Reading) is priority since the student struggled most with vocabulary/reading; Part B (speaking, Phases 5–7 in that doc) is untouched so far. Same architecture as Pronunciation: local JSON content only, no database, no Claude API calls at runtime.

### Phase 1 — Data model + tab wiring ✅ COMPLETED
- `resources/js/data/det/{readSelect,fillBlank,readComplete,interactiveReading}.json`
- `DetPracticePage.jsx` — reads `:type` route param, renders a real drill (once built) or a data-driven placeholder summary otherwise, mirroring how `PronunciationDrillPage` staged drills in one page per phase
- 5th "🎯 DET Practice" tab added to `UploadPage.jsx` (`DetPracticeLauncher`, amber theme) alongside PDF/Audio/Presentation/Pronunciation
- Route `/det/practice/:type` in `App.jsx`
- `interactiveReading.json`'s passage is stored as a sentence array (not one text blob) specifically to keep both candidate UIs for the "highlight the answer" sub-task open (text-selection vs. click-a-sentence) without committing at the data layer — still an open question from the roadmap doc

### Phase 2 — Read and Select + Fill in the Blanks drills ✅ COMPLETED
- `components/det/PracticeSessionShell.jsx` — shared fullscreen chrome (progress label, pause, redo, fullscreen, back) used by both drills, same visual pattern as the pronunciation drill pages
- `components/det/ReadSelectDrill.jsx` — word grid, click-to-toggle, adjustable soft per-word timer (3s/5s/8s or untimed), Check Answers with green/red feedback
- `components/det/FillBlankDrill.jsx` — sentence-by-sentence typed answer with a letter-count hint, Immediate vs. End-of-Set feedback toggle

### Accessibility + branding pass ✅ COMPLETED
- Font size (A-/A+) and the standard 5-color text palette added as optional props on `PracticeSessionShell` (`fontSizeIdx`/`onFontIncrease`/`onFontDecrease`, `textColor`/`onTextColorChange`) — each drill owns its own state and SIZES arrays, shell just renders the shared control UI when the props are passed. Read and Complete / Interactive Reading will inherit this for free once built on the shell.
- Owl mascot watermark (amber, not Duolingo green) behind every DET screen, inline SVG, static/no API cost. Went through two redesigns: v1 used shapes filled with the exact shell background color to fake "eye cutouts", which broke visibly wherever real content with its own translucent background (e.g. the Fill in the Blanks input box) happened to render on top of it; v2 removed the cutouts but made the face barely visible (eyes were only a slightly lighter amber than the body); v3 (current) adds a genuinely lighter face disc, white eyes with dark pupils + eye-shine, opacity bumped 0.14 → 0.20 — reads clearly as an owl while staying subtle enough not to affect text legibility at any of the 5 text colors.

### Read and Select fixes ✅ COMPLETED
- Font/color controls originally only wired to the drilling grid, not the difficulty/timer/set-select screen — fixed so both screens respect them
- Added Easy/Medium/Hard difficulty tabs above the set list (filters `readSelectSets` by the `difficulty` field)

### Content ✅ ongoing (see content strategy below)
- Read and Select: 12 sets total, 4 per difficulty tier (was 1 per tier) — set-select buttons read "Set 1/2/3/4" rather than repeating the difficulty label, since with 4 sets per tier the old `{difficulty} · {n} words` label was identical on every button in a tab
- Fill in the Blanks: 20 items (was 6) — added connector/function-word items (and, but, if, so, because, although) alongside the original content-word items, then dedicated easy (when, or, with, after) and hard (meticulous, ambiguous, resilient, unprecedented) batches since it previously had no real easy/hard spread. Added an All/Easy/Medium/Hard tab row on the intro screen; a session snapshots its filtered item list into state at `start()` so results/progress stay correct regardless of which tab was picked, rather than re-deriving from the difficulty each render.
- Fill in the Blanks "💡 Hint" button — click to progressively reveal one more letter of the target word at a time; reveal count is computed from `target.length`, not a fixed string, so it works for any word and caps out (button disappears) once fully revealed. Resets each time the drill advances to a new sentence.

**Content strategy:** all content is static hand-authored JSON, no database, no API calls at runtime. Decided with the user on 2026-07-31 to keep manually batch-adding content on request rather than building the content-authoring helper the original roadmap doc flagged for Phase 1, or wiring up live Claude-API generation like the other 14 activity templates — revisit once all 4 Part A templates are built and real usage volume with the student is known.

### Phase 3 — Read and Complete + Interactive Reading ✅ COMPLETED
- `components/det/ReadCompleteDrill.jsx` — same select → drilling pattern as the other drills. Paragraph text stores blanks as `{{n}}` markers; `parseParagraph()` splits on a regex into text/blank segments and renders each blank as an inline native `<select>` (submit-all-then-reveal, per the roadmap spec) styled to sit inline with the sentence text. On reveal, each `<select>` is replaced by a colored span (green/red) showing the chosen word, with the correct answer shown inline next to wrong ones. `<option>` elements get explicit `text-black bg-white` classes — native dropdown popups don't reliably inherit the dark theme's text color across browsers.
- `components/det/InteractiveReadingDrill.jsx` — split-screen layout (passage left ~46%, task pane right), reusing the same passage/statement split pattern as `TrueFalseActivity`/the Presentation tool's Phase L4 layout. One shared `TaskPanel` renders all 5 sub-task types: `complete_sentence` and `complete_passage` reuse an options-button-list pattern (`complete_passage`'s blank appears inline in the passage, masked via a regex replace of `maskedWord` in the target sentence — escaped in case future content includes regex special characters); `identify_idea`/`title_passage` show full-sentence option cards; `highlight_answer` has no options at all — the student clicks a sentence directly in the passage panel (the roadmap's "click-a-sentence" option, chosen over text-selection as the simpler build). Each task commits and reveals immediately on click/selection (no separate submit step, unlike Read and Complete) since each sub-task is a single choice. Progress shown via the shell's `progressLabel` as "Task X of 5"; results screen lists all 5 task labels with correct/missed status.
- Both new drills inherit font-size/color controls and the owl watermark for free via `PracticeSessionShell` — no extra wiring needed, confirming the Phase 2 accessibility pass generalizes cleanly to different content shapes (inline dropdowns, split-screen).
- `DetPracticePage.jsx` simplified — the `PLACEHOLDER_TYPE_INFO` data-driven summary shell is gone; `:type` now maps straight to one of the 4 real drill components via a `DRILLS` lookup object, with "unknown practice type" as the only remaining fallback case.
- Verified with the same temporary-QA-user + Playwright pattern as Phases 1–2: Read and Complete answered all 4 blanks correctly (4/4) then "Choose Another Paragraph" back-nav; Interactive Reading answered 4 of 5 tasks correctly and 1 deliberately wrong (title_passage) to confirm scoring isn't hardcoded (4/5, matching per-task `correct` tracking) — screenshots also confirmed the split-screen layout, masked-word highlighting, and click-to-highlight sentence interaction all render correctly. Zero console/page errors.

### Content batch 2 ✅ COMPLETED
- Discussed content-sourcing options now that all 4 Part A templates exist (see content strategy above); decided to keep hand-authoring by request rather than build the authoring helper or wire up live API generation, at least for now.
- Read and Select: +9 sets, 3 per difficulty tier (12 → 21 total, 7 per tier)
- Fill in the Blanks: +10 items (20 → 30) — 6 medium connectors (however, whereas, unless, despite, though, since) and 4 hard C1 vocab words (exacerbate, reconcile, innocuous, audacious), specifically to balance the medium tier which had fallen behind easy/hard in the first batch
- Read and Complete: +2 paragraphs (2 → 4)
- Interactive Reading: +1 passage with all 5 sub-task types (1 → 2)
- **Bug found and fixed while verifying the batch**: all three "choose a set" select screens (`ReadSelectDrill`, `ReadCompleteDrill`, `InteractiveReadingDrill`) combined `items-center` with `overflow-y-auto` on the scroll container. That combination is a real CSS trap — when content overflows, flexbox centers it by pushing the excess equally above and below, but `scrollTop` can't go negative, so the top portion becomes permanently unreachable no matter how far you scroll. This was invisible with ≤4 sets per screen but broke Read and Select's difficulty tabs the moment a tier reached 7 sets (they rendered *underneath* the fixed header, unclickable). Fixed by dropping `items-center`/`justify-center` in favor of a top-aligned `overflow-y-auto` container with the inner list centered via `mx-auto` instead — applied to all three select screens since the same growth pattern will keep hitting the other two as their content batches grow.

### Part B — Speaking Practice (IN PROGRESS)

**Explicit user direction (2026-07-31), overriding the roadmap doc's Phase 5 spec:** no timers, anywhere, at all — not even a silent read-time countdown. The roadmap originally called for a shared read-time/speak-time timer component; the user was clear that removing time pressure is the entire point of practicing with this tool instead of the real DET app, and it needs to feel smooth, not like a countdown simulator. Resolved via `AskUserQuestion` that the read → speak transition should still be a **manual two-step reveal** (teacher clicks a plain button when the student's ready — no numbers) rather than everything being visible at once with no phase at all.

#### Phase 5 + 6a — Shared speaking engine + Read, Then Speak ✅ COMPLETED
- `components/det/SpeakingPromptDrill.jsx` — the shared engine all speaking types will reuse (this *is* Phase 5's "shared component," just clock-free). Per item: `prep` (optional, `{ type: 'text'|'photo', content }`) shown first if present, with a plain reveal button (label configurable, default "Ready to Speak →") that swaps to the `prompt` view — no countdown, no auto-advance, ever. Items with no `prep` skip straight to their prompt. A "← Re-read" link on the prompt view lets the teacher flip back to the prep content without losing their place in the sequence (index unchanged, only `phase` toggles) — a deliberate low-pressure touch, not in the original spec. No scoring or correctness tracking at all (matches the roadmap's "no DET scoring, ever" rule) — the end-of-set screen just says "no score to review here, talk through how it went," with Start Again / Back to DET Practice.
- `components/det/ReadThenSpeakDrill.jsx` — thin wrapper passing `readThenSpeak.json` + labels into the shared engine, mirroring the `DrillLoop` → `MinimalPairsDrill`/`EdEndingsDrill` split from the Pronunciation feature. The pattern is meant to be reused as-is for Speak About the Photo and Interactive Speaking later — just different data and label props, no changes to `SpeakingPromptDrill` itself expected.
- `data/det/readThenSpeak.json` — 5 hand-authored prompts spanning the real sub-styles of this DET task (opinion statement to agree/disagree with, a casual message to reply to, a short article snippet to react to, an announcement to explain to a neighbor, another opinion prompt) — all `type: "text"` prep, no photos needed for this type.
- `UploadPage.jsx`'s `DetPracticeLauncher` now has two sections under the DET Practice tab: the existing 4 Part A buttons, and a new "Speaking practice" row (currently just Read, Then Speak) with its own copy line making the no-timer/no-recording design explicit to the teacher up front.
- Verified with the same temp-QA-user + Playwright pattern as Part A, plus an explicit assertion that no timer/countdown/seconds-style text appears anywhere on either the prep or prompt screen. Re-read preserves position; Next/Finish reaches a real end-of-set screen after all 5 prompts; Start Again resets to prompt 1; Back returns to the DET tab. Zero console/page errors.

#### Not yet built
- **Speak About the Photo** — `SpeakingPromptDrill` already supports `prep.type: 'photo'` (renders an `<img>`, shrinks and dims it into the prompt view too), but there's no photo bank yet. Checked the untracked `Background_Pics/` folder in the repo root as a possible source — it's only 3 unrelated Unsplash images left over from earlier theme-background work, not curated "describe this photo" scene content and not nearly enough volume. Needs a real decision on sourcing (teacher-supplied photos dropped into a `public/` folder vs. some other source) before this type can get real content — open question for the user, not decided here.
- **Interactive Speaking** — chained sequence of 6–8 prompts per the roadmap, likely mixing photo and text prep; blocked on the same photo-sourcing question above if it's meant to include photo prompts, though a text-only version could be built sooner using the same `SpeakingPromptDrill` engine with a longer `items` array.
