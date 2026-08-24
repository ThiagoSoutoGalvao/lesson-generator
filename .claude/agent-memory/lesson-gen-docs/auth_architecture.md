---
name: Authentication Architecture (Phase 9+)
description: Session-based auth using Laravel Breeze, StartSession middleware on API routes, CSRF tokens for forms
type: project
---

Lesson Generator uses Laravel Breeze (Blade scaffolding) for authentication:

**Login/Register Flow:**
- `AuthenticatedSessionController` handles login (validates credentials via `LoginRequest`, rate-limits failed attempts to 5 per IP)
- `RegisteredUserController` handles registration (creates user with bcrypt-hashed password, auto-logs in)
- Both routes in `routes/auth.php` wrapped with `guest` middleware (redirect already-logged-in users away)

**SPA Integration:**
- Web routes (`web.php`): Catch-all `/{any}` route requires `auth` middleware → serves React SPA via `welcome.blade.php`
- Unauthenticated users redirected to `/login`
- Logged-in users see the React app; all navigation is client-side (React Router)

**API Security:**
- API routes require `auth:web` middleware
- `bootstrap/app.php` appends `StartSession` middleware to API group — **critical** to enable session auth on API endpoints
- This allows API calls from React (e.g. `fetch('/api/documents')`) to authenticate using the session cookie
- Session cookie sent automatically by browser; CSRF token must be included in POST/PUT/DELETE forms

**CSRF Protection:**
- Laravel generates CSRF token and stores it in session
- Token embedded in `<meta name="csrf-token">` in `welcome.blade.php`
- React components (e.g. logout form in `Layout.jsx`) read token via `document.querySelector('meta[name="csrf-token"]')?.content`
- Token included in form as hidden input `_token` — Laravel middleware validates it matches session

**Logout:**
- `POST /logout` POSTs to `AuthenticatedSessionController::destroy()`
- Clears session, regenerates session token, redirects to `/`
- Implemented as form submission (not a link) to ensure CSRF token is sent

**Why it works:**
- Breeze scaffolds login/register controllers, routes, and Blade views
- `StartSession` middleware on API routes is custom addition (not default Laravel)
- This hybrid approach allows session-based auth to work on both Blade views and JSON API calls
