<?php

namespace App\Jobs;

use App\Models\Activity;
use App\Services\LessonBuilder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * "Write a new version" / "Edit text" (2026-11-26): after a teacher replaces a lesson's reading or presentation, the
 * activities made from it are remade from the new text, in place (same id, name, stage and visibility). Runs on the
 * queue so the teacher can leave the page; progress is in the cache under statusKey() for the pack to show.
 */
class RemakeFromMaterialJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 1;
    public int $timeout = 290; // the worker runs with --timeout=300; a lesson's 4–6 activities take 1–2 minutes

    public function __construct(public int $materialId) {}

    public static function statusKey(int $materialId): string
    {
        return "material-remake:{$materialId}";
    }

    public function handle(LessonBuilder $builder): void
    {
        $m = Activity::find($this->materialId);
        if (! $m) return;
        $status = ['state' => 'running', 'done' => 0, 'failed' => 0, 'at' => now()->toIso8601String()];
        Cache::put(self::statusKey($m->id), $status, now()->addDay());
        try {
            [$done, $failed] = $builder->refill(
                $m->user_id, $m->trilha, (int) $m->trilha_lesson, $m->trilha_part ?? 'A',
                function (string $line) use (&$status, $m) {
                    if (str_contains($line, '✓')) $status['done']++;
                    if (str_contains($line, '✗')) $status['failed']++;
                    Cache::put(self::statusKey($m->id), $status, now()->addDay());
                },
                [], $m->id,
            );
            Cache::put(self::statusKey($m->id), ['state' => 'done', 'done' => $done, 'failed' => $failed], now()->addDay());
        } catch (Throwable $e) {
            Cache::put(self::statusKey($m->id), ['state' => 'error', 'done' => $status['done'], 'failed' => $status['failed'], 'message' => $e->getMessage()], now()->addDay());
        }
    }
}
