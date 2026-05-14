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
