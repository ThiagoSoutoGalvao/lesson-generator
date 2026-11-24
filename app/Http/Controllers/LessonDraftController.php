<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Services\ClaudeService;
use App\Support\LessonMaterial;
use App\Support\Trilhas;
use Illuminate\Http\Request;

/**
 * "Build this lesson", step 2 (2026-11-25): when a lesson has no reading or presentation yet, Claude drafts the
 * two prompts (the Reading Text and Presentation form fields) for the teacher to check and edit. It works from the
 * unit's syllabus line, the unit plan file (docs/aurora-business/units/…), this unit's earlier lessons and the
 * companies already used. Aurora Business courses only. Nothing is saved here.
 */
class LessonDraftController extends Controller
{
    private const BUSINESS = ['FirstSteps' => 'first-steps', 'EverydayBusiness' => 'everyday-business', 'TakeTheLead' => 'take-the-lead'];
    private const LEVEL    = ['FirstSteps' => 'A2', 'EverydayBusiness' => 'B1', 'TakeTheLead' => 'B2'];

    public function draft(Request $request, ClaudeService $claude)
    {
        $request->validate([
            'trilha'   => ['required', Trilhas::rule()],
            'lesson'   => ['required', 'integer', 'min:1', 'max:30'],
            'part'     => ['nullable', 'in:A,B,C'],
            'syllabus' => ['nullable', 'string', 'max:1000'],
            'earlier'  => ['nullable', 'string', 'max:1500'],
        ]);
        $trilha = $request->trilha;
        if (! isset(self::BUSINESS[$trilha])) {
            return response()->json(['message' => 'Drafting the reading and presentation is for Aurora Business courses.'], 422);
        }
        $lesson = (int) $request->lesson;
        $part   = $request->input('part') ?? 'A';
        $cefr   = self::LEVEL[$trilha];
        $code   = "{$lesson}{$part}";

        $plan = $this->unitPlan($trilha, $lesson);
        $unitSoFar = $this->unitSoFar($trilha, $lesson, $part);
        $used = $this->usedCompanies($trilha, $lesson);

        $ctx = "Course: Aurora Business, {$cefr} level. Lesson {$code} (unit {$lesson}, lesson {$part} of A / B / C: A = input, B = practice, C = a realistic workplace simulation).\n";
        $ctx .= "Unit syllabus:\n" . trim((string) $request->input('syllabus')) . "\n";
        if ($plan) $ctx .= "\nThe unit plan (follow it: cast, company, what is new in each lesson):\n{$plan}\n";
        if ($unitSoFar) $ctx .= "\nThis unit's earlier lessons (same cast and company — continue the story, don't repeat it):\n{$unitSoFar}\n";
        if ($request->filled('earlier')) $ctx .= "\nThe course's recent lessons:\n" . trim($request->input('earlier')) . "\n";
        if ($used) $ctx .= "\nCompanies already used in this course (never reuse one): " . implode('; ', $used) . "\n";

        $rules = <<<TXT
You plan Aurora Business lessons. Draft the prompts a teacher will paste into two tools that write the lesson's core material: a Reading Text and a Presentation. Return JSON:
{"reading": {"topic": "...", "vocabulary": "...", "paragraphs": 4, "extra": "..."}, "presentation": {"topic": "...", "extra": "...", "slides": 6}}

Rules:
- Something new every lesson: introduce the language that is new in lesson {$code} (from the unit plan if there is one, otherwise the right step of the unit's syllabus for lesson {$part}). Don't re-teach what the unit's earlier lessons already taught.
- Office work only (emails, calls, meetings, routines, admin) even when the company is in another industry. A fictional company: never a real company's name. If the unit plan or the unit's earlier lessons name the company and cast, use them; for a new unit, invent a new company (a different kind of workplace from those already used) and 3–4 people with first names and office jobs.
- The class is a small group of 2–4 adults. The reading should work in a group: each paragraph makes sense on its own (each student can read one), or it is a dialogue / interview pairs can read in roles.
- Never mention the students' nationality or first language. Say "common mistakes", not whose mistakes.
- reading.topic: a short title + a one-line premise, under 150 characters. reading.vocabulary: 6–10 comma-separated words or phrases at {$cefr} level that the lesson needs. reading.paragraphs: 3–6. reading.extra: under 2 short paragraphs and under 1200 characters: the genre and voice, the cast, the target language to include (several times, in natural sentences), "use every target word at least once", what to avoid, how to end.
- presentation.topic: the language point as a short title, under 120 characters. presentation.extra: under 1200 characters: "{$cefr} level" (the tool has no level setting), the forms to teach with examples from the reading's cast and company, a slide of common mistakes, short check questions for the group. presentation.slides: 5–8.
- Plain English the teacher can edit. No markdown.
TXT;

        try {
            $data = $claude->askJson([['type' => 'text', 'text' => $ctx . "\n" . $rules]]);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
        $r = $data['reading'] ?? [];
        $p = $data['presentation'] ?? [];
        $cut = fn ($s, $n) => mb_substr(trim((string) $s), 0, $n);
        if ($cut($r['topic'] ?? '', 1) === '' || $cut($p['topic'] ?? '', 1) === '') {
            return response()->json(['message' => 'Claude could not draft this lesson — please try again.'], 502);
        }

        return response()->json([
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
        ]);
    }

    /** The unit plan file, e.g. docs/aurora-business/units/first-steps-03.md, if there is one. */
    private function unitPlan(string $trilha, int $lesson): ?string
    {
        $file = base_path(sprintf('docs/aurora-business/units/%s-%02d.md', self::BUSINESS[$trilha], $lesson));
        return is_file($file) ? mb_substr(file_get_contents($file), 0, 3000) : null;
    }

    /** This unit's readings and presentations from the parts before this one (B sees A; C sees A and B). */
    private function unitSoFar(string $trilha, int $lesson, string $part): string
    {
        $out = '';
        foreach ($this->materials($trilha)->where('trilha_lesson', $lesson) as $a) {
            $p = $a->trilha_part ?? 'A';
            if ($p >= $part) continue;
            $out .= "- {$a->name}:\n" . mb_substr(LessonMaterial::text($a), 0, 1500) . "\n";
        }
        return mb_substr($out, 0, 4000);
    }

    /** Companies named in earlier unit plans, plus the opening of each earlier unit's first reading. */
    private function usedCompanies(string $trilha, int $lesson): array
    {
        $used = [];
        foreach (glob(base_path('docs/aurora-business/units/*.md')) ?: [] as $f) {
            if (preg_match('/^Company:\s*(.+)$/mi', file_get_contents($f), $m)) $used[] = mb_substr(trim($m[1]), 0, 120);
        }
        $first = $this->materials($trilha)->where('type', 'reading_text')->where('trilha_lesson', '<', $lesson)
            ->groupBy('trilha_lesson')->map->first();
        foreach ($first as $a) {
            $used[] = "(lesson {$a->trilha_lesson} reading opens:) " . mb_substr(LessonMaterial::text($a), 0, 160);
        }
        return array_slice($used, 0, 20);
    }

    private function materials(string $trilha)
    {
        return Activity::where('user_id', auth()->id())->where('trilha', $trilha)
            ->whereIn('type', ['reading_text', 'presentation'])
            ->orderBy('trilha_lesson')->orderBy('trilha_part')->orderBy('id')->get();
    }
}
