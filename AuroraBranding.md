# Aurora Branding — Direction B ("Sunrise") + Display Panel

**Status:** Phase B ✅ SHIPPED 2026-09-06 (see `Claude.md` §18 for what actually
landed and the notes worth keeping). Display Panel D1/D2 below are still to do.
This doc is the original build spec, kept for reference.

Reference artifact (3 directions + Display panel mock):
https://claude.ai/code/artifact/748ae1b7-f07f-4328-9b5c-bd22eedfb77d
PDF copy: `docs/Aurora-Identity-directions.pdf`
Brand facts (palette, fonts, Drive locations): memory `aurora_brand.md`.

---

## Decisions locked

- **Direction B — "Sunrise".** Warm Aurora gradient ground (gold → orange →
  coral → magenta), **frosted-white cards with dark indigo text**, magenta/coral
  accents. Friendly/light, closest to the Instagram feel.
- **Poppins** for headings (Google Fonts — CSP allows it). Body stays Inter.
- **Library type badges stay colourful** (they help scanning) — leave the
  existing `TYPE_COLORS` as-is for this ship; optional Aurora-family retune later.
- **Scope: shell pages only.** `/upload`, `/generate`, `/library`, `/` (all via
  `Layout.jsx`), plus the **login page** (`guest.blade.php`) as a small add-on.
- **NOT touched:** every fullscreen activity / drill / practice screen. They keep
  their dark `#1a1a2e` + Unsplash-photo look. That boundary keeps this bounded.
- **Effort:** medium, ~1 focused session. Bulk = a mechanical dark-text sweep
  (~150 `text-white*` classes across the 3 pages). Risk = missing one → low
  contrast. Mitigation = screenshot every shell page + state after.

### The "mock under-executed" note
The artifact's Direction B mock used `rgba(255,255,255,.2)` glass + white text —
too transparent, white-on-bright is marginal. The real build must use
**near-opaque frosted white** (`~0.82` alpha) so **dark text is safe**. That is
the true Direction B ("frosted-white glass") and it's why the text sweep is
unavoidable.

---

## Aurora palette (from `aurora_brand.md`)

| Role | Hex |
|------|-----|
| Indigo — ink, darkest | `#271D62` |
| Violet | `#5A1B73` |
| Magenta — accent text, tagline | `#A01789` |
| Coral-red | `#F34650` |
| Coral — primary button | `#FC6840` |
| Orange | `#FA9C3E` |
| Gold — highlight | `#F8C63D` |

Warm gradient (the ground): `linear-gradient(150deg, #F8C63D 0%, #FA9C3E 30%, #FC6840 62%, #A01789 115%)`

---

## Phase B — the build

### B0 — prep / check-first
- Assets already in repo: `public/brand/aurora-logo-horizontal.png` (colour),
  `aurora-logo-horizontal-white.png`, `aurora-symbol.png`.
- **Grep check before touching tokens:** confirm `.lg-surface`, `.lg-surface-hover`,
  `.lg-chip`, `.lg-chip-hover`, `.lg-shell-overlay`, `.lg-shell-text` are still
  used *only* by `Layout.jsx` / `LibraryPage.jsx` / `GeneratePage.jsx` /
  `UploadPage.jsx`. **`.lg-surface-soft` / `.lg-surface-soft-hover` are used by
  the Pronunciation drill pages (a DARK context) — do NOT retune those.** If any
  shell page uses `.lg-surface-soft`, migrate it to `.lg-surface` first.

### B1 — background + shell tokens (`resources/css/app.css`, `Layout.jsx`)
Current values (for reference / rollback):
- `.lg-surface`: `rgba(40,32,26,.5)` + `blur(22px) saturate(1.3) brightness(1.1)`, border `rgba(255,255,255,.18)`
- `.lg-chip`: `rgba(24,19,15,.52)` + `blur(16px) saturate(1.2) brightness(1.1)`
- `.lg-shell-overlay`: `rgba(8,6,4,.7)`
- `.lg-shell-text`: dark text-shadow

New (Direction B):
- **Background** — `Layout.jsx` `PAGE_BACKGROUNDS`: shell routes (`/`, `/upload`,
  `/generate`, `/library`) use the **warm gradient**, not a photo. `bgStyle`
  currently builds `backgroundImage: url(...)`; switch shell routes to
  `backgroundImage: <the gradient>` (keep `backgroundAttachment: fixed`).
- `.lg-surface` → `background: rgba(255,255,255,.82); backdrop-filter: blur(20px) saturate(1.15); border-color: rgba(255,255,255,.65)`
- `.lg-surface-hover:hover` → `rgba(255,255,255,.9)`
- `.lg-chip` → `background: rgba(255,255,255,.7); backdrop-filter: blur(14px); border-color: rgba(255,255,255,.6)`
- `.lg-chip-hover:hover` → `rgba(255,255,255,.82)`
- `.lg-shell-overlay` → very light, e.g. `rgba(26,19,64,.10)` (a touch of indigo
  to deepen contrast; the gradient must stay visible — do NOT keep the heavy
  `.7` dark wash).
- `.lg-shell-text` → titles go **dark indigo** now; change the shadow to a light
  halo: `text-shadow: 0 1px 2px rgba(255,255,255,.55)`. (Any element using
  `.lg-shell-text` also needs its text-colour class flipped to indigo — see B2.)

### B2 — the dark-text sweep (`LibraryPage.jsx`, `GeneratePage.jsx`, `UploadPage.jsx`)
~150 `text-white*` occurrences (Library 54, Upload 65, Generate 27) — content is
now on frosted-white cards, so text must be dark. Do it with `replace_all` per
distinct class, per file:
- `text-white` → `text-[#271d62]`
- `text-white/80` → `text-[#271d62]/85`
- `text-white/70` / `text-white/65` → `text-[#5a1b73]` (violet, softer)
- `text-white/60` / `text-white/50` → `text-[#271d62]/60`
- `text-white/45` / `text-white/40` / `text-white/35` / `text-white/30` → `text-[#271d62]/45`
- `placeholder-white/35` / `placeholder-white/45` → `placeholder-[#271d62]/40`
- `border-white/15` / `border-white/10` etc. inside cards → `border-[#271d62]/12`
- **Nav bar (`Layout.jsx`) is the exception** — it stays a darkened frosted strip
  with **white** text (see B3). Only sweep `<main>` content.
- After each file, eyeball for leftover `text-white` that belongs (there should
  be almost none in the 3 content pages) vs. missed.

### B3 — navbar + logo (`Layout.jsx`)
- Header bg `bg-black/15` → `bg-[#271d62]/28` (or similar) — a deeper frosted
  strip so white text/logo separates from the bright content zone below.
- Replace the `<Link to="/">Lesson Generator</Link>` text with
  `<img src="/brand/aurora-logo-horizontal-white.png" className="h-7 w-auto" alt="Aurora" />`.
- Nav links / Aa control / Log out: keep white text (they're on the dark strip).
- Active nav pill `bg-white/20` → `bg-[#fc6840]` (coral) or keep `bg-white/20` —
  test both, coral is more branded.

### B4 — accent colour (all 3 pages + `Layout.jsx`)
~20 `blue-*` occurrences.
- Primary buttons (`bg-blue-500 hover:bg-blue-600`) → `bg-[#fc6840] hover:bg-[#e85529]` (coral, white text — safe on white cards).
- `focus:ring-blue-400` → `focus:ring-[#a01789]` (magenta).
- Active goal/format buttons in `GeneratePage` (`bg-blue-500 border-blue-400`) →
  coral, or a coral→magenta gradient for the selected state.
- Selected/active pills, links (`text-blue-*`) → `text-[#a01789]` (magenta reads
  on white).
- `LibraryPage` filter active state, `bg-blue-500/25` shadows → coral equivalents.

### B5 — Poppins (`resources/css/app.css` + blade `<head>`)
- Add to the app's HTML `<head>` (`resources/views/welcome.blade.php` — and
  `guest.blade.php` for login):
  `<link rel="preconnect" href="https://fonts.googleapis.com">` +
  `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">`
- In `app.css`, a `.font-display { font-family: Poppins, Inter, sans-serif; }`
  utility (or Tailwind v4 `@theme`), applied to page `<h1>/<h2>` headings and the
  nav. Keep body Inter.

### B6 — favicon (blade `<head>`)
- `<link rel="icon" type="image/png" href="/brand/aurora-symbol.png">` in
  `welcome.blade.php` + `guest.blade.php`. (Optional: generate a 32×32 crop.)

### B7 — login page (`resources/views/auth/*` / Breeze `guest.blade.php`)
- Same warm gradient background, the Aurora logo (colour or white depending on
  the card treatment), a frosted-white login card. Small, self-contained.

### B8 — verify (Playwright + temp QA user, the usual pattern)
- Screenshot every shell surface: Home, Login, Upload (**all 7 tabs** incl. the
  DET / Cambridge / Pronunciation sub-launchers), Generate (goal picker → a
  goal's templates → source step), Library (coverage grid + brief editor
  expanded + activity cards).
- Desktop (1280) **and** mobile (390) — the shell already wraps on phones
  (Phase P follow-up), just confirm text contrast holds.
- Zero console errors. The one thing to hunt: any leftover white/low-contrast
  text on a white card.
- `npm run build` clean. Commit → push → tell the user to hard-refresh after
  ~5 min (deploy propagation has bitten before).

---

## Display Panel — after B (independent of the look)

### Phase D1 — unify + persist
- One `<DisplayPanel>` component: text size (5 steps) + text colour (Aurora
  swatches: white, gold `#F8C63D`, coral `#FC6840`, magenta `#A01789`, cyan
  `#7FDFFF`). Same panel on the navbar and inside every activity.
- Persist to `localStorage` (+ a small context/hook) so the setting sticks
  across activities and sessions, per browser. Today each activity has its own
  `useState` defaulting to index 2, resetting every open.
- Touches ~20 activity/drill components — each currently renders its own inline
  `A-` / `A+` + colour bar. Replace with the shared control (or have them read
  defaults from the shared store and keep local override).
- The navbar already has the Phase I "Aa" control (`Layout.jsx` lines ~88–128,
  CSS vars `--tf-size` / `--tf-color` / `--tf-family`) — D1 rebuilds/relocates
  this into the shared component.

### Phase D2 — new capabilities
- **Brightness slider** — a dimming overlay for projecting in bright rooms.
- **Font choice** — System / Poppins / **Lexend** (Lexend is reading-tuned,
  good for lower levels / younger students). Needs `@font-face` / Google Fonts
  for Poppins + Lexend.

---

## Order

**B (one session) → D1 → D2.** B and the Display panel are independent, so the
order can flex if needed. After all three: back to the student app (Phase S1 in
`AuroraStudentApp.md`).
