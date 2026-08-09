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

#### Phase 6b — Speak About the Photo ✅ COMPLETED
- **Photo sourcing decided:** one-off Unsplash fetch script (`scripts/fetch-det-photos.mjs`), same architectural pattern as Pronunciation's `fetch-wikimedia-phonemes.mjs` — search + download once as content prep, self-host the results, no live API calls at runtime. `UNSPLASH_ACCESS_KEY` was already configured (used for activity backgrounds), so no new setup needed.
- **Content-fit issue caught before fetching:** Unsplash's top results skew toward moody, minimal, single-subject shots — the opposite of what a "describe this photo" task needs (a busy scene with several things happening, enough to talk about for 30–45 seconds). Fixed by phrasing search queries as full scenes ("family cooking kitchen together", "busy street market vendors") rather than single nouns.
- Two-phase script flow: `candidates` mode searches 8 scene queries (kitchen, market, office, playground, picnic, train station, dinner table, classroom) × 5 results, downloads small previews into a scratch review folder + a `candidates.json` metadata manifest; each of the 40 candidates was visually reviewed one at a time before deciding what to keep (rejected: aerial/too-zoomed-out shots where individual actions aren't readable, single-subject shots with nothing to describe, poorly-lit/backlit shots where faces aren't visible, near-duplicate shots from the same photographer/scene). `finalize` mode downloads full-res versions of the 27 keepers into `public/images/det-photos/`, pings Unsplash's `download_location` endpoint per their API guidelines (photographer attribution/stats), and writes a manifest recording each photographer's name + profile link.
- `data/det/speakAboutPhoto.json` — 27 items, one per kept photo, each with a `prep: { type: 'photo', content: '/images/det-photos/{key}.jpg' }` and a description prompt (varied phrasing, but all asking to describe people/actions/setting — matches the real DET task's instruction, which doesn't vary much prompt-to-prompt either).
- `components/det/SpeakAboutPhotoDrill.jsx` — thin wrapper around `SpeakingPromptDrill`, identical pattern to `ReadThenSpeakDrill`. `SpeakingPromptDrill`'s existing `prep.type: 'photo'` branch (built in Phase 5 but unused until now) needed no changes; only addition was a `backToPrepLabel` prop so this type's re-reveal link reads "← Look again" instead of the text-prep wrapper's hardcoded "← Re-read".
- Verified with the same temp-QA-user + Playwright pattern: asserted the rendered `<img>` has real `naturalWidth`/`naturalHeight` (not a broken image), no failed image network requests, no timer-like text anywhere, "Look again" preserves position, and clicked through all 27 items to a real end-of-set screen. Zero console/page errors.

#### Phase 7 — Interactive Speaking ✅ COMPLETED
- Roadmap called for a "chained sequence of 6–8 prompts." Real DET Interactive Speaking is one continuous mini-conversation (a scenario plus several sequential follow-up questions), not several independent turns — so unlike the other two speaking types, this one is a single 7-item scenario chain (a neighbor asking for help pet-sitting, escalating through logistics, a problem, and a wrap-up reflection), not a flat bank of unrelated prompts.
- **Deliberately no `prep` field on any item.** Each prompt is self-contained (repeats enough context to stand alone), so `SpeakingPromptDrill` — whose `phase` already defaults to `'prompt'` when an item has no `prep` — lands straight on every question with zero reveal clicks between them. No engine changes needed; this fell out of behavior that already existed for Phase 5. Considered the alternative (repeat the same prep on every chained item, matching the roadmap's literal "each running its own read/speak cycle" wording) but rejected it — an extra "Ready to Speak" click before every follow-up would work against the whole point of Part B being frictionless, and DET's real Interactive Speaking doesn't have a silent pause between its sub-questions either.
- `components/det/InteractiveSpeakingDrill.jsx` — same thin-wrapper pattern as the other two speaking types, just passing `interactiveSpeaking.json`'s 7 items straight through with no extra label props (no prep means no reveal-button/back-to-prep labels are ever rendered).
- Verified with the same temp-QA-user + Playwright pattern, plus an explicit assertion that a "Ready to Speak" reveal button never appears on any of the 7 items — confirming the no-friction chain actually behaves as designed, not just in theory.

**Part B (speaking practice) is now complete** — Read Then Speak, Speak About the Photo, and Interactive Speaking are all shipped, all with zero timers anywhere. This closes out the DET Practice Mode roadmap end to end (all 7 question types from the original scope guard are now built).

#### Speaking content batch 2 ✅ COMPLETED
- Read Then Speak: +5 prompts (5 → 10) — same opinion/message-reply/article-reaction/announcement/opinion sub-style spread as batch 1, fresh topics (office attendance mandate, a casual reschedule reply, a post-meal-walk study, a gym renovation notice, teen social media use).
- Interactive Speaking: +1 scenario ("Covering for a Colleague", 7 questions), alongside the original "Looking After a Neighbor's Cat" — a professional-register chain to contrast the first scenario's casual/personal one.
- **Restructured `interactiveSpeaking.json`** from a flat item array into `[{ title, items }]` now that a second chain existed — appending scenario 2's items directly onto scenario 1's flat list would have meant the questions silently jumped topic mid-session with no visual break.
- **`InteractiveSpeakingDrill.jsx` gained its own scenario-select screen**, same select-then-drill pattern as the Part A templates (own `PracticeSessionShell` instance, a card per scenario showing title + question count). Once a scenario is chosen it renders `SpeakingPromptDrill` for that scenario's items.
- **`SpeakingPromptDrill` gained two small backward-compatible props**: `onBack` (override for the header's Back button and the end-of-set screen's secondary button, so a scenario-owning wrapper can route "back" to its own select screen instead of exiting straight to the DET tab) and `doneSecondaryLabel` (so that same button can read "Choose Another Scenario" instead of the default "Back to DET Practice"). Neither `ReadThenSpeakDrill` nor `SpeakAboutPhotoDrill` pass these — their existing single-exit behavior is unchanged.
- Verified with the usual temp-QA-user + Playwright pattern, including the two-level back navigation this introduced (mid-scenario → scenario-select → DET tab) and re-confirming Interactive Speaking's prep-less chained items still never show a reveal step, even across two different scenarios.

### Content batch 3 ✅ COMPLETED

- Read and Select: +9 sets, 3 per difficulty tier (21 → 30 total, 10 per tier)
- Fill in the Blanks: +10 items (30 → 40)
- Read and Complete: +2 paragraphs (4 → 6)
- Interactive Reading: +1 passage (2 → 3)
- Read Then Speak: +5 prompts (10 → 15)
- Interactive Speaking: +1 scenario ("Helping a Friend Move Apartments", 2 → 3 scenarios)
- Speak About the Photo deliberately excluded from this batch — confirmed with the teacher it doesn't need more content yet.
- **First use of parallel subagents for content authoring**, after trying subagents for market research (three-test proficiency-exam comparison, kept separate from the DET roadmap — see `ProficiencyTestsComparison.md`). One subagent per content type, each given the existing schema plus a "do not reuse" list of words/topics already in that file, writing via Read + a single Edit inserting before the closing `]` rather than a full-file rewrite. All 6 ran concurrently, 20–80s each. Verified centrally afterward (Node `JSON.parse` + entry-count check across all 6 files, plus a manual read-through of the trickiest schemas — Read and Complete's word-form blanks and Interactive Reading's index-based masked-word/highlight-sentence tasks) rather than trusting each subagent's self-reported summary.

### Vocabulary Practice — 8th template ✅ COMPLETED

- Added as an 8th DET Practice type at the teacher's request, mainly for launcher-screen symmetry ("7 feels off, even numbers align better") with an explicit ask to keep it low-build given the monetization roadmap (Phase 11) — cautious about scope creep before the app has paying users.
- Two other 8th-template candidates were considered and rejected first: **Write About the Photo** (rejected outright — the app is used live on a Zoom screen-share, so the student has no way to produce visible written output the teacher can see) and a full **Listening** template (real value acknowledged — it fits the Zoom setup better than writing does, since it's play-or-read-aloud plus a spoken/clicked answer — but deferred since it needs actual audio production per item, not just JSON, a bigger lift than anything else built so far).
- `resources/js/components/det/VocabPracticeDrill.jsx` — word shown large, 4 definition multiple-choice options, click-only (no audio, no typing). Built on `PracticeSessionShell` like every other Part A drill, rather than reusing Pronunciation's `DrillLoop.jsx` — `DrillLoop` is shaped around an audio-play button and short IPA-style choices, which didn't fit a text-word-then-long-definition layout, so the index/score/status/auto-advance state machine was reimplemented inline instead (small enough not to be worth a shared abstraction).
- `resources/js/data/det/vocabPractice.json` — 30 words (15 medium / 15 hard), deliberately **reinforcement, not new vocabulary**: every word is reused from the "medium"/"hard" tiers already seeded in `readSelect.json` and `fillBlank.json`, each with a fresh original definition + 3 non-overlapping distractors. No "easy" tier — those words don't need a reinforcement drill.
- `UploadPage.jsx`'s `DetPracticeLauncher` — initially added as its own standalone full-width-button section between the Part A grid and the Speaking section; moved into the Speaking grid as its 4th button per explicit follow-up request, giving two clean 2×2 grids (Part A: 4 reading/vocab drills, Part B: 3 speaking + Vocabulary Practice) instead of a 4 + 1 + 3 layout.
- Verified with the usual temp-QA-user + Playwright pattern: launcher button navigates correctly, both difficulty tiers list with correct word counts, a full 12-item session answered with random choices (2/12 correct — confirms scoring isn't hardcoded), both green-correct and red-wrong flash states confirmed via screenshot, results screen and both "Practice Again"/"Choose Another Difficulty" exits work. Zero console/page errors.

---

## 14. Phase O — Reading Text Tool ✅ COMPLETED

**Goal:** replace the document-based Grammar Explainer activity type with a standalone reading-text generator — the Grammar use case was already superseded by the topic-based Presentation tool (Phase L2), so a document-based "Grammar" button was redundant. Same architecture as Presentation: no PDF/document required, teacher supplies a topic (plus optional target vocabulary and paragraph count), Claude writes a passage directly.

- **Removed `grammar_explainer` from the document-based generation flow**: dropped from `ActivityController::generate()`'s validation `in:` list and match arm, dropped from `GeneratePage.jsx`'s `ACTIVITY_TYPES`/`DEFAULT_PROMPTS`, dropped from `SavedActivityController::store()`'s validator (no new ones can be created or saved going forward). `ClaudeService::generateGrammarExplainer()`/`buildGrammarExplainerPrompt()` deleted as dead code.
- **Legacy saved `grammar_explainer` activities still work** — deliberately left the render branches in `GeneratePage.jsx` and `LibraryPage.jsx` (`GrammarExplainerActivity`, shared with `presentation`) and its entries in `LibraryPage.jsx`'s `TYPE_LABELS`/`TYPE_COLORS`/`TYPE_FILTERS` untouched, so any already-saved Grammar activities in a teacher's library still relaunch correctly — only the generation entry point was removed, not the ability to view/replay what already exists.
- **New type `reading_text`**: `{ type, topic, keyword, paragraphs: string[], vocabulary: [{word, definition}] }`. `ClaudeService::generateReadingText()` + `buildReadingTextPrompt()` — if the teacher supplies target vocabulary, the prompt requires every word to be used naturally at least once; if left blank, Claude self-selects 6–10 useful words from the text it writes. Every `vocabulary[].word` is required (by prompt instruction) to appear verbatim in the paragraph text, since the frontend highlights by exact string match.
- **`resources/js/components/ReadingTextActivity.jsx`** (new) — fullscreen overlay, same chrome pattern as other activities (A-/A+ 5-step font control, standard 5-color palette, Save, Fullscreen, Close). No scoring, no pagination — the whole passage renders in one scrollable card since the point is reading practice, not quizzing.
  - **Inline vocabulary highlighting**: `highlightVocab()` builds a single case-insensitive regex alternation from all glossary words (longest-first, to avoid a short word matching inside a longer phrase), splits each paragraph on it, and wraps matches in `font-bold underline decoration-amber-400` — deliberately not a background/text-color change, so the highlight stays visible regardless of which of the 5 standard text colors the teacher has picked.
  - **Glossary panel** — compact word/definition list below the passage, toggleable via a "Hide vocabulary" / "Show vocabulary" button (`V` key), same show/hide-a-panel pattern as True/False's Phase-current options toggle — hiding it lets the passage reclaim the full card height.
  - **PDF export** — reuses the `window.print()` + hidden print-only DOM pattern from `GrammarExplainerActivity` (Phase L3), but deliberately **light/white-themed** rather than matching the app's dark navy in-app theme: this view is meant to be handed to a student as a printable worksheet, so ink-friendly white background + black text was the right call here even though it diverges from Presentation's print styling. New `.read-print-*` CSS classes in `app.css`, natural multi-page flow (no forced page-break-per-paragraph, unlike Presentation's one-slide-per-page print rules) since it's one continuous document, not a deck.
- **`UploadPage.jsx`** — new `ReadingTextGenerator` component (topic, optional comma-separated target vocabulary, paragraph-count pills 1–6, optional extra instructions) and a new "📖 Reading Text" tab, placed immediately after "🎞 Presentation" per explicit request. `POST /api/reading/generate` → `ActivityController::generateReadingText()`.
- Verified with the usual temp-QA-user + Playwright pattern: generated via the real form (mocked `/api/generate` response), confirmed vocabulary words render highlighted inline, confirmed the vocabulary toggle and font-size controls both work, confirmed the print view renders correctly under `page.emulateMedia({ media: 'print' })` (light background, underlined vocab, glossary section), and confirmed the "Grammar" button no longer appears anywhere in the document-based Activity Type list. Zero console/page errors.
- One false alarm during QA: an early screenshot showed the navbar bleeding through the activity's fullscreen header. Root cause was the *test*, not the code — the background image is a real (unmocked) Unsplash network fetch, and the screenshot was taken before it finished loading, leaving the fixed overlay's background transparent for a moment. Waiting for the image to actually paint before screenshotting resolved it; not a real stacking/z-index bug.

---

## 15. Phase P — Shell Styling Overhaul ✅ COMPLETED

**Goal:** Library/Generate/Upload used a "glass" look (translucent white panels + `backdrop-blur` over a full-page photo) that the activity templates never had. The teacher found it hard to read and unprofessional-looking next to the templates' solid `#1a1a2e` cards. Fixed by keeping the photo (the teacher explicitly wanted it — see the design journey below) but making every text-bearing surface effectively opaque, so contrast no longer depends on what happens to be behind it.

### Workflow — mock up in an Artifact before touching real code
A prior styling attempt had been expensive (lots of live tweak → rebuild → screenshot → look → repeat rounds). This time, the whole visual-direction exploration happened in a single self-contained HTML **Artifact** (published once, then repeatedly edited/republished at the same URL) mocking up Library's real layout — filter pills, card grid, badges — with a button row to switch live between candidate backgrounds. This meant:
- No dev server, no build, no screenshot round-trip needed while exploring — the teacher looked at the artifact directly in their own browser and gave feedback in plain language ("still too bland," "cards too dark").
- Went through ~6 iterations (solid navy → darkened photo → warm hero band → warm corner glow → full photo with opaque cards → lighter/warmer opaque cards) entirely inside the artifact before a single line of the real app changed.
- Only once a direction was picked did implementation happen in the real codebase, verified with one real screenshot pass (plus a second pass after catching the issue below) — not an iterate-in-the-dark loop.
- **Recommended pattern for any future visual/layout decision on this project**: mock it up as an artifact first, converge there, implement once.

### What shipped
- **One warm photo across all three pages** instead of three unrelated moods. The three existing per-route background photos turned out to vary wildly in suitability — `pic4.jpg` (a warm desk/coffee/notebook scene) was a great fit already, but `upload.jpg` (a dictionary close-up) and `generate.jpg` (scattered word tiles) were busy, monochrome, and not remotely warm. Rather than source new photos, all three routes (`/upload`, `/generate`, `/library`) now use `pic4.jpg` via `Layout.jsx`'s `PAGE_BACKGROUNDS` map, for one consistent identity. (`/` still uses `pic1.jpg`, untouched — out of scope.)
- **Four shared CSS classes in `resources/css/app.css`** (bottom of file) — tune values here, not per-page, since they're used across Library/Generate/Upload/Layout:
  - `.lg-surface` (+ `.lg-surface-hover`) — the "card" treatment: ~88% opaque warm-brown (`rgba(76,60,49,.88)`), `blur(28px) saturate(1.25) brightness(1.22)`. Used for anything content-bearing: Library's saved-activity cards, Generate's settings panel, Upload's dropzones and DET/Pronunciation launcher buttons.
  - `.lg-chip` (+ `.lg-chip-hover`) — lighter-footprint version for small controls (tabs, filter pills, text inputs) that still sit directly on the photo: `rgba(28,22,18,.62)` + `blur(18px) saturate(1.2) brightness(1.1)`.
  - `.lg-shell-overlay` — replaces the old flat `bg-black/40` full-page wash on `Layout.jsx`'s background div; now a light top-only fade (`rgba(8,6,4,.4)` at top → `~.05` by 200px down), since surfaces now carry the contrast guarantee, not a page-wide dark wash.
  - `.lg-shell-text` — text-shadow (a tight dark layer + a soft wide one) for headings/captions that sit directly on the photo with no card behind them (page titles, the Library empty-state message, DET/Pronunciation launcher subtitles).
- **Important lesson, worth remembering before reusing this pattern**: the first pass at `.lg-chip` used a *light/white*-tinted glass (`rgba(255,255,255,.1)`), copied from what looked fine in the artifact mockup. In the real app it was nearly invisible — `pic4.jpg` has a very bright laptop-screen region, and white-on-white has no contrast no matter how you blend it. The artifact's CSS-simulated placeholder photo never had that much dynamic range, so the problem only showed up once real screenshots were taken against the real photo. Fixed by making `.lg-chip` **dark**-tinted like `.lg-surface`, just lighter/smaller. General rule going forward: any surface meant to guarantee text contrast against an unpredictable photo must be dark and sufficiently opaque itself — never rely on a light/white translucent tint, since it only works against a backdrop you already know is dark.
- **Known accepted rough edge**: the small caption line under the DET Practice launcher ("no scoring, teacher-controlled pace...") is still a little weak specifically where it crosses the brightest part of `pic4.jpg`'s laptop screen — legible, not perfectly crisp. Left as-is by explicit decision rather than pushing `.lg-shell-text`'s shadow further (diminishing returns, starts looking muddy). If it needs fixing later, wrap that specific line in a thin `.lg-chip` strip rather than strengthening the shadow further.
- Verified via the usual temp-QA-user + Playwright pattern across all three pages plus the DET sub-tab, zero console errors, screenshots confirmed every card/button/pill reads clearly against the photo.

---

## 16. Phase Q — Cambridge Practice Mode (IN PROGRESS)

**Goal:** Cambridge English (B2 First / C1 Advanced) practice, teacher-run live in Zoom, following the DET Practice Mode precedent exactly — no scoring engine claiming a real Cambridge score, no recording, no official branding, original content only. Full spec in `CambridgePracticeMode.md`; validated by a real beta teacher licensed to administer Cambridge exams in schools. Research behind the doc is in `CambridgeResearch.md`.

**Scope decisions confirmed before building** (via `AskUserQuestion`): defer the two genuinely-new components (Gapped Text, C1's Cross-Text Multiple Matching) rather than build them for v1; give it its own "🎓 Cambridge" tab in `UploadPage.jsx` rather than folding into DET's already-full launcher; build **B2 First content only** for this first pass, C1 Advanced later once B2 is validated with real students.

### Phase 1 — Reading and Use of English ✅ COMPLETED (B2 First, 6 of 7 parts)

- `resources/js/data/cambridge/b2/{wordFormation,keyWordTransformation,mcCloze,openCloze,mcReading,multipleMatching}.json` — 2 sets per part, hand-authored (not subagent-batched — this is the initial build, subagents are for refill batches once real usage shows what's running low, per the DET precedent).
- **Six new drill components** in `resources/js/components/cambridge/`, all built on DET's `PracticeSessionShell` (not the older Claude-generated activity templates like `WordFormationActivity`/`SentenceTransformationActivity`/`ClozeActivity`/`MatchingPairsActivity`) — a deliberate departure from the roadmap doc's literal "reuse as-is" wording for Word Formation and Key Word Transformation. Those two templates have their own chrome (Save panel, Unsplash background fetch) that doesn't match `PracticeSessionShell`'s flat-navy DET look; building thin `PracticeSessionShell`-based wrappers instead (still copying their exact reveal-per-item interaction pattern) keeps all of Cambridge Practice Mode visually consistent with itself and with DET, at effectively the same build cost.
  - `WordFormationDrill.jsx` / `KeyWordTransformationDrill.jsx` — select-a-set screen, then per-item reveal (root+gapped sentence+word class / original+key word+stem+answer), Prev/Reveal/Next, mirroring the original templates' interaction exactly, just re-homed onto the shell.
  - `McClozeDrill.jsx` — passage with numbered gaps, each gap a native `<select>` with exactly 4 options (A–D); submit-all-then-reveal. Directly adapted from DET's `ReadCompleteDrill` — the shape (paragraph + inline dropdown blanks) turned out to be identical to Cambridge's multiple-choice cloze, so `parseParagraph()`/`InlineBlank` were copied over unchanged.
  - `OpenClozeDrill.jsx` — same paragraph/blank shape as `McClozeDrill`, but each blank is a free-text `<input>` normalized/compared like DET's `FillBlankDrill` (trim + lowercase) instead of a dropdown, since Cambridge's open cloze has no options.
  - `McReadingDrill.jsx` — split-screen passage (left) / one-question-at-a-time options (right), copied from DET's `InteractiveReadingDrill` task-by-task pattern but simplified to a single flat `questions[]` array with `answerIndex` instead of five different task-type shapes.
  - `MultipleMatchingDrill.jsx` — same split-screen pattern, but the left panel shows several lettered short texts (A/B/C/D…) instead of one continuous passage, and each question is answered by clicking a letter button rather than an options list — the real B2 First Part 7 shape (~8 questions, each answered by one of ~4 texts, texts can each answer more than one question).
- `CambridgePracticePage.jsx` — same `:type` → component lookup pattern as `DetPracticePage.jsx`; route `/cambridge/practice/:type` added in `App.jsx`.
- `UploadPage.jsx` — new `CambridgePracticeLauncher` + "🎓 Cambridge" tab (rose accent), same one-`lg-surface`-button-grid pattern as `DetPracticeLauncher`. Back navigation from every drill returns to `/upload` with `{ state: { tab: 'cambridge' } }`, exactly like DET's `tab: 'det'` convention.
- Verified with the usual temp-QA-user + Playwright pattern: all 6 drills played through end-to-end (Word Formation/Key Word Transformation reveal correctly; MC Cloze and Open Cloze both submit and show a real score; MC Reading and Multiple Matching both reach a results screen with a score that isn't hardcoded — confirmed by clicking non-optimal answers and seeing a partial score, e.g. 0/5 and 2/8). Zero console/page errors.
- **Deferred for later**: Gapped Text (B2 Part 6 / C1 Part 7) and Cross-Text Multiple Matching (C1 Part 6 only) — both need genuinely new components, per the open questions already resolved above. Also deferred: C1 Advanced content for all 6 shipped parts, and Phases 2–4 (Writing, Speaking, Listening) from `CambridgePracticeMode.md`.

### Content batch 1 + explicit level labeling ✅ COMPLETED

- Every set across all 6 B2 First data files now carries an explicit `"level": "B2 First"` field (retrofitted onto the original 2 sets per part, and required of every subagent-authored set since), and every drill's `PracticeSessionShell` title now reads e.g. "Word Formation — B2 First" instead of just "Word Formation" — done specifically so C1 Advanced content can be added later (same part, same component, different level) without the UI or data becoming ambiguous about which level a set belongs to.
- **First use of the parallel-subagent content-authoring workflow (proven on DET) for Cambridge**: one subagent per part (6 total, run concurrently), each given the existing schema, existing content to avoid duplicating, and an explicit reminder that this is original content in the exam's format — never copied past-paper text. Each added exactly 3 new sets, taking every part from 2 → 5 sets. All 6 finished in 52–160s each.
- Verified centrally afterward (not just trusting each subagent's self-report): `JSON.parse` + set-count/id check on all 6 files, manual read-through of the two trickiest outputs (Open Cloze's `{{n}}`-marker↔blank-id consistency, Key Word Transformation's stem/answer grammar), then a real build + Playwright pass confirming all 6 select screens render exactly 5 set cards each with the new "B2 First" label visible.
- **Two items flagged by their subagents during self-review, checked and accepted as-is**: Key Word Transformation's `kwt-b2-5` item 6 uses a fronted "Never before had she..." inversion — correct and meaning-preserving, just more advanced than the other items; left in as a legitimately harder item. Four Open Cloze blanks (in `cloze-open-b2-3`/`-4`/`-5`) have a plausible alternative one-word answer alongside the exact string the app checks against (e.g. "for" vs "behind", "which" vs "that") — left as-is rather than rewritten, since this tool is teacher-supervised rather than a strict auto-grader (the teacher can judge a reasonable alternative on the spot); worth keeping in mind if Open Cloze content keeps growing.

### Gapped Text (Part 6) ✅ COMPLETED — the previously-deferred component

- `resources/js/data/cambridge/b2/gappedText.json` — 2 hand-authored sets (id `gap-b2-1`/`gap-b2-2`), each a ~350-word passage with 6 sentences removed (marked `{{n}}` inline, same marker convention as Open/MC Cloze) and 7 lettered replacement sentences (6 correct + 1 narrative-reversal distractor that's grammatically plausible but contradicts the passage's actual outcome — a real Cambridge Gapped Text distractor style, tests whether the student is tracking the story arc, not just local grammar).
- `resources/js/components/cambridge/GappedTextDrill.jsx` — reuses the exact `parseParagraph()`/submit-all-then-reveal pattern from `McClozeDrill`/`OpenClozeDrill`, but each gap is a compact `<select>` listing only the 7 letters (not full sentence text, to keep the passage readable inline) plus a separate always-visible "Removed sentences" reference panel below the passage listing each letter's full text — mirrors the real exam's layout (read all lettered options once, then pick by letter per gap) more closely than embedding full sentences in the dropdowns would have.
- Wired identically to the other 6 parts: `CambridgePracticePage.jsx`'s `DRILLS` map gets `'gapped-text'`, `UploadPage.jsx`'s `CambridgePracticeLauncher` grid gets a 7th button (uneven 2-column grid, same as DET's launcher outgrowing its own even grid earlier).
- Verified via the usual temp-QA-user + Playwright pattern, with one extra check beyond the usual smoke test: answered all 6 gaps with the actually-correct letters (known from the data file) and confirmed the result was exactly 6/6, not a hardcoded or coincidental score — same rigor as DET's "click wrong answers on purpose, confirm the score reflects it" pattern, just inverted (prove a perfect run scores perfect). Zero console/page errors.
- **Split-screen follow-up**: the initial single-column layout (passage, then the "Removed sentences" reference panel, then Submit, all stacked and scrolled together) meant reading a gap's options required scrolling down past the passage and back up — flagged by the teacher immediately. Restructured to the same split-screen pattern as `McReadingDrill`/`InteractiveReadingDrill`: passage in a `md:w-[52%]` left panel, the full reference list of all 7 lettered sentences in a right panel that's visible at the same time, Submit/score pinned below the reference list via `shrink-0`. Re-verified with Playwright (both panel labels visible without scrolling, no page-level horizontal overflow, screenshot check, and the same 6/6-with-correct-answers functional check) — zero console/page errors.
- **Font-size follow-up**: the reference panel's default size (`text-sm`, index 1) read far smaller than the passage's (`text-lg`) at a glance. Both `PARAGRAPH_SIZES` and `REF_SIZES` scales shifted up one Tailwind step (default now `text-xl`/`text-lg`) so both panels are comfortably readable without touching the A+ control.

### Cambridge watermark ✅ COMPLETED — visually distinct from DET's owl

- `PracticeSessionShell.jsx` gained an optional `watermark` prop (`{watermark ?? <OwlWatermark />}`) so different practice modes can supply their own background mascot without forking the shared shell — DET's 8 drills pass nothing and keep the amber owl unchanged (regression-checked via screenshot).
- `resources/js/components/cambridge/CambridgeWatermark.jsx` — a generic academic mortarboard (graduation cap) + open book, in a blue/gold collegiate-gown palette, built entirely from basic SVG primitives (`rect`/`polygon`/`ellipse`/`circle`/`line`), same `opacity-[0.20]` treatment as the owl. Deliberately uses **no Cambridge crest, shield, or wordmark** — those are trademarked; a generic mortarboard-and-book is copyright-safe while still reading as "academic/exam prep" and giving Cambridge Practice Mode its own visual identity distinct from DET's Duolingo-style owl.
- All 7 Cambridge drills (`WordFormationDrill`, `KeyWordTransformationDrill`, `McClozeDrill`, `OpenClozeDrill`, `McReadingDrill`, `MultipleMatchingDrill`, `GappedTextDrill`) now pass `watermark={<CambridgeWatermark />}`.
- Verified via Playwright screenshots on both Cambridge and DET screens — the mortarboard/tassel render clearly and distinctly from the owl, and the DET owl is unchanged. Zero console/page errors.

### Cross-Text Multiple Matching (C1 Advanced, Part 6) ✅ COMPLETED — first C1 content

- **Scope decision (confirmed via `AskUserQuestion`)**: this part is C1-only in the real exam (no B2 equivalent), so building it means introducing C1 Advanced content ahead of the original "validate B2 First with real students before adding C1" plan. Approved as a deliberate one-part exception — the other 6 parts stay B2-only until that validation happens.
- **Turned out to need no new component** — the roadmap doc flagged this as "no existing analog, needs a genuinely new component," but the actual interaction (lettered texts on one side, one question at a time on the other, pick a letter, reveal) is identical to B2's Multiple Matching. Only the *content* differs: Cross-Text questions require comparing opinions across all 4 texts (e.g. "which reviewer, unlike the other three, found the pacing gripping?") rather than finding one detail in one text.
- **Refactored `MultipleMatchingDrill.jsx` into a shared engine**: `resources/js/components/cambridge/TextMatchingDrill.jsx` now holds the actual UI/state machine, taking `sets`/`title`/`selectSubtitle`/`selectIntro` as props. `MultipleMatchingDrill.jsx` (B2) and the new `CrossTextMatchingDrill.jsx` (C1) are now both thin ~10-line wrappers — same pattern as `ReadThenSpeakDrill`/`SpeakAboutPhotoDrill` wrapping DET's `SpeakingPromptDrill`. One addition to the shared engine: a `questionPrefix` field on each data set (defaults to `instruction` if omitted, preserving B2's existing "Which person…" + fragment style unchanged) since C1's questions are full standalone sentences that don't need a prefix.
- `resources/js/data/cambridge/c1/crossTextMatching.json` — first file under a new `c1/` sibling to `b2/`, 2 hand-authored sets ("Four Film Reviews", "Four Fitness Tracker Reviews"), each 4 texts × 4 questions. Content was deliberately built from an explicit opinion matrix per set (which text agrees/disagrees with which on each sub-topic) worked out *before* writing prose, specifically so every answer is genuinely derivable by comparing texts rather than guessable from one.
- **Cambridge launcher split into two labeled sections** (per explicit choice): "B2 First" (7 buttons) and "C1 Advanced" (1 button, with a caption noting it's the only C1 part so far) — mirrors how DET's launcher already splits into labeled sections rather than one flat grid.
- Verified via Playwright: both section headers render, the refactored B2 Multiple Matching still scores correctly (regression check), and Cross-Text Matching scores exactly 4/4 when answered with the actually-correct letters from the data file. Zero console/page errors.

### Phase 3 — Speaking (B2 First) ✅ COMPLETED

- **Launcher label follow-up**: the user pointed out the "(B2 First)" qualifier was already present, just buried in small subtitle text — the "B2 First"/"C1 Advanced" section headers were bumped from `text-sm` to `text-2xl font-bold` so the level division reads as an actual section heading, not a caption.
- Reuses DET's `SpeakingPromptDrill` engine exactly as the roadmap doc called for — zero timers, prep/reveal pattern, teacher paces it live. Two backward-compatible engine additions (DET's existing wrappers are unaffected):
  - A `watermark` prop, forwarded straight through to `PracticeSessionShell`, so Cambridge speaking screens show `CambridgeWatermark` instead of DET's owl.
  - Two new `item.prep.type` variants alongside the existing `'photo'`/text default: `'photos'` (an array of image paths, rendered side by side with "Photo A"/"Photo B" labels — needed for Part 2's compare-two-photographs task) and `'list'` (an intro line + a list of option chips — needed for Part 3's task-card format).
- **Four parts, four thin wrappers**, all under `resources/js/components/cambridge/`:
  - `InterviewDrill.jsx` (Part 1) — same scenario-select-then-chain pattern as DET's `InteractiveSpeakingDrill`; 3 topic sets (Work and Study / Free Time and Hobbies / Hometown and Future Plans), 5 prep-less questions each.
  - `LongTurnDrill.jsx` (Part 2) — flat pool of 6 items, each `prep.type: 'photos'`. **Reused DET's already-sourced, self-hosted photos** (`public/images/det-photos/`, from Phase 6b's Unsplash fetch) instead of sourcing anything new — those 27 photos came in thematic clusters of 2–5 (kitchen, market, office, playground, picnic, dinner table, etc.), so pairing two photos from the *same* theme (e.g. two different kitchen scenes) gives a natural, genuinely comparable pair at zero extra sourcing cost.
  - `CollaborativeDrill.jsx` (Part 3) — flat pool of 5 items, `prep.type: 'list'` (a task intro + 5 option chips, e.g. ideas for a colleague's leaving gift), `prompt` is the "decide together" follow-up. Real Cambridge Part 3 is done with a second candidate; here the teacher plays that role live, same solve already used by DET's Interactive Speaking.
  - `DiscussionDrill.jsx` (Part 4) — single flat set of 8 prep-less broader opinion questions. Deliberately **not** topically linked to the 5 Collaborative Task items (linking them 1:1 would need matched topic pairs across two files) — kept as an independent pool of plausible follow-up-style questions instead, noted here as a known simplification.
- **Launcher restructure**: within the "B2 First" section, added a "Reading & Use of English" sub-label above the existing 7 buttons (retroactively naming what was already there) and a new "Speaking — no timer, no recording, you run it live" sub-label above the 4 new buttons — same nested-section pattern the DET launcher already used for its own Part A / Speaking split.
- Verified via Playwright: all 4 parts reachable and playable end-to-end, Long Turn's paired images confirmed to actually load (`naturalWidth` check, not just present in the DOM) and screenshot-reviewed for a sensible side-by-side layout, Discussion confirmed to skip the reveal step entirely (prep-less chain working as designed), and an explicit regex assertion that no timer/countdown/seconds-style text appears anywhere across all 4 screens. Zero console/page/image-load errors.
- **Cross-Text Multiple Matching (C1 Advanced Part 6 only) remains deferred** — it's C1-only, and C1 content hasn't been started yet per the batch-1 decision to validate B2 First first.
