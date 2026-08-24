 Phase 10 — Railway Deployment (Step by Step)

  Step 1: Create Railway account

  Go to railway.app → Sign up with GitHub.

  Step 2: Create the project

  1. New Project → Deploy from GitHub repo → select
  lesson-generator
  2. Railway will start building automatically (you'll
   see the Nixpacks build log)
  3. It will fail the first time — that's expected
  because env vars aren't set yet. Don't panic.

  Step 3: Add MySQL database

  1. In your Railway project, click + New → Database →
   Add MySQL
  2. Once it's provisioned, click on it and go to
  Variables tab — you'll see MYSQL_URL and individual
  vars (MYSQL_HOST, MYSQL_USER, etc.)

  Step 4: Set environment variables

  In your Railway web service → Variables tab, add all
   of these:

  APP_NAME=Lesson Generator
  APP_ENV=production
  APP_KEY=                          ← generate with:
  php artisan key:generate --show
  APP_DEBUG=false
  APP_URL=https://YOUR-RAILWAY-URL.railway.app

  DB_CONNECTION=mysql
  DB_HOST=                          ← from MySQL
  service Variables
  DB_PORT=3306
  DB_DATABASE=                      ← from MySQL
  service Variables
  DB_USERNAME=                      ← from MySQL
  service Variables
  DB_PASSWORD=                      ← from MySQL
  service Variables

  SESSION_DRIVER=database
  QUEUE_CONNECTION=database
  CACHE_STORE=database
  FILESYSTEM_DISK=local
  LOG_LEVEL=error

  ANTHROPIC_API_KEY=sk-ant-...
  UNSPLASH_ACCESS_KEY=...
  OPENAI_API_KEY=sk-...            ← only needed if
  teachers upload audio

  To generate APP_KEY, run this locally:
  php artisan key:generate --show
  Copy the output (starts with base64:) and paste it
  into Railway.

  Step 5: Redeploy

  After setting env vars, click Deploy → Redeploy. The
   build will:
  1. Install PHP deps (composer install)
  2. Install Node deps and build React (npm ci && npm
  run build)
  3. On start: run migrations, cache config, then
  serve

  Step 6: Queue worker (for audio transcription)

  If you want the audio upload feature to work, create
   a second Railway service:

  1. In the same project: + New → GitHub repo → same
  lesson-generator repo
  2. In that service's Settings → Start Command, set
  it to:
  php artisan queue:work --tries=3 --timeout=120
  3. Copy the same environment variables from the web
  service to this worker service
  4. You don't need a domain for the worker service

  ▎ If you skip this step, all features work except
  ▎ audio upload transcription. Teachers can still use
  ▎  PDFs normally.

  Step 7: Create the first user

  Once deployed, visit your Railway URL → you'll see
  the login page. But you can't register without an
  invite (auth is restricted). Run this to create your
   account:

  In Railway's web service → Shell tab (or via the
  CLI):
  php artisan tinker
  Then:
  \App\Models\User::create([
      'name' => 'Thiago',
      'email' => 'your@email.com',
      'password' => bcrypt('yourpassword'),
  ]);

  Step 8: Share with beta users

  For each of your 8 colleagues, either:
  - Create their accounts via tinker (same command
  above, different email/password)
  - Or temporarily allow registration by enabling it
  in routes/auth.php

  ---
  Expected monthly cost:
  - Railway Hobby plan: ~$5/month (required to keep
  the app running 24/7 — free tier sleeps after
  inactivity)
  - MySQL on Railway: ~$0 included in Hobby
  - Claude API: pay per use (~$0.02–0.10 per activity
  generated)
  - Total: ~$5–10/month for 8 users

  What would you like to tackle first — setting up the
   Railway account, or do you want me to check
  anything else in the code before deployment?