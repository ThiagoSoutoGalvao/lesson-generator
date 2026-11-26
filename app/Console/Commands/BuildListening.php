<?php

namespace App\Console\Commands;

use App\Models\Activity;
use App\Models\User;
use App\Services\LessonBuilder;
use App\Services\LessonDrafter;
use App\Services\ListeningMaker;
use Illuminate\Console\Command;
use Throwable;

/**
 * php artisan lessons:listening FirstSteps 3 --part=B --format=who
 * Adds one listening activity (2026-11-26, step 1 of the listening plan) to a business lesson, made from that
 * lesson's reading. Saved in the Practice stage and visible, like the courses' other activities. Skips a format the
 * lesson already has unless --redo (then the content is remade in place).
 */
class BuildListening extends Command
{
    protected $signature = 'lessons:listening {trilha} {lesson} {--part=A} {--format=answer} {--owner=aurora@lessongenerator.app} {--by=Thiago} {--redo}';
    protected $description = 'Add a listening activity (answer / who / complete / message) to an Aurora Business lesson';

    public function handle(ListeningMaker $maker, LessonDrafter $drafter): int
    {
        $trilha = $this->argument('trilha');
        $lesson = (int) $this->argument('lesson');
        $part = strtoupper($this->option('part'));
        $format = $this->option('format');
        if (! isset(LessonDrafter::LEVEL[$trilha])) { $this->error('Business courses only: ' . implode(', ', array_keys(LessonDrafter::LEVEL))); return 1; }
        $owner = User::where('email', $this->option('owner'))->firstOrFail();

        $here = Activity::where('user_id', $owner->id)->where('trilha', $trilha)->where('trilha_lesson', $lesson)
            ->where(fn ($q) => $part === 'A' ? $q->where('trilha_part', 'A')->orWhereNull('trilha_part') : $q->where('trilha_part', $part))->get();
        $reading = $here->firstWhere('type', 'reading_text');
        if (! $reading) { $this->error("{$lesson}{$part} has no reading."); return 1; }
        $existing = $here->first(fn ($a) => $a->type === 'listening' && ($a->content['format'] ?? null) === $format);
        if ($existing && ! $this->option('redo')) { $this->line("{$lesson}{$part}: {$format} already there (#{$existing->id})"); return 0; }

        try {
            $content = $maker->make($format, $reading, LessonDrafter::LEVEL[$trilha], (string) $drafter->unitPlan($owner->id, $trilha, $lesson));
        } catch (Throwable $e) {
            $this->error("{$lesson}{$part} {$format}: " . $e->getMessage());
            return 1;
        }
        $name = LessonBuilder::nameFor($trilha, $lesson, $part, 'listening', ListeningMaker::LABELS[$format]);
        if ($existing) {
            $existing->update(['content' => $content]);
            $a = $existing;
        } else {
            $a = Activity::create([
                'user_id' => $owner->id, 'name' => $name, 'type' => 'listening', 'content' => $content,
                'trilha' => $trilha, 'trilha_lesson' => $lesson, 'trilha_part' => $part, 'stage' => 'practice',
                'built_by' => $this->option('by'), 'student_visible' => true,
            ]);
        }
        $n = count($content['items'] ?? $content['gaps'] ?? $content['fields'] ?? []);
        $this->info("{$lesson}{$part}: ✓ {$a->name} (#{$a->id}) — {$n} items, " . count($content['lines']) . ' lines voiced');
        return 0;
    }
}
