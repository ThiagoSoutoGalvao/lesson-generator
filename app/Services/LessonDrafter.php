<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\TrilhaLessonBrief;
use App\Support\LessonMaterial;
use RuntimeException;

/**
 * Aurora Business lesson planning by Claude (2026-11-25), shared by the pack's "Draft the reading and presentation"
 * (LessonDraftController) and the lesson builder (lessons:build):
 *  - unitPlan(): the unit plan — the repo file docs/aurora-business/units/<course>-<NN>.md if there is one, otherwise
 *    the unit's brief (the 📝 brief editor's fields), which writeUnitPlan() fills for a new unit;
 *  - draft(): the Reading Text + Presentation form fields for one lesson.
 */
class LessonDrafter
{
    public const BUSINESS = ['FirstSteps' => 'first-steps', 'EverydayBusiness' => 'everyday-business', 'TakeTheLead' => 'take-the-lead'];
    public const LEVEL    = ['FirstSteps' => 'A2', 'EverydayBusiness' => 'B1', 'TakeTheLead' => 'B2'];

    public function __construct(private ClaudeService $claude) {}

    /** The unit's syllabus lines (resources/js/data/businessToc.json, shared with the app). */
    public static function syllabus(string $trilha, int $lesson): string
    {
        static $toc = null;
        $toc ??= json_decode(file_get_contents(resource_path('js/data/businessToc.json')), true);
        return implode("\n", $toc[$trilha][(string) $lesson] ?? []);
    }

    public function unitPlan(int $userId, string $trilha, int $lesson): ?string
    {
        $file = base_path(sprintf('docs/aurora-business/units/%s-%02d.md', self::BUSINESS[$trilha], $lesson));
        if (is_file($file)) {
            return mb_substr(file_get_contents($file), 0, 3000);
        }
        $b = TrilhaLessonBrief::where('user_id', $userId)->where('trilha', $trilha)->where('trilha_lesson', $lesson)->first();
        if (! $b || (! filled($b->level_notes) && ! $b->part_plans)) {
            return null;
        }
        $out = "Language: {$b->target_language}\nVocabulary: {$b->vocabulary}\n{$b->level_notes}\n";
        foreach ((array) $b->part_plans as $p => $line) {
            $out .= "Lesson {$lesson}{$p}: {$line}\n";
        }
        return mb_substr($out, 0, 3000);
    }

    /** A new unit's plan (company, cast, what's new in A / B / C), saved in the unit's brief. Returns the plan text. */
    public function writeUnitPlan(int $userId, string $trilha, int $lesson, string $by = 'Thiago'): string
    {
        $cefr = self::LEVEL[$trilha];
        $used = $this->usedCompanies($userId, $trilha, $lesson);
        $prompt = "Plan unit {$lesson} of an Aurora Business course ({$cefr}), taught as three 60-minute lessons A / B / C to a small group of 2–4 adults: "
            . "A = input, B = practice, C = a realistic workplace simulation. Unit syllabus:\n" . self::syllabus($trilha, $lesson) . "\n"
            . ($used ? "\nCompanies and casts already used in this course (never reuse a company or a first name; pick a different kind of workplace): " . implode('; ', $used) . "\n" : '')
            . <<<TXT

Return JSON:
{"company": "ONLY your final choice — a fictional company: name, kind of workplace, city (office work only — e.g. 'Serra Azul Logística, a logistics company, office in Belo Horizonte')",
 "cast": "3–4 people with first names and office jobs, e.g. 'Paula (sales assistant), Bruno (account manager)'",
 "language": "the unit's target language", "vocabulary": "8–12 words or phrases",
 "mistakes": "2–3 common mistakes with this language, written as wrong → right",
 "A": "what lesson A's reading is about (flowing text: a story, email, blog post, interview or chat — never a calendar, table or list) and the language that is NEW in A", "B": "the same for B (new language, not A's again)", "C": "the same for C, ending in the simulation"}
Rules: each field holds only your final answer — no reasoning, no "X is not used; instead…"; never a real company's name; never mention the students' nationality or first language; each lesson adds something new; plain English, no markdown.
TXT;
        // Up to 2 tries: a plan with a missing field also stopped a build (EB 10A, 2026-11-26).
        for ($try = 1; ; $try++) {
            $d = $this->askJsonTwice([['type' => 'text', 'text' => $prompt]]);
            $d['company'] = self::finalAnswer((string) ($d['company'] ?? ''));
            $missing = array_values(array_filter(['company', 'cast', 'A', 'B', 'C'], fn ($k) => ! filled($d[$k] ?? null)));
            if (! $missing) break;
            if ($try >= 2) throw new RuntimeException("Claude's unit plan for unit {$lesson} is missing “{$missing[0]}”.");
        }
        $s = fn ($v, $n = 600) => mb_substr(trim(is_array($v) ? implode(', ', $v) : (string) $v), 0, $n);
        TrilhaLessonBrief::updateOrCreate(
            ['user_id' => $userId, 'trilha' => $trilha, 'trilha_lesson' => $lesson],
            [
                'target_language' => $s($d['language'] ?? ''),
                'vocabulary'      => $s($d['vocabulary'] ?? ''),
                'level_notes'     => "Company: " . $s($d['company']) . "\nCast: " . $s($d['cast']) . "\nCommon mistakes: " . $s($d['mistakes'] ?? ''),
                'part_plans'      => ['A' => $s($d['A'], 1200), 'B' => $s($d['B'], 1200), 'C' => $s($d['C'], 1200)],
                'updated_by'      => $by,
            ],
        );
        return (string) $this->unitPlan($userId, $trilha, $lesson);
    }

    /** The Reading Text + Presentation form fields for one lesson. */
    /**
     * $redo (2026-11-26, "Write a new version"): the material a teacher wants replaced — ['what' => 'reading' |
     * 'presentation', 'text' => its current text, 'note' => what should change]. The draft then avoids repeating it.
     */
    public function draft(int $userId, string $trilha, int $lesson, string $part, string $syllabus, ?string $earlier, ?array $redo = null): array
    {
        $cefr = self::LEVEL[$trilha];
        $code = "{$lesson}{$part}";
        $plan = $this->unitPlan($userId, $trilha, $lesson);
        $unitSoFar = $this->unitSoFar($userId, $trilha, $lesson, $part);
        $used = $this->usedCompanies($userId, $trilha, $lesson);

        $ctx = "Course: Aurora Business, {$cefr} level. Lesson {$code} (unit {$lesson}, lesson {$part} of A / B / C: A = input, B = practice, C = a realistic workplace simulation).\n";
        $ctx .= "Unit syllabus:\n" . trim($syllabus) . "\n";
        if ($plan) $ctx .= "\nThe unit plan (follow it: cast, company, what is new in each lesson):\n{$plan}\n";
        if ($unitSoFar) $ctx .= "\nThis unit's earlier lessons (same cast and company — continue the story, don't repeat it):\n{$unitSoFar}\n";
        if (filled($earlier)) $ctx .= "\nThe course's recent lessons:\n" . trim($earlier) . "\n";
        if ($used && ! $plan) $ctx .= "\nCompanies already used in this course (never reuse one): " . implode('; ', $used) . "\n";
        if ($redo) {
            $note = trim((string) ($redo['note'] ?? '')) ?: 'It did not work well in class. Make it clearer and more natural.';
            $ctx .= "\nThe teacher asked for a NEW version of this lesson's {$redo['what']}. Keep the same cast, company and target language, "
                . "but write a different, better one. What the teacher wants changed: {$note}\nThe current {$redo['what']} (don't repeat it):\n"
                . mb_substr(trim((string) $redo['text']), 0, 1800) . "\n";
        }

        $rules = <<<TXT
You plan Aurora Business lessons. Draft the prompts a teacher will paste into two tools that write the lesson's core material: a Reading Text and a Presentation. Return JSON:
{"reading": {"topic": "...", "vocabulary": "...", "paragraphs": 4, "extra": "..."}, "presentation": {"topic": "...", "extra": "...", "slides": 6}}

Rules:
- Something new every lesson: introduce the language that is new in lesson {$code} (from the unit plan if there is one, otherwise the right step of the unit's syllabus for lesson {$part}). Don't re-teach what the unit's earlier lessons already taught.
- Office work only (emails, calls, meetings, routines, admin) even when the company is in another industry. A fictional company: never a real company's name. If the unit plan or the unit's earlier lessons name the company and cast, use them; for a new unit, invent a new company (a different kind of workplace from those already used) and 3–4 people with first names and office jobs.
- The reading is FLOWING TEXT that reads naturally from start to finish: a short story, an email, a blog post, an interview or a chat. Never a calendar, timetable, table, form or list of slots, and no sentence pattern repeated line after line ("Monday: … Tuesday: …"). Facts like days and times go inside natural sentences. Say this in reading.extra.
- When the reading is an email or an email thread, reading.extra must ask for each email as its own paragraph in this shape, with real line breaks: "From: …", "To: …", "Subject: …" on three lines, an empty line, the greeting on its own line ("Dear Helena,"), the body, an empty line, the sign-off ("Best regards,") and the name on their own lines. No notes to the reader inside an email (never "You say it like this: …"); spelling-out help belongs in the presentation.
- The class is a small group of 2–4 adults. The reading should work in a group: each paragraph makes sense on its own (each student can read one), or it is a dialogue / interview pairs can read in roles.
- Never mention the students' nationality or first language. Say "common mistakes", not whose mistakes.
- reading.topic: a short title + a one-line premise, under 150 characters. reading.vocabulary: 6–10 comma-separated words or phrases at {$cefr} level that the lesson needs. reading.paragraphs: 3–6. reading.extra: under 2 short paragraphs and under 1200 characters: the genre and voice, the cast, the target language to include (several times, in natural sentences), "use every target word at least once", what to avoid, how to end.
- presentation.topic: the language point as a short title, under 120 characters. presentation.extra: under 1200 characters: "{$cefr} level" (the tool has no level setting), the forms to teach with examples from the reading's cast and company, a slide of common mistakes, short check questions for the group. presentation.slides: 5–8.
- Plain English the teacher can edit. No markdown.
TXT;

        $data = $this->askJsonTwice([['type' => 'text', 'text' => $ctx . "\n" . $rules]]);
        $r = $data['reading'] ?? [];
        $p = $data['presentation'] ?? [];
        $cut = fn ($s, $n) => mb_substr(trim(is_array($s) ? implode(', ', $s) : (string) $s), 0, $n);
        if ($cut($r['topic'] ?? '', 1) === '' || $cut($p['topic'] ?? '', 1) === '') {
            throw new RuntimeException('Claude could not draft this lesson — please try again.');
        }
        return [
            'reading' => [
                'topic'      => $cut($r['topic'], 200),
                'vocabulary' => $cut($r['vocabulary'] ?? '', 500),
                'paragraphs' => max(1, min(10, (int) ($r['paragraphs'] ?? 4))),
                'extra'      => $cut($r['extra'] ?? '', 3000),
                'level'      => $cefr,
            ],
            'presentation' => [
                'topic'  => $cut($p['topic'], 200),
                'extra'  => $cut($p['extra'] ?? '', 3000),
                'slides' => max(4, min(10, (int) ($p['slides'] ?? 6))),
            ],
        ];
    }

    /** One retry when Claude's reply isn't valid JSON (2026-11-26: a build stopped at EB 9A on one bad reply). */
    private function askJsonTwice(array $content): array
    {
        try {
            return $this->claude->askJson($content);
        } catch (RuntimeException $e) {
            return $this->claude->askJson($content);
        }
    }

    /** "X is not used; instead: Y is not used either; final answer: Z" → "Z" (Claude sometimes reasons in the field). */
    public static function finalAnswer(string $s): string
    {
        $s = trim($s);
        if (! preg_match('/is not used|is also used|instead|final (?:answer|choice)|chosen|No —/iu', $s)) {
            return $s;
        }
        $parts = preg_split('/(?:final answer|final choice|chosen company|chosen|instead|No —)\s*:?\s*/iu', $s);
        return trim((string) end($parts), " ;:.");
    }

    /** This unit's readings and presentations from the parts before this one (B sees A; C sees A and B). */
    private function unitSoFar(int $userId, string $trilha, int $lesson, string $part): string
    {
        $out = '';
        foreach ($this->materials($userId, $trilha)->where('trilha_lesson', $lesson) as $a) {
            if (($a->trilha_part ?? 'A') >= $part) continue;
            $out .= "- {$a->name}:\n" . mb_substr(LessonMaterial::text($a), 0, 1500) . "\n";
        }
        return mb_substr($out, 0, 4000);
    }

    /** Companies named in unit plan files and briefs, plus the opening of each earlier unit's first reading. */
    private function usedCompanies(int $userId, string $trilha, int $lesson): array
    {
        $used = [];
        foreach (glob(base_path('docs/aurora-business/units/*.md')) ?: [] as $f) {
            $txt = file_get_contents($f);
            if (preg_match('/^Company:\s*(.+)$/mi', $txt, $m)) $used[] = mb_substr(trim($m[1]), 0, 120);
            if (preg_match('/^Cast:\s*(.+)$/mi', $txt, $m)) $used[] = 'cast ' . mb_substr(trim($m[1]), 0, 160);
        }
        // Every business course's unit plans, not just this one's (2026-11-26: Everyday Business 2 reused First Steps 5's company).
        $briefs = TrilhaLessonBrief::where('user_id', $userId)->whereIn('trilha', array_keys(self::BUSINESS))
            ->where(fn ($q) => $q->where('trilha', '<>', $trilha)->orWhere('trilha_lesson', '<>', $lesson))->get();
        foreach ($briefs as $b) {
            if (preg_match('/^Company:\s*(.+)$/mi', (string) $b->level_notes, $m)) $used[] = mb_substr(trim($m[1]), 0, 120);
            if (preg_match('/^Cast:\s*(.+)$/mi', (string) $b->level_notes, $m)) $used[] = 'cast ' . mb_substr(trim($m[1]), 0, 160);
        }
        $first = $this->materials($userId, $trilha)->where('type', 'reading_text')->where('trilha_lesson', '<', $lesson)
            ->groupBy('trilha_lesson')->map->first();
        foreach ($first as $a) {
            $used[] = "(lesson {$a->trilha_lesson} reading opens:) " . mb_substr(LessonMaterial::text($a), 0, 160);
        }
        return array_slice(array_values(array_unique($used)), 0, 40);
    }

    private function materials(int $userId, string $trilha)
    {
        return Activity::where('user_id', $userId)->where('trilha', $trilha)
            ->whereIn('type', ['reading_text', 'presentation'])
            ->orderBy('trilha_lesson')->orderBy('trilha_part')->orderBy('id')->get();
    }
}
