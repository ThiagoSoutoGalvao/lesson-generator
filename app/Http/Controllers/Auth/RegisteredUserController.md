# RegisteredUserController — Handles teacher registration

## Overview

This Laravel controller manages teacher registration (account creation). It displays the registration form and processes new teacher sign-ups. When a new teacher registers, their account is created in the database, and they are immediately logged in and redirected to the home page. No email verification is required in this implementation.

## File Location
`app/Http/Controllers/Auth/RegisteredUserController.php`

## Dependencies & Imports

- `User` — The teacher's user model; represents a row in the `users` table
- `Hash` — Laravel's password hashing service; uses bcrypt to securely hash passwords before storing them
- `Auth` — Laravel's authentication service; used to log the newly registered teacher in automatically
- `Registered` — A Laravel event fired when a new user is registered; can be used to send welcome emails or trigger other actions
- `Rules\Password` — A validator that enforces password strength rules (minimum length, complexity, etc.)
- `ValidationException` — Thrown when registration data fails validation (e.g. invalid email, weak password, duplicate email)

## Methods

### `create(): View`

**What it does:** Displays the registration form to unauthenticated teachers.

**Parameters:** None

**Returns:** A Blade view (`auth.register`) that renders the HTML registration form with name, email, and password fields.

**Side effects:** None (read-only; renders a view)

---

### `store(Request $request): RedirectResponse`

**What it does:** Processes a registration attempt. Validates the teacher's input, creates a new user account in the database, logs them in automatically, and redirects to the home page.

**Parameters:**
- `$request` — The HTTP request containing the teacher's name, email, and password

**Returns:** A redirect response to `/` (the React SPA home), so the newly registered teacher sees the app immediately after signing up.

**Side effects:**
- **Validates input:** Checks that name is provided and under 255 characters, email is valid and unique (not already registered), and password meets strength rules and matches the password confirmation field
- **Creates the user:** Stores a new row in the `users` table with the name, email (lowercased), and hashed password. The password is hashed with bcrypt before storage — it is never stored in plain text
- **Fires the `Registered` event:** Laravel broadcasts this event so plugins or other code can respond (e.g. send a welcome email). Currently no listeners are configured
- **Logs the teacher in:** Calls `Auth::login()` to create a new session, so the teacher does not need to manually log in after registering
- **Throws `ValidationException`:** If any field is invalid (e.g. email already exists, password too weak), the form is re-displayed with error messages

---

## How It Fits Into the App

The teacher registration flow is:

1. New teacher visits `/register` → `create()` displays the registration form
2. New teacher fills in name, email, and password, then clicks "Register"
3. Laravel routes the POST to `/register` → `store()` runs
4. `store()` validates the input and checks that the email is not already in the database
5. If valid, a new row is created in the `users` table with the hashed password
6. The new teacher is immediately logged in (session created)
7. The teacher is redirected to `/` and can start uploading PDFs and generating activities

Registration is simpler than login because there is no need for a "remember me" option or rate limiting. Both login and registration are protected by the `guest` middleware in `auth.php`, which means logged-in teachers cannot access the register or login forms — they are redirected to the home page if they try.

The password strength is enforced by `Rules\Password::defaults()`, which typically requires:
- At least 8 characters
- At least one letter
- At least one number
- At least one special character (on production; may be more lenient in dev)
