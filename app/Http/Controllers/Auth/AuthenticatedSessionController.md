# AuthenticatedSessionController — Handles teacher login and logout

## Overview

This Laravel controller manages the teacher's login sessions. It displays the login form, validates the teacher's email and password, starts a new authenticated session, and handles logout. It's the central point where the teacher's identity is verified and their session is created or destroyed.

## File Location
`app/Http/Controllers/Auth/AuthenticatedSessionController.php`

## Dependencies & Imports

- `LoginRequest` — A custom form request class that validates the email/password fields and enforces login rate limiting (max 5 attempts per IP before a temporary lockout)
- `Illuminate\Support\Facades\Auth` — Laravel's built-in authentication service; provides `logout()` method
- `Illuminate\Http\Request` — Represents the HTTP request object; used to access and manipulate the session
- `Illuminate\View\View` — Represents a rendered Blade template view

## Methods

### `create(): View`

**What it does:** Displays the login form to an unauthenticated teacher.

**Parameters:** None

**Returns:** A Blade view (`auth.login`) that renders the HTML login form with email and password fields.

**Side effects:** None (read-only; renders a view)

---

### `store(LoginRequest $request): RedirectResponse`

**What it does:** Processes a login attempt. Validates the teacher's credentials, and if correct, creates an authenticated session and redirects them to the home page.

**Parameters:**
- `$request` — A `LoginRequest` object containing the teacher's email and password (plus optional "remember me" checkbox). The request class automatically validates the fields and enforces rate limiting before this method runs.

**Returns:** A redirect response. On success, redirects to `/` (the React SPA home). If the request has an `intended` redirect (e.g. the teacher tried to access a protected page), redirects there instead.

**Side effects:**
- Calls `$request->authenticate()` to verify the email/password pair and log the teacher in (via the `web` session guard)
- Regenerates the session ID (prevents session fixation attacks — a security best practice)
- Logging in is done inside `LoginRequest::authenticate()`, not here

---

### `destroy(Request $request): RedirectResponse`

**What it does:** Logs the teacher out by destroying their session.

**Parameters:**
- `$request` — The HTTP request object

**Returns:** A redirect response to `/` (the home page, which will show the login form since the session is now destroyed)

**Side effects:**
- Calls `Auth::guard('web')->logout()` to revoke the teacher's authentication
- Invalidates the current session (clears all session data)
- Regenerates the session token (creates a new CSRF token, protecting against token replay attacks)

---

## How It Fits Into the App

The teacher flow is:

1. Teacher visits `/login` → `create()` displays the login form (Blade view with email/password fields)
2. Teacher submits email/password → Laravel routes to `POST /login` → `store()` runs
3. `store()` calls `LoginRequest::authenticate()` which checks the database for a matching user and verifies the password
4. If credentials are valid, the session is created and the teacher is redirected to `/`
5. All API calls (document upload, activity generation) are protected by `auth:web` middleware in `api.php`, so the teacher must be logged in to use them
6. To log out, the teacher clicks "Log out" in the header → `Layout.jsx` POSTs to `/logout` → `destroy()` runs, clearing the session
7. After logout, the teacher is redirected to `/` which now shows the login form (because the session is gone)

The session is stored in a cookie (Laravel's default). The session ID is passed to the browser and to the React frontend via a CSRF token in a `<meta>` tag in `welcome.blade.php`, which is used by the logout form in `Layout.jsx`.
