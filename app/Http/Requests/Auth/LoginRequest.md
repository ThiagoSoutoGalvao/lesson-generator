# LoginRequest — Validates login credentials and enforces rate limiting

## Overview

This is a Laravel Form Request class that validates the teacher's email and password, enforces login rate limiting (preventing brute-force attacks), and performs the actual authentication. It is a reusable request class that centralizes validation logic and security checks, keeping the controller clean.

## File Location
`app/Http/Requests/Auth/LoginRequest.php`

## What It Does

When a teacher submits the login form (POST to `/login`), Laravel automatically creates a `LoginRequest` object and validates the data before passing it to the controller's `store()` method. The validation happens before the controller method runs, so if validation fails, the form is re-displayed with error messages.

## Methods

### `authorize(): bool`

**What it does:** Determines whether the user is allowed to make this request (a Laravel convention). In this case, anyone can attempt to log in, so this always returns `true`.

**Parameters:** None

**Returns:** `true` (always allows the request)

**Side effects:** None

---

### `rules(): array`

**What it does:** Defines the validation rules for the email and password fields.

**Parameters:** None

**Returns:** An associative array mapping field names to validation rule lists:
- `email` — must be a required string in valid email format
- `password` — must be a required string (no length restrictions here; the database check happens during authentication)

**Side effects:** None (defines rules; does not execute them)

---

### `authenticate(): void`

**What it does:** Attempts to authenticate the teacher using their email and password. This method is called by the controller's `store()` method after basic validation passes. It checks the database for a matching user, verifies the password, and either logs the teacher in or throws a validation error.

**Parameters:** None

**Returns:** `void` (nothing returned; throws an exception on failure)

**Side effects:**
- **Rate limiting check:** Calls `ensureIsNotRateLimited()` to verify the user has not exceeded 5 failed login attempts. If they have, throws a `ValidationException` with a cooldown message (e.g. "Too many login attempts. Please try again in 57 seconds.")
- **Authentication attempt:** Calls `Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))` to check if the email and password match a user in the database. If the "remember me" checkbox is checked, the session will be remembered for longer (typically 2 weeks instead of the standard session length)
- **On failure:** If the credentials do not match, increments the rate limiter counter for that email/IP combination and throws a `ValidationException` with a generic "These credentials do not match our records" message (using the translation key `auth.failed`)
- **On success:** Clears the rate limiter counter (resets the failed attempt count), and the teacher is logged in

---

### `ensureIsNotRateLimited(): void`

**What it does:** Checks if the teacher has exceeded 5 failed login attempts from their IP address. If so, blocks them temporarily.

**Parameters:** None

**Returns:** `void` (nothing returned; throws an exception if rate limited)

**Side effects:**
- **On success:** Returns early if the teacher has fewer than 5 failed attempts (no action taken)
- **On rate limit exceeded:** Fires a `Lockout` event (for logging/alerting), calculates how many seconds until they can try again, and throws a `ValidationException` with a message like "Too many login attempts. Please try again in 57 seconds. (approximately 1 minute)"

---

### `throttleKey(): string`

**What it does:** Generates a unique string to track rate limiting. This ensures that each email/IP combination is rate-limited independently (so a shared IP address does not lock out all users on that network).

**Parameters:** None

**Returns:** A string combining the lowercased, transliterated email and the user's IP address (e.g. `john.doe@example.com|192.168.1.100`)

**Side effects:** None

---

## How It Fits Into the App

The authentication flow is:

1. Teacher visits `/login` and sees the login form
2. Teacher enters email and password, clicks "Login"
3. Laravel routes the POST request to `AuthenticatedSessionController::store()`, passing a `LoginRequest` object
4. **Before the controller method runs,** Laravel calls `LoginRequest::rules()` to validate the email and password fields are present and properly formatted
5. If basic validation passes, the controller method runs and calls `$request->authenticate()`
6. `authenticate()` checks the rate limiter to prevent brute-force attacks
7. If not rate-limited, it calls `Auth::attempt()` to check the database
8. If the credentials match, the teacher is logged in; otherwise, the attempt is recorded and an error is thrown
9. If `authenticate()` succeeds, the controller creates a session and redirects to `/`
10. If it fails, the form is re-displayed with an error message

The rate limiting uses a key based on email and IP address, so:
- A teacher trying 6 times from the same IP gets locked out for ~15 minutes
- Attempting from a different IP address does not count toward the same lock (they are tracked separately)
- Once a successful login happens, the counter is cleared

This protects against automated password-guessing attacks (brute-force) while still allowing legitimate teachers to recover if they mistype their password a few times.
