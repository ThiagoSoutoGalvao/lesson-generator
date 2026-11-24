<?php

namespace App\Services;

use App\Models\Activity;
use Throwable;

/**
 * Builds Aurora Business lessons with no teacher in the loop (2026-11-25, `php artisan lessons:build`) — the same
 * steps as the lesson pack's "Build this lesson" panel, run on the server so a whole unit can be made while the
 * teacher is teaching:
 *   1. a new unit with no plan → Claude writes the unit plan (saved in the unit's brief);
 *   2. no reading / presentation → Claude drafts their prompts, then both are written and saved (Presentation stage);
 *   3. the suggested grid (data/lessonGrids.json — the fewest formats shared with the previous lesson) is made from
 *      them, each activity saved HIDDEN from students (student_visible = false) until the teacher approves it.
 * Anything that already exists is kept and skipped, so running it again only fills what's missing.
 */
class LessonBuilder
{
    private const LABEL = ['FirstSteps' => 'FIRST STEPS', 'EverydayBusiness' => 'EVERYDAY BUSINESS', 'TakeTheLead' => 'TAKE THE LEAD'];
    private const TYPE_LABELS = [
        'quiz' => 'Quiz', 'flashcards' => 'Flashcards', 'unjumble' => 'Unjumble', 'dialog_gap_fill' => 'Dialog',
        'word_categorisation' => 'Categorise', 'true_false' => 'True / False', 'image_vocab_match' => 'Image Match',
        'word_formation' => 'Word Formation', 'odd_one_out' => 'Odd One Out', 'cloze' => 'Cloze', 'open_cloze' => 'Open Cloze',
        'mc_cloze' => 'MC Cloze', 'mc_reading' => 'Reading (MC)', 'read_complete' => 'Read & Complete',
        'discussion_questions' => 'Discussion', 'sentence_transformation' => 'Transform', 'error_correction' => 'Error Correction',
        'match_pairs' => 'Match Pairs', 'signs_notices' => 'Signs & Notices', 'picture_prompts' => 'Picture Prompts',
        'role_play' => 'Role-play', 'story_builder' => 'Story Builder', 'debate' => 'Debate', 'mini_presentation' => 'Mini Presentation',
        'presentation' => 'Presentation', 'reading_text' => 'Reading Text',
    ];
    // Same sentence as GROUP in resources/js/lib/lessonGrids.js.
    private const GROUP = ' The class is a small group of 2–4 adults: items are short enough to take in turns, and speaking tasks are for pairs or the whole group (Ask your partner…, Find someone who…).';
    private const PART_ORDER = ['A' => ['reading', 'vocabulary', 'grammar'], 'B' => ['grammar', 'check', 'reading'], 'C' => ['simulation', 'grammar', 'reading']];

    /** @var callable(string): void */
    private $log;

    public function __construct(private ClaudeService $claude, private LessonDrafter $drafter, private ActivityMaker $maker) {}

    /** Builds one lesson (e.g. 4 + 'B'). Returns [made, failed] activity counts; throws if the lesson's material can't be made. */
    // Who the cards say built it — the teacher running the build, not Claude (Thiago, 2026-11-25: students and
    // teachers are still wary of AI, so it reads like every other lesson).
    private string $by = 'Thiago';

    public function build(int $userId, string $trilha, int $lesson, string $part, callable $log, string $by = 'Thiago'): array
    {
        $this->log = $log;
        $this->by = $by;
        $level = LessonDrafter::LEVEL[$trilha];
        $code = "{$lesson}{$part}";
        $here = fn () => Activity::where('user_id', $userId)->where('trilha', $trilha)->where('trilha_lesson', $lesson)
            ->where(fn ($q) => $part === 'A' ? $q->where('trilha_part', 'A')->orWhereNull('trilha_part') : $q->where('trilha_part', $part))
            ->orderBy('id')->get();

        // 1 + 2: the unit plan and the lesson's material
        $acts = $here();
        $reading = $acts->firstWhere('type', 'reading_text');
        $pres = $acts->first(fn ($a) => in_array($a->type, ['presentation', 'grammar_explainer'], true));
        if (! $reading || ! $pres) {
            if (! $this->drafter->unitPlan($userId, $trilha, $lesson)) {
                $this->say("{$code}: writing the unit plan…");
                $plan = $this->drafter->writeUnitPlan($userId, $trilha, $lesson, $by);
                $this->say('  ' . str_replace("\n", "\n  ", trim($plan)));
            }
            $earlier = $this->earlierSummary($userId, $trilha, $lesson, $part);
            $this->say("{$code}: drafting the reading and presentation…");
            $draft = $this->drafter->draft($userId, $trilha, $lesson, $part, LessonDrafter::syllabus($trilha, $lesson), $earlier);
            if (! $reading) {
                $r = $draft['reading'];
                $this->say("{$code}: writing the reading “{$r['topic']}”…");
                $content = $this->claude->generateReadingText($r['topic'], $r['vocabulary'], $r['paragraphs'], $r['extra'], $level);
                $reading = $this->save($userId, $trilha, $lesson, $part, 'reading_text', 'presentation', $content, preg_split('/[—:–]/u', $r['topic'])[0], true);
            }
            if (! $pres) {
                $p = $draft['presentation'];
                $this->say("{$code}: writing the presentation “{$p['topic']}”…");
                $content = $this->claude->generatePresentation($p['topic'], $p['extra'], $p['slides']);
                $pres = $this->save($userId, $trilha, $lesson, $part, 'presentation', 'presentation', $content, $p['topic'], true);
            }
        }

        // 3: the grid
        $grid = $this->defaultGrid($part, $this->previousLessonTypes($userId, $trilha, $lesson, $part));
        $this->say("{$code}: grid “{$grid['label']}”");
        $earlier = $this->earlierSummary($userId, $trilha, $lesson, $part);
        $made = 0; $failed = 0;
        foreach ($grid['slots'] as $slot) {
            if ($here()->contains(fn ($a) => $a->stage === $slot['stage'] && $a->type === $slot['type'])) {
                $this->say("  - {$slot['stage']} {$slot['type']}: already there");
                continue;
            }
            $src = $slot['source'] === 'presentation' ? ($pres ?? $reading) : ($reading ?? $pres);
            try {
                $source = ActivityMaker::withEarlier(\App\Support\LessonMaterial::sourceFor($src) ?? throw new \RuntimeException('the lesson material has no text'), $earlier);
                $content = $this->maker->make($slot['type'], $source, mb_substr($slot['prompt'] . self::GROUP, 0, 1000), $level, true);
                $a = $this->save($userId, $trilha, $lesson, $part, $slot['type'], $slot['stage'], $content, $content['topic'] ?? $content['title'] ?? '', false);
                $this->say("  ✓ {$slot['stage']} {$a->name}");
                $made++;
            } catch (Throwable $e) {
                $this->say("  ✗ {$slot['stage']} {$slot['type']}: " . $e->getMessage());
                $failed++;
            }
        }
        return [$made, $failed];
    }

    private function save(int $userId, string $trilha, int $lesson, string $part, string $type, string $stage, array $content, string $focus, bool $visible): Activity
    {
        $focus = trim(preg_replace('/\s+/u', ' ', str_replace(['·', '•'], ' ', $focus)));
        $words = array_slice(explode(' ', $focus), 0, 6);
        while (count($words) > 1 && in_array(mb_strtolower(rtrim(end($words), ',:;')), ['a', 'an', 'the', 'at', 'of', 'in', 'on', 'to', 'and', 'or', 'with', 'for', 'new', 'by', 'from'], true)) {
            array_pop($words);
        }
        $focus = rtrim(implode(' ', $words), ',:;–—-') ?: (self::TYPE_LABELS[$type] ?? $type);
        $focus = mb_strtoupper(mb_substr($focus, 0, 1)) . mb_substr($focus, 1);
        $name = sprintf('%s L%02d%s · %s · %s', self::LABEL[$trilha], $lesson, $part, self::TYPE_LABELS[$type] ?? $type, $focus);
        return Activity::create([
            'user_id' => $userId, 'name' => $name, 'type' => $type, 'content' => $content,
            'trilha' => $trilha, 'trilha_lesson' => $lesson, 'trilha_part' => $part, 'stage' => $stage,
            'built_by' => $this->by, 'student_visible' => $visible,
        ]);
    }

    private function say(string $line): void
    {
        ($this->log)($line);
    }

    // ── Ports of resources/js/lib/lessonGrids.js (keep in step) ─────────────────────────────────────────────

    private static function order(int $lesson, ?string $part): int
    {
        return $lesson * 10 + (ord($part ?? 'A') - 64);
    }

    /** The business grids. Every slot in them is a light (business) format, so no filtering is needed here. */
    private function grids(): array
    {
        $all = json_decode(file_get_contents(resource_path('js/data/lessonGrids.json')), true);
        return array_values(array_filter($all, fn ($g) => in_array('business', $g['courses'], true)));
    }

    private function defaultGrid(string $part, array $previousTypes): array
    {
        $order = self::PART_ORDER[$part] ?? [];
        $grids = $this->grids();
        // A C lesson is the unit's simulation: always the Simulation grid (2026-11-25 — 4C lost it on overlap).
        foreach ($grids as $g) if ($part === 'C' && $g['id'] === 'simulation') return $g;
        usort($grids, function ($a, $b) use ($order, $previousTypes) {
            $ov = fn ($g) => count(array_filter($g['slots'], fn ($s) => in_array($s['type'], $previousTypes, true)));
            $rk = fn ($g) => ($i = array_search($g['id'], $order, true)) === false ? 99 : $i;
            return [$ov($a), $rk($a)] <=> [$ov($b), $rk($b)];
        });
        return $grids[0];
    }

    private function courseActivities(int $userId, string $trilha)
    {
        return Activity::where('user_id', $userId)->where('trilha', $trilha)->whereNotNull('trilha_lesson')->orderByDesc('id')->get();
    }

    private function previousLessonTypes(int $userId, string $trilha, int $lesson, string $part): array
    {
        $here = self::order($lesson, $part);
        $all = $this->courseActivities($userId, $trilha);
        $best = $all->map(fn ($a) => self::order($a->trilha_lesson, $a->trilha_part))->filter(fn ($o) => $o < $here)->max();
        return $best === null ? [] : $all->filter(fn ($a) => self::order($a->trilha_lesson, $a->trilha_part) === $best)->pluck('type')->all();
    }

    private function earlierSummary(int $userId, string $trilha, int $lesson, string $part, int $max = 4): string
    {
        $here = self::order($lesson, $part);
        $by = [];
        foreach ($this->courseActivities($userId, $trilha) as $a) {
            $o = self::order($a->trilha_lesson, $a->trilha_part);
            if ($o >= $here) continue;
            $by[$o]['code'] = $a->trilha_lesson . ($a->trilha_part ?? 'A');
            $by[$o]['items'][] = $a;
        }
        krsort($by);
        $lines = [];
        foreach (array_reverse(array_slice($by, 0, $max, true), true) as $l) {
            $items = collect($l['items']);
            $reading = $items->firstWhere('type', 'reading_text');
            $pres = $items->first(fn ($a) => in_array($a->type, ['presentation', 'grammar_explainer'], true));
            $focus = fn ($a) => last(explode(' · ', (string) $a->name));
            $bits = [];
            if ($pres) $bits[] = '“' . ($pres->content['title'] ?? $pres->content['topic'] ?? $focus($pres)) . '”';
            if ($pres) $bits[0] = 'presentation ' . $bits[0];
            if ($reading) {
                $words = array_slice(array_filter(array_map(fn ($v) => $v['word'] ?? null, (array) ($reading->content['vocabulary'] ?? []))), 0, 10);
                $bits[] = 'reading “' . ($reading->content['topic'] ?? $focus($reading)) . '”' . ($words ? ' (words: ' . implode(', ', $words) . ')' : '');
            }
            if ($bits) $lines[] = "- Lesson {$l['code']}: " . implode('; ', $bits);
        }
        return mb_substr(implode("\n", $lines), 0, 1500);
    }
}
