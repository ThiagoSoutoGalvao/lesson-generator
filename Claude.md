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

Remaining: Phase M3 (routes + page shells), M4 (phonemic chart page), M5 (sound introduction card), M6 (phoneme drill), M7 (-ed endings drill), M8 (polish).
