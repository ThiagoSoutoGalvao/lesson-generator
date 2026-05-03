# Lesson Generator

AI-powered activity generator for English teachers. Upload a course book PDF, describe what you want, and get interactive quiz, flashcard, or unjumble activities ready to use in a live online class.

## What it does

- Upload a PDF course book and extract its text
- Generate multiple choice quizzes, flashcard sets, or unjumble exercises using Claude AI
- Display activities fullscreen — designed for Zoom screen sharing
- Save activities to a library and relaunch them any time

## Requirements

- PHP 8.4
- Node.js 20+
- [Laravel Herd](https://herd.laravel.com) (local dev environment)
- Composer
- An [Anthropic API key](https://console.anthropic.com)
- An [Unsplash API key](https://unsplash.com/developers) (optional — falls back to placeholder images)

## Local setup

**1. Clone and install dependencies**

```bash
git clone <repo-url>
cd lesson-generator
composer install
npm install
```

**2. Configure environment**

```bash
cp .env.example .env
php artisan key:generate
```

Open `.env` and fill in:

```
ANTHROPIC_API_KEY=your-key-here
UNSPLASH_ACCESS_KEY=your-key-here   # optional
```

**3. Run migrations**

```bash
php artisan migrate
```

**4. Configure Herd**

Add the site in Herd and point it at the `public/` folder. Then update your Herd PHP config to allow large PDF uploads:

- `php.ini` → `upload_max_filesize=500M`, `post_max_size=500M`, `memory_limit=512M`, `max_execution_time=300`
- `herd.conf` → `client_max_body_size 600M`, `fastcgi_read_timeout 300`, `fastcgi_send_timeout 300`

**5. Start the dev server**

```bash
npm run dev
```

Visit your Herd URL (e.g. `http://lesson-generator.test`), register an account, and you're ready.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13 (PHP) |
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 + Shadcn/ui |
| Database | SQLite (local) |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Images | Unsplash API |
| Auth | Laravel Breeze (session-based) |

## Activity types

| Type | Description |
|---|---|
| **Quiz** | Multiple choice — 4 options, colour feedback, score counter |
| **Flashcards** | Word + definition/example, flip animation, known/learning tracking |
| **Unjumble** | Drag-and-drop word tiles to reconstruct a sentence |

All activities support fullscreen mode (`F` key) for Zoom screen sharing.
