<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * Create a user or reset an existing user's password.
 *
 * Sign-ups are closed on the live site, so this is the way to add the shared
 * "Aurora" account (and to recover a forgotten password). Run it on Railway with:
 *
 *   railway run php artisan user:upsert
 */
class UpsertUser extends Command
{
    protected $signature = 'user:upsert
                            {--email= : The user\'s email (prompted if omitted)}
                            {--name= : Display name, only used when creating a new user}
                            {--password= : Set the password non-interactively (may be stored in shell history)}';

    protected $description = 'Create a user or reset an existing user\'s password';

    public function handle(): int
    {
        $email = $this->option('email') ?: $this->ask('Email');
        $email = trim(strtolower($email));

        if ($email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('That is not a valid email address.');
            return self::FAILURE;
        }

        $user     = User::where('email', $email)->first();
        $creating = $user === null;

        if ($creating) {
            $name = $this->option('name') ?: $this->ask('Display name', 'Aurora');
            $this->info("Creating a new user: {$name} ({$email})");
        } else {
            $this->info("Resetting the password for existing user: {$user->name} ({$email})");
        }

        $password = $this->option('password');
        if ($password === null) {
            $password = $this->secret('New password (min 8 characters)');
            if ($password !== $this->secret('Confirm password')) {
                $this->error('Passwords did not match.');
                return self::FAILURE;
            }
        }
        if (strlen((string) $password) < 8) {
            $this->error('Password must be at least 8 characters.');
            return self::FAILURE;
        }

        if ($creating) {
            $user = new User();
            $user->name = $name;
            $user->email = $email;
        }

        $user->password = Hash::make($password);
        $user->save();

        $this->info($creating ? "Created {$email}." : "Password updated for {$email}.");
        return self::SUCCESS;
    }
}
