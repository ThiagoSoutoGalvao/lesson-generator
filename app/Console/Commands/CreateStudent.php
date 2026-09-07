<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * CLI fallback for creating a student account — the teacher Students page is the
 * normal way. Run on Railway with:
 *
 *   railway run php artisan student:create
 */
class CreateStudent extends Command
{
    protected $signature = 'student:create
                            {--name= : Student full name}
                            {--email= : Student login email}
                            {--trilha= : Lights|Glow|Radiant}
                            {--teacher= : Email of the owning teacher account}
                            {--password= : Set non-interactively (may land in shell history)}';

    protected $description = 'Create a student account linked to a teacher and a trilha';

    public function handle(): int
    {
        $name   = $this->option('name') ?: $this->ask('Student name');
        $email  = strtolower(trim($this->option('email') ?: $this->ask('Student email')));
        $trilha = ucfirst(strtolower($this->option('trilha') ?: $this->choice('Trilha', ['Lights', 'Glow', 'Radiant'])));
        $teacherEmail = strtolower(trim($this->option('teacher') ?: $this->ask('Owning teacher email')));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid student email.');
            return self::FAILURE;
        }
        if (! in_array($trilha, ['Lights', 'Glow', 'Radiant'], true)) {
            $this->error('Trilha must be Lights, Glow or Radiant.');
            return self::FAILURE;
        }
        if (User::where('email', $email)->exists()) {
            $this->error("A user with {$email} already exists.");
            return self::FAILURE;
        }

        $teacher = User::where('email', $teacherEmail)->first();
        if (! $teacher || ! $teacher->isTeacher()) {
            $this->error("No teacher account found for {$teacherEmail}.");
            return self::FAILURE;
        }

        $password = $this->option('password') ?: $this->secret('Password (min 8 characters)');
        if (strlen((string) $password) < 8) {
            $this->error('Password must be at least 8 characters.');
            return self::FAILURE;
        }

        $student = new User();
        $student->name       = $name;
        $student->email      = $email;
        $student->password   = Hash::make($password);
        $student->role       = 'student';
        $student->trilha     = $trilha;
        $student->teacher_id = $teacher->id;
        $student->is_active  = true;
        $student->save();

        $this->info("Created student {$name} <{$email}> on {$trilha}, owned by {$teacher->name}.");
        return self::SUCCESS;
    }
}
