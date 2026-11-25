<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\LessonBuilder;
use App\Services\LessonDrafter;
use Illuminate\Console\Command;
use Throwable;

/**
 * Builds Aurora Business lessons one after another on the server (2026-11-25): unit plan → reading + presentation →
 * the suggested grid, every activity hidden from students until approved. See App\Services\LessonBuilder.
 *   php artisan lessons:build FirstSteps 4            # 4A, 4B, 4C
 *   php artisan lessons:build FirstSteps 4 6          # units 4 to 6
 *   php artisan lessons:build FirstSteps 4 5 --refill # remake units 4–5's activities with the current grid instructions
 * On Railway, start it detached so it outlives the SSH session — and don't deploy while it runs (a deploy restarts
 * the container and stops it; running it again picks up where it stopped).
 */
class BuildLessons extends Command
{
    protected $signature = 'lessons:build {trilha} {from : first unit} {to? : last unit (default: from)}
        {--parts=ABC : which lessons of each unit} {--owner=aurora@lessongenerator.app : the login that owns the course}
        {--by=Thiago : the name the cards show as "by …"}
        {--refill : remake the existing activities with the current grid instructions instead of building}
        {--only= : with --refill, just these formats (comma-separated, e.g. picture_prompts,image_vocab_match)}
        {--no-photos : build everything except Picture Prompts / Image Match (the photo search allows 50 an hour)}
        {--photos-only : add just the missing Picture Prompts / Image Match to lessons already built}';

    protected $description = 'Build Aurora Business lessons (plan, reading, presentation, grid) — activities saved hidden until approved';

    public function handle(LessonBuilder $builder): int
    {
        $trilha = $this->argument('trilha');
        if (! isset(LessonDrafter::BUSINESS[$trilha])) {
            $this->error('Only Aurora Business courses: ' . implode(', ', array_keys(LessonDrafter::BUSINESS)));
            return self::FAILURE;
        }
        $owner = User::where('email', $this->option('owner'))->first();
        if (! $owner) {
            $this->error('No login ' . $this->option('owner'));
            return self::FAILURE;
        }
        $from = (int) $this->argument('from');
        $to = (int) ($this->argument('to') ?? $from);
        $log = function (string $line) { $this->line('[' . now()->format('H:i:s') . '] ' . $line); };

        foreach (range($from, $to) as $unit) {
            foreach (str_split(strtoupper($this->option('parts'))) as $part) {
                if (! in_array($part, ['A', 'B', 'C'], true)) continue;
                $t = microtime(true);
                try {
                    [$made, $failed] = $this->option('refill')
                        ? $builder->refill($owner->id, $trilha, $unit, $part, $log, array_filter(explode(',', (string) $this->option('only'))))
                        : $builder->build($owner->id, $trilha, $unit, $part, $log, (string) $this->option('by'),
                            $this->option('photos-only') ? 'only' : ($this->option('no-photos') ? 'none' : 'all'));
                    $log(sprintf('%d%s done in %ds — %d made, %d failed', $unit, $part, microtime(true) - $t, $made, $failed));
                } catch (Throwable $e) {
                    $log("{$unit}{$part} STOPPED: " . $e->getMessage());
                    $log('The next lessons need this one, so the build stops here. Run the same command again to retry.');
                    return self::FAILURE;
                }
            }
        }
        $log('ALL DONE');
        return self::SUCCESS;
    }
}
