<?php

namespace App\Console\Commands;

use App\Models\Activity;
use App\Models\User;
use App\Support\Credentials;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * Read-only. Answers "whose students / activities are these?" and "why can't this
 * person log in?" on a database you can't easily open (Railway):
 *
 *   php artisan accounts:audit                          every account + what it owns
 *   php artisan accounts:audit gabriel@x.com            does it exist, is it active, who owns it
 *   php artisan accounts:audit gabriel@x.com --password=Lights-2026   …and does that password match
 *
 * Never prints a hash, and never changes anything.
 */
class AuditAccounts extends Command
{
    protected $signature = 'accounts:audit {email? : check one login} {--password= : test a password against that email}';
    protected $description = 'Read-only audit of accounts, ownership and login problems';

    public function handle(): int
    {
        $email = $this->argument('email');

        return $email ? $this->checkOne(Credentials::email($email)) : $this->overview();
    }

    private function overview(): int
    {
        $this->info('Database: ' . config('database.default') . ' — ' . User::count() . ' users, ' . Activity::count() . ' activities, '
            . Activity::whereNull('user_id')->count() . ' with no owner');

        $rows = User::orderBy('id')->get()->map(fn (User $u) => [
            $u->id,
            $u->role ?? 'teacher',
            $u->email,
            $u->role === 'student' ? ($u->trilha ?? '-') : '',
            $u->role === 'student' ? ($u->teacher_id ?? '-') : '',
            $u->role === 'student' ? ($u->is_active ? 'yes' : 'PAUSED') : '',
            $u->role === 'student' ? '' : Activity::where('user_id', $u->id)->count(),
            $u->role === 'student' ? '' : User::where('teacher_id', $u->id)->where('role', 'student')->count(),
            optional($u->created_at)->format('Y-m-d H:i'),
        ])->all();

        $this->table(['id', 'role', 'email', 'trilha', 'teacher_id', 'active', 'activities', 'students', 'created'], $rows);
        $this->line('A teacher only sees the students (teacher_id) and activities (owner) listed on THEIR OWN row.');

        return self::SUCCESS;
    }

    private function checkOne(string $email): int
    {
        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("No account with the email \"{$email}\" (checked lower-case, edge spaces removed).");
            $local = explode('@', $email)[0];
            $like  = User::where('email', 'like', '%' . substr($local, 0, 4) . '%')->pluck('email')->all();
            $this->line($like ? 'Similar emails on file: ' . implode(', ', $like) : 'No similar emails on file either.');
            $this->line('If the student is sure they typed it right, the account was probably created with a different email (or on the other site).');

            return self::FAILURE;
        }

        $teacher = $user->teacher_id ? User::find($user->teacher_id) : null;
        $this->info("Found #{$user->id} \"{$user->name}\" <{$user->email}> — role " . ($user->role ?? 'teacher')
            . ($user->role === 'student' ? ", trilha " . ($user->trilha ?? 'none') . ', ' . ($user->is_active ? 'active' : 'PAUSED')
                . ', owned by ' . ($teacher?->email ?? 'nobody') : '')
            . ', created ' . optional($user->created_at)->format('Y-m-d H:i'));

        $password = $this->option('password');
        if ($password === null) {
            $this->line('Add --password=… to test whether a password matches this account.');

            return self::SUCCESS;
        }

        $asTyped = Hash::check($password, $user->password);
        $cleaned = Hash::check(Credentials::password($password), $user->password);

        $this->line('Password exactly as given : ' . ($asTyped ? 'MATCHES' : 'does not match'));
        $this->line('Password, edges cleaned   : ' . ($cleaned ? 'MATCHES' : 'does not match'));
        $this->line($asTyped || $cleaned
            ? 'The server would let this login in. If the person is still refused, the difference is on their side (typing, autofill, wrong site).'
            : 'The server would REFUSE this. The stored password is not the one you tested — reset it from the Students page.');

        return self::SUCCESS;
    }
}
