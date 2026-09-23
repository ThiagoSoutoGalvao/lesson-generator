<?php

namespace App\Console\Commands;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * Read-only. Answers "where did this activity actually land?" — across every account, since the
 * teacher-facing Library and the Students-page assign dropdown are both scoped to whoever is
 * signed in, so an activity saved under the wrong login (personal vs the Aurora shared one) is
 * invisible from the other side, with no error to explain why.
 *
 *   php artisan activities:audit --folder=Ketlin      every activity in a folder, any owner
 *   php artisan activities:audit --name=Past           every activity whose name contains this
 *
 * Never changes anything.
 */
class AuditActivities extends Command
{
    protected $signature = 'activities:audit {--folder= : find by folder name (contains, case-insensitive)} {--name= : find by activity name (contains, case-insensitive)}';
    protected $description = 'Read-only: find activities by folder or name across every account';

    public function handle(): int
    {
        $folder = $this->option('folder');
        $name   = $this->option('name');

        if (! $folder && ! $name) {
            $this->error('Give --folder=… or --name=… to search by.');

            return self::FAILURE;
        }

        $query = Activity::query()->orderBy('folder')->orderBy('created_at');
        if ($folder) {
            $query->whereRaw('LOWER(folder) LIKE ?', ['%' . strtolower($folder) . '%']);
        }
        if ($name) {
            $query->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($name) . '%']);
        }

        $activities = $query->get();
        if ($activities->isEmpty()) {
            $this->warn('No activities match.');

            return self::SUCCESS;
        }

        $owners = User::whereIn('id', $activities->pluck('user_id')->unique())->pluck('email', 'id');

        $rows = $activities->map(fn (Activity $a) => [
            $a->id, $a->type, $a->name, $a->folder ?: '-', $owners[$a->user_id] ?? "user #{$a->user_id}", $a->trilha ?: '-', $a->created_at->format('Y-m-d H:i'),
        ])->all();

        $this->table(['id', 'type', 'name', 'folder', 'owner', 'trilha', 'created'], $rows);

        $ownerCount = $activities->pluck('user_id')->unique()->count();
        if ($ownerCount > 1) {
            $this->line("⚠ These are split across {$ownerCount} different accounts — that's why some look \"missing\" from one login's dropdowns.");
            $this->line('To move one into the right account: `php artisan activities:export <file> --id=<id>`, then Import from file in the Library while signed in as the account it should belong to.');
        }

        return self::SUCCESS;
    }
}
