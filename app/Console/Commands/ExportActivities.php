<?php

namespace App\Console\Commands;

use App\Models\Activity;
use App\Models\User;
use App\Support\Credentials;
use Illuminate\Console\Command;

/**
 * Read-only. Writes activities from THIS database to a JSON file that the Library's "Import" button
 * (POST /api/activities/import) can load into another copy of the app — e.g. local -> Railway.
 *
 *   php artisan activities:export out.json --user=you@example.com --since=2026-09-21
 *   php artisan activities:export out.json --id=259 --id=260
 *
 * --since compares against created_at as stored (UTC). Nothing in the database is changed.
 */
class ExportActivities extends Command
{
    protected $signature = 'activities:export {file : path of the JSON file to write}
                            {--user= : only this teacher\'s activities (email)}
                            {--since= : only activities created on/after this date (UTC, e.g. 2026-09-21)}
                            {--id=* : only these activity ids}';
    protected $description = 'Export activities to a JSON file that the Library "Import" button accepts';

    public function handle(): int
    {
        $query = Activity::query()->orderBy('id');

        if ($email = $this->option('user')) {
            $user = User::where('email', Credentials::email($email))->first();
            if (! $user) {
                $this->error("No account with the email {$email}.");

                return self::FAILURE;
            }
            $query->where('user_id', $user->id);
        }
        if ($since = $this->option('since')) {
            $query->where('created_at', '>=', $since . ' 00:00:00');
        }
        if ($ids = $this->option('id')) {
            $query->whereIn('id', $ids);
        }

        $activities = $query->get();
        if ($activities->isEmpty()) {
            $this->warn('No activities match — nothing written.');

            return self::FAILURE;
        }

        $payload = [
            'format'      => 'lesson-generator-activities',
            'version'     => 1,
            'exported_at' => now()->toIso8601String(),
            'activities'  => $activities->map(fn (Activity $a) => $a->only(['name', 'type', 'content', 'tags', 'folder', 'book', 'lesson', 'trilha', 'trilha_lesson', 'built_by']))->values()->all(),
        ];

        file_put_contents($this->argument('file'), json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        $this->info("Wrote {$activities->count()} activities to " . $this->argument('file'));
        foreach ($activities as $a) {
            $this->line("  #{$a->id}  {$a->type}  {$a->name}  (created {$a->created_at})");
        }

        return self::SUCCESS;
    }
}
