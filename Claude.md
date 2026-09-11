# Lesson Generator — Project Brief

> **History lives in `docs/PROJECT_LOG.md`.** This file is the always-loaded brief:
> current state, active work, architecture, and hard-won gotchas. When a phase
> finishes, add its detail to `PROJECT_LOG.md` and update the one-liner here — do
> **not** grow this file back into a changelog (it has a hard size limit).

---

## 1. What it is

A web app for English teachers who teach one-to-one online. The teacher picks a
goal, a format, and a source (a topic, a pasted text, or an uploaded course-book
PDF / audio file); the app generates an interactive classroom activity via the
Claude API, shown fullscreen for Zoom screen-sharing. Activities can be saved to a
library and relaunched.

Built by Thiago (an Aurora teacher). Users: the 5 Aurora beta teachers today;
paying language teachers next (Phase 11). Aurora is also building shared course
tracks ("trilhas") and a student-facing practice mode inside the same app.

**Live:** `https://lesson-generator-production-9da7.up.railway.app`

---

## 2. Stack

- **Frontend:** React + Vite, Tailwind CSS v4 (CSS-first — tokens in
  `resources/css/app.css`, no `tailwind.config`), React Router SPA behind **one
  Laravel catch-all route**. Entry: `resources/js/App.jsx`. Pages:
  `resources/js/pages/` (lowercase filenames). Shadcn/ui for primitives.
- **Backend:** Laravel 11 (PHP 8.4), Laravel Herd locally, MySQL.
- **AI:** Anthropic Claude API (`ClaudeService`, `ANTHROPIC_API_KEY`); OpenAI
  Whisper (`whisper-1`) for audio transcription; OpenAI TTS for pronunciation
  audio (build-time scripts only, not runtime).
- **Auth:** Laravel Breeze, session-based (`SESSION_DRIVER=database` in prod).
  Registration is **closed** (routes removed from `routes/auth.php`).
- **Deploy:** Railway (FrankenPHP via Railpack) + Railway MySQL plugin. See §7.

---

## 3. Development workflow

**Build → test manually → commit → move on.** Never start the next phase without
committing the current one. Commit messages end with the Co-Authored-By /
Claude-Session lines from the session's system reminder; **no** generic
`Co-Authored-By: Claude` line (user preference).

### Verification pattern (used everywhere — match it)
No `chromium-cli` in this environment. Verify UI changes with a **throwaway
Playwright script** (`playwright`, `chromium.launch()`) in `scratchpad/`, driven
through a **temporary QA user created and deleted** in the same run (a standalone
PHP bootstrap script — **not** `php artisan tinker --execute`, which chokes on `@`
in the argument on this Windows/PowerShell setup). Never touch real beta-user
data. Assert **zero console/page errors**; for scored drills, deliberately pick
wrong answers and confirm the score reflects it (proves scoring isn't hardcoded).
Mock `/api/generate` rather than spending API calls. Local dev users:
- teacher `aurora@aurora.test` / `aurora-local-dev` (id 69) — the Aurora shared login
- student `student@aurora.test` / `student-local-dev` (Glow, id 71)

Scratchpad already holds many `qa_*.mjs` scripts to copy from.

---

## 4. Current state

### Activity templates (the `/generate` flow)
`/generate` is a **3-step flow**: pick a **goal** (Vocabulary / Grammar / Reading
/ Speaking) → pick a **format** (that goal's templates, each with a "use this
when…" blurb) → pick a **source** (a topic by default; or an uploaded document +
page range behind a toggle). `GOALS` + `TEMPLATES` config is at the top of
`resources/js/pages/GeneratePage.jsx`. A template's `id` is the picker key;
`type` (defaults to `id`) is what the API/renderer sees — that's how "Error
Correction — sentences" and "— passage" are two cards on one `error_correction`
type.

**15 generatable types:** `quiz`, `flashcards`, `unjumble`, `dialog_gap_fill`,
`word_formation`, `true_false`, `mc_reading`, `odd_one_out`, `cloze`,
`open_cloze`, `mc_cloze`, `read_complete`, `discussion_questions`,
`sentence_transformation`, `error_correction`.

- `image_vocab_match` and `word_categorisation` **have no backend generator** —
  the components + save-validation + library launch branches still exist (saved
  ones relaunch), but you cannot create new ones. `.md` docs mentioning them as
  live are stale.
- `section_focus` (the old Vocabulary/Grammar/Listening/Reading pills) was
  **removed entirely** in Phase T. `detectSections` / `SectionController` /
  `/api/detect-sections` still exist but are unused by the frontend.
- **Presentation** and **Reading Text** are separate tools with their own
  `/upload` tabs and endpoints (`/api/presentation/generate`,
  `/api/reading/generate`) — not part of the `/generate` type list. A line on
  `/generate` points to them.
- `grammar_explainer` was retired (superseded by Presentation). Legacy saved ones
  still render (shared `GrammarExplainerActivity` component); no new ones.

Activity renderer contract: `LibraryPage` / player passes `quiz={...}` for the
quiz type, `activity={...}` for everything else.

### Standalone practice modes (local JSON only — no DB, no runtime API)
- **Pronunciation** (`PronunciationFeature.md`) — **complete.** Phonemic chart +
  7 drills: Phoneme (Minimal Pairs), -ed Endings, Sound Introduction, Word
  Stress, Homophones, Silent Letters. Shared `DrillLoop.jsx` engine. Audio
  self-hosted in `public/audio/pronunciation/` (Wikimedia IPA recordings +
  OpenAI TTS).
- **DET Practice** (`# DET Practice Mode — Feature Roadmap.md`) — **complete**,
  all 7 question types + an 8th (Vocabulary Practice). Part A (reading/vocab) on
  `PracticeSessionShell`; Part B (speaking) on `SpeakingPromptDrill`, **zero
  timers anywhere** (explicit user direction — removing time pressure is the
  point). Amber owl watermark.
- **Cambridge Practice** (`CambridgePracticeMode.md`, research in
  `CambridgeResearch.md`) — B2 First Reading & Use of English (7 parts inc.
  Gapped Text), Speaking (4 parts), Writing (2 parts); C1 Advanced Cross-Text
  Multiple Matching only. All on `PracticeSessionShell` / `SpeakingPromptDrill`.
  Generic mortarboard watermark — **no Cambridge crest/shield/wordmark** (trademarked).
  Content data under `resources/js/data/cambridge/{b2,c1}/`.
  **Deferred:** rest of C1 content; Listening.
  **Rule for all three modes:** original content only, never past-paper text, no
  official branding, no score that claims to be a real exam score.

### Aurora trilha workflow (`trilha_workflow` memory + `trilhas/README.md`)
Aurora's 5 teachers share **one login** (`aurora@lessongenerator.app` in prod)
to build 3 course tracks — **Lights** (8 lessons), **Glow** (8), **Radiant**
(12). Save flow has structured **Trilha + Lesson** fields (`SavePanel.jsx`,
config in `resources/js/lib/trilhas.js`: `TRILHAS`, `TEACHERS`, `TYPE_LABELS`,
`LESSON_SLOTS`, `TRILHA_TOC`, `composeActivityName`). Auto-composed name:
`TRILHA L## · Type · Focus`. `built_by` field recovers attribution on the shared
login. Per-lesson planning is the **in-app brief editor** (`trilha_lesson_briefs`
table, `TrilhaLessonBriefController`, 📝 column in `LibraryPage`'s coverage grid)
— not git files, not the Google Drive.
- `trilhas/README.md`'s Lights status-board topics are **wrong** (copy-pasted
  from Glow). The ToC PDFs in `trilhas/` are the source of truth; `TRILHA_TOC` in
  `trilhas.js` is transcribed from them.

### Aurora Student App (`AuroraStudentApp.md`, `student-app` memory)
Student-facing mode **inside** this app (not separate). Students log in from home,
practise their trilha's activities lesson by lesson, mobile-first. `App.jsx`
branches at module scope on `window.__AURORA_USER__.role` (injected by
`welcome.blade.php`) → `<StudentShell>` vs `<TeacherApp>`. Code in
`resources/js/student/`.
- ✅ **S1** — `role` / `trilha` / `teacher_id` / `is_active` on `users`;
  `StudentController` + `/students` teacher page; `php artisan student:create`.
- ✅ **S2** — `student_visible` on `activities` (default true, no UI);
  `StudentContentController` (`/api/student/lessons`, `/api/student/activities/{id}`)
  — **trilha-filtered, NOT owner-scoped** (students see the shared login's
  library); `Activity::TEACHER_ONLY_TYPES` excluded (`presentation`,
  `reading_text`, `essay_feedback`, `grammar_explainer`); `EnsureTeacher` /
  `EnsureStudent` middleware — **every non-`/me` API route is now role-gated**;
  `StudentActivityPlayer` at `/s/activity/:id`. No scoring yet.
- ✅ **S3** — `activity_attempts` table (student_id, activity_id, nullable
  score/max_score, answers, completed_at) + `POST /api/student/attempts`
  (EnsureStudent + trilha gate); `/api/student/lessons` now returns per-activity
  `done`/`last_score`/`last_max`/`attempts`. `onComplete({score,maxScore})` on
  **8** components — **6 emit a score** (Quiz, True/False, MC Reading, Dialog
  Gap-Fill, MC Cloze, Word Categorisation), **2 record completion only** (Odd One
  Out, Image Vocab Match — no score tracked in those components). Fired once at
  the terminal state; re-fires on replay = new attempt (unlimited retakes, latest
  drives the badge). `StudentActivityPlayer` POSTs + calls
  `reloadStudentLessons()`. Badges on `LessonPage`, `done/total` pill on
  `MyTrilhaPage`. Teacher Library launch never passes `onComplete` — untouched.
- ✅ **S4** — `onComplete` on all remaining templates; every one of the **17**
  student-facing types now records an attempt (no new table/endpoint, reused
  S3's). **Reveal-only** (Cloze, Open Cloze, Read Complete: `revealed.size ===
  totalBlanks`; Word Formation, Sentence Transformation, Error Correction: last
  item revealed — no end screen to key off) → completion, no score. **Discussion
  Questions** has no reveal/finish at all — fires on arriving at the last
  question. **Flashcards** already had a real `finished` (every card "Got It")
  → completion (deck-cycling means no single-pass score). **Unjumble was
  reclassified mid-phase** — its component turns out to track a real score
  (correct-on-first-check) with its own results screen, so it joined the scored
  group like Quiz, not the completion group the roadmap assumed.
- ✅ **S5** — progress dashboards + the two known mobile bugs.
  `App\Services\StudentProgressService::build($student)` is the **one** shared
  builder behind both `GET /api/student/progress` (own trilha) and
  `GET /api/students/{student}/progress` (teacher, own students only) — per-lesson
  done/total + a recent-attempts feed, so the two sides can't disagree.
  `ProgressPage.jsx` (student) shows the stat + a "Trilha complete!" banner;
  `StudentsPage.jsx` (teacher) gets a lazy per-row "View progress" toggle with the
  same numbers + a matching completion nudge. **"Complete" is checked against every
  *configured* lesson** (`TRILHAS[trilha].lessons`), not just lessons that happen
  to have activities yet — resolves Open Question 5 (trilha advancement) as
  **manual**: no auto-move, just both sides pointing at the existing trilha
  dropdown. `TrueFalseActivity`/`McReadingActivity` headers gained `flex-wrap`
  (same fix as Phase M8's navbar) so the ✕ no longer sits off-viewport at 390px.
  `word_categorisation`/`unjumble` touch drag-and-drop turned out to be a
  non-issue — both already have `onClick` placement alongside the HTML5 drag
  handlers; verified tap-only on a touch-emulated context.
- **For a student to see an activity:** `trilha` matches exactly · `trilha_lesson`
  **not null** · type not teacher-only · `student_visible` true · student
  `is_active` and same `trilha`.

### Branding — "Aurora Night" (Phase B, `AuroraBranding.md`)
Shell pages only (`/`, `/upload`, `/generate`, `/library` via `Layout.jsx`, plus
the Breeze login). **Fullscreen activity / drill / practice screens were NOT
touched** — they keep their dark `#1a1a2e` + photo look.
- Ground: `AURORA_GRADIENT` in `Layout.jsx` (deep indigo→violet→coral,
  `background-attachment: fixed`). No more per-route photos.
- Shell tokens in `app.css` (used **only** by Layout / Library / Generate /
  Upload): `.lg-surface` (indigo dark glass), `.lg-chip`, `.lg-shell-overlay`
  (dark veil — carries the contrast guarantee), `.lg-shell-text` (dark halo).
  `.font-display` = Poppins.
- `.lg-surface-soft` is a **separate Pronunciation-only** dark token — tuned to
  `public/backgrounds/pronunciation.jpg`, unrelated to the shell tokens.
- Accent: filled primary buttons = coral `#e0521f` + white text (`#fc6840`
  itself fails white-text contrast); rings / selected-card glow / focus =
  `#fc6840`. Selected goal/format cards use a **light** treatment
  (`bg-[#a01789]/12 border ring`), text stays dark — sidesteps the text-colour
  conflict.
- Login (`guest.blade.php`): scoped `<style>` re-tints the shared Breeze
  `x-input-label` / `x-text-input` components (still used by the authenticated
  profile pages — don't edit those components directly).
- Sunrise (the rejected light direction) is recoverable at git `41818df`.

### Display Panel (Phase D)
`resources/js/hooks/useDisplay.jsx` — `DisplayProvider` (wraps `<App>` inside
`<BrowserRouter>`) + `useDisplay()`. Shared, persisted (`localStorage`
`aurora.display`): text size (0–4, default 2), text colour (Tailwind class),
screen brightness (50–100, a fixed black veil), font (`default` Inter / `system`
/ `poppins` / `lexend`, applied as `data-app-font` on `<html>`).
`DisplayControls.jsx` is a portal popover — `variant="nav"` (navbar) vs
`"activity"` (drill/activity header), `colors={false}` for the two tile games.
- `TEXT_COLORS` (the standard 5: White / Yellow / Orange / Red / Cyan) is now the
  **single source of truth** — exported from `useDisplay`, components stopped
  redefining it. Each activity keeps its own per-layout `*_SIZES` arrays indexed
  by the shared `sizeIdx` (all expanded to 5 steps).
- The Phase I `--tf-family` CSS var is **gone** (font is `data-app-font` now);
  `--tf-size` / `--tf-color` shell scaling stays, still driven by the provider.

---

## 5. Phase 11 — Monetization (ACTIVE, not yet built in code)

**Goal:** first paying customer.

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 10 generations/month, no audio upload, no save |
| **Pro** | $12/month | Unlimited generations, all templates, audio upload, save & library |
| **School** | $49/month | Pro + up to 5 teacher accounts |

### Stripe + Laravel Cashier

```bash
composer require laravel/cashier
php artisan vendor:publish --tag="cashier-migrations"
php artisan migrate
```

`.env`: `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`.

`config/services.php`:
```php
'stripe' => [
    'model'   => App\Models\User::class,
    'key'     => env('STRIPE_KEY'),
    'secret'  => env('STRIPE_SECRET'),
    'webhook' => ['secret' => env('STRIPE_WEBHOOK_SECRET'), 'tolerance' => 300],
],
```

- `User` model: add `use Laravel\Cashier\Billable;`.
- Webhook `POST /stripe/webhook` — must be **CSRF-exempt** in `bootstrap/app.php`.
  Events: `customer.subscription.created/updated/deleted`,
  `invoice.payment_succeeded/failed`.
- Generation counting: `generations_this_month` (int) + `generations_reset_at`
  (date) on `users`. Guard in `ActivityController::generate()`:
  ```php
  if (!$user->subscribed('default') && $user->generations_this_month >= 10) {
      return response()->json(['message' => 'Free limit reached. Upgrade to Pro.'], 403);
  }
  $user->increment('generations_this_month');
  ```
  Reset monthly via a scheduled Artisan command.
- Checkout: `$user->newSubscription('default', 'price_…')->checkout([...])`.
  Billing portal: `$user->redirectToBillingPortal(route('home'))`.

### To build
- **Upgrade modal** at the 10-generation limit.
- **Pricing page** (`/pricing`) — 3 tiers, each → Stripe Checkout.
- **Account page** (`/account`) — plan, generations used, next billing date,
  "Manage billing".
- **Navbar badge** — "Free — X/10 generations used" (hidden on Pro).

Groundwork done: beta users asked (willing at $12/mo), Stripe account + Pro/School
products created, Cashier installed + migrated locally, demo recorded, posted to
TEFL groups, `STRIPE_KEY`/`STRIPE_SECRET` on Railway. Marketing:
`docs/phase11-marketing.md`.

**Commit target:** `Phase 11: Stripe + Cashier setup, pricing page, generation limits`

---

## 6. Next after Phase 11

The Aurora Student App roadmap (S1–S5) is **complete**. **S6 (monetization)
is deferred** until real student usage exists (§4). With no student-app phase
queued, next is either resuming **Phase 11** itself, or whatever real usage
from the beta teachers/students surfaces first — check with the user before
starting new work here.

---

## 7. Deployment (Railway)

- **Start command:**
  `php artisan migrate --force && php artisan queue:work --tries=3 --timeout=300 & /start-container.sh`
  — queue worker runs **in the same container** as the web server (inter-container
  filesystem isolation otherwise breaks it).
- `bootstrap/app.php` — `$middleware->trustProxies(at: '*')` for Railway's proxy.
- **`bootstrap/app.php` — `$middleware->trimStrings(except: ['content', 'content.*', 'source_text'])`.**
  Laravel's global `TrimStrings` was stripping the edge spaces cloze-family
  `parts` text carries against each gap, corrupting every saved
  cloze/open-cloze/mc-cloze/read-complete passage on save. The `content.*`
  wildcard covers nested strings. **Do not remove this.**
- Local disk is **ephemeral** — PDF text and transcripts are stored in MySQL, not
  the filesystem.
- `vite.config.js` entry is `resources/js/App.jsx` — **capital A**, Linux is
  case-sensitive.
- `guest.blade.php` loads CSS only, no `app.js` (avoids a Vite-manifest 500 on the
  login page).
- Config/route/view caches are built at image-build time; `start-container.sh`
  clears and re-caches at runtime.
- All migrations are **idempotent** (`Schema::hasColumn` guards) — safe to re-run.
  They **auto-run on every Railway deploy** via the start command.
- Records with `null` `user_id` are orphaned pre-scoping data (invisible to all
  users). All teacher controllers are scoped to `auth()->id()`; student content is
  scoped to trilha instead.
- Railway env: `APP_ENV=production`, `APP_DEBUG=false`,
  `APP_URL=https://…` (**must be `https`** — mixed-content errors otherwise),
  `SESSION_DRIVER=database`, `SESSION_LIFETIME=43200` (30 days — was unset, so it
  fell back to the 120-min default and signed teachers out mid-lesson),
  `QUEUE_CONNECTION=database`, `CACHE_STORE=database`, `FILESYSTEM_DISK=local`,
  `ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY`, `OPENAI_API_KEY`,
  `LOG_LEVEL=error`, `PORT=8080`.
- **`railway run` can't reach `mysql.railway.internal`** (private network only).
  Run one-off artisan commands in prod with `railway ssh "php artisan …"` — or,
  for anything with `\` namespace separators, a `/tmp/*.php` bootstrap file over
  `railway ssh` (the shell mangles `\` in `--execute=`).
- **Session-cookie auth means an expired session looks like a broken feature.**
  `resources/js/bootstrap.js` has an axios response interceptor that redirects to
  `/login` on 401/419 (returns a never-settling promise so callers don't flash an
  error mid-nav). Without it, Laravel's raw `"Unauthenticated."` surfaces in
  whatever feature made the call. Keep it.

---

## 8. Gotchas & lessons learned

### Build / tooling
- **`scripts/generate-pronunciation-audio.mjs --force` is WHOLE-CORPUS**, not
  scoped to what you're working on — it regenerated all ~387 word files and
  silently introduced new silent clips among already-shipped audio. To fix one
  missing file, run **without** `--force`. After any bulk audio run, check
  **`git status`** (not just a byte-size scan) for the real blast radius;
  `git checkout -- public/audio/pronunciation/words/` restores tracked files.
  The `sentences/` mode is deliberately isolated from `words/` for this reason.
- **TTS silent-output failure mode:** a valid-looking but silent clip is almost
  always exactly **5,760 bytes**. Grep for that size after generating/adding audio.
- TTS is unreliable at isolating a single phoneme mid-word (rambles for 40s+) —
  that's why the 36 consonant/monophthong files use Wikimedia IPA recordings, not
  TTS. TTS is fine for whole words and short interjection-like diphthongs.
- **`npm run dev` force-killed leaves `public/hot` behind** → Laravel's `@vite`
  keeps trying `localhost:5173`, blank page / `ERR_CONNECTION_REFUSED` even after
  `npm run build`. Fix: delete `public/hot`.
- `php artisan tinker --execute` chokes on `@` in the argument on this
  Windows/PowerShell setup — use a standalone PHP bootstrap script instead.

### CSS / layout (recurring — has bitten this project 4+ times)
- **`items-center` + `overflow-y-auto` on the same scroll container is a trap.**
  When content overflows, flexbox centres it and pushes the top out of reach —
  `scrollTop` can't go negative. Invisible until a content batch grows the list.
  Fix: top-aligned `overflow-y-auto` container, centre the inner list with
  `mx-auto`. (Hit: Pronunciation select screens, all 3 DET select screens.)
- **A card/glass treatment tuned against one background photo does NOT transfer
  to another photo.** Re-learned twice on Pronunciation. Any surface that must
  guarantee text contrast over an unpredictable photo has to be **dark and
  sufficiently opaque itself** — never a light/white translucent tint (works only
  over a backdrop you already know is dark). Re-verify with a real screenshot
  whenever a background image changes.
- **`background-attachment: fixed` breaks in Playwright `fullPage` screenshots**
  (white band below the first viewport) — screenshot artifact only, the live page
  is fine.
- Native `<select>` / `<option>` popups **don't inherit the dark theme** reliably
  across browsers — give `<option>` explicit `text-black bg-white`.
- Split-screen (passage / task) layouts need a stacked mobile rework — the ✕ ends
  up off-viewport at 390px (`TrueFalseActivity`, `McReadingActivity`).
- Audio cleanup: components that `new Audio(...).play()` must
  `useEffect(() => () => audioRef.current?.pause(), [])` or the clip keeps playing
  after unmount / navigation.

### Blade / SPA wiring
- `welcome.blade.php` injects `window.__AURORA_USER__ = @json($auroraUser)` —
  compute the `->only([...])` into a `@php` variable **first**; `@json()` can't
  parse a nested method call.

### Content strategy
- All practice-mode + trilha content is **static hand-authored JSON** — no DB, no
  runtime API. Keep batch-adding on request; don't build an authoring helper or
  wire live generation without asking. Grow in stages based on real classroom
  usage, not front-loaded huge pools.
- **Parallel subagents for content batches:** one subagent per file/type, each
  writes to its **own scratch file** (never edits the shared JSON directly —
  concurrent-edit collisions), then merge + validate **centrally** with a Node
  script (`JSON.parse`, entry counts, schema-specific checks) — don't trust each
  subagent's self-report. Restate any non-obvious validation rule (e.g. a
  homophone sentence must not contain two spellings from its own group) in every
  subagent prompt.

### Design workflow
- For any non-trivial visual/layout decision: **mock it up as a published
  Artifact first**, converge there with the teacher in plain language, then
  implement once against the real code with one screenshot pass. Iterating live
  (tweak → rebuild → screenshot → repeat) is the expensive path.

### QA data
- The `aurora@aurora.test` user's **saved library activities have malformed
  `content`** (missing `slides` / `questions`) and crash on launch **on `main`
  too** — a pre-existing data issue, not a regression. QA activity changes by
  **generating a fresh one** (mock `/api/generate`), not by launching a saved one.

---

## 9. Repo doc map

| File | What |
|---|---|
| `docs/PROJECT_LOG.md` | Full phase-by-phase history (moved out of this file) |
| `PronunciationFeature.md` | Pronunciation spec + future-topics catalog (§9–12) |
| `AuroraStudentApp.md` | Student-app roadmap (S1+) and the mobile-first principle |
| `CambridgePracticeMode.md` / `CambridgeResearch.md` | Cambridge spec / research |
| `# DET Practice Mode — Feature Roadmap.md` | DET spec |
| `AuroraBranding.md` | Aurora palette / fonts / logo assets / Drive locations |
| `ProficiencyTestsComparison.md` + `*Research.md` | Market research (IELTS/TOEFL/etc.) |
| `docs/phase11-marketing.md` | Monetization marketing + revenue targets |
| `trilhas/README.md` | Trilha naming standard, ownership, status board |
