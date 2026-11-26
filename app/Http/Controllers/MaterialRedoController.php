<?php

namespace App\Http\Controllers;

use App\Jobs\RemakeFromMaterialJob;
use App\Models\Activity;
use App\Services\ClaudeService;
use App\Services\LessonBuilder;
use App\Services\LessonDrafter;
use App\Support\LessonMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use RuntimeException;

/**
 * A lesson's reading / presentation, replaced from the lesson pack (2026-11-26, Aurora Business courses):
 *  - preview: Claude writes a new version (the teacher can say what should change). Nothing is saved.
 *  - approve: the teacher's chosen version (a new one, or the old one edited by hand) replaces the content in place,
 *    and — when asked — RemakeFromMaterialJob remakes the activities made from it.
 *  - status: how that remake is going.
 */
class MaterialRedoController extends Controller
{
    private const TYPES = ['reading_text', 'presentation'];

    public function preview(Request $request, Activity $activity, LessonDrafter $drafter, ClaudeService $claude)
    {
        $this->check($activity);
        $request->validate(['note' => ['nullable', 'string', 'max:1000']]);
        $reading = $activity->type === 'reading_text';
        $part = $activity->trilha_part ?? 'A';
        try {
            $draft = $drafter->draft(
                $activity->user_id, $activity->trilha, (int) $activity->trilha_lesson, $part,
                LessonDrafter::syllabus($activity->trilha, (int) $activity->trilha_lesson), null,
                ['what' => $reading ? 'reading' : 'presentation', 'text' => LessonMaterial::text($activity), 'note' => $request->input('note')],
            );
            if ($reading) {
                $r = $draft['reading'];
                $content = $claude->generateReadingText($r['topic'], $r['vocabulary'], $r['paragraphs'], $r['extra'], $r['level']);
            } else {
                $p = $draft['presentation'];
                $content = $claude->generatePresentation($p['topic'], $p['extra'], $p['slides']);
            }
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
        return response()->json(['content' => $content]);
    }

    public function approve(Request $request, Activity $activity)
    {
        $this->check($activity);
        $reading = $activity->type === 'reading_text';
        $request->validate(array_merge([
            'content'       => ['required', 'array'],
            'content.topic' => ['nullable', 'string', 'max:200'],
            'remake'        => ['boolean'],
        ], $reading ? [
            'content.paragraphs'   => ['required', 'array', 'min:1', 'max:12'],
            'content.paragraphs.*' => ['required', 'string', 'max:4000'],
        ] : [
            'content.slides'         => ['required', 'array', 'min:1', 'max:15'],
            'content.slides.*.title' => ['required', 'string', 'max:300'],
        ]));

        $content = array_merge($request->input('content'), ['type' => $activity->type]);
        $topic = trim((string) ($content['topic'] ?? ''));
        $update = ['content' => $content];
        if ($topic !== '' && isset(LessonDrafter::BUSINESS[$activity->trilha])) {
            $focus = $reading ? preg_split('/[—:–]/u', $topic)[0] : $topic;
            $update['name'] = LessonBuilder::nameFor($activity->trilha, (int) $activity->trilha_lesson, $activity->trilha_part ?? 'A', $activity->type, $focus);
        }
        $activity->update($update);

        if ($request->boolean('remake', true)) {
            Cache::put(RemakeFromMaterialJob::statusKey($activity->id), ['state' => 'queued', 'done' => 0, 'failed' => 0], now()->addDay());
            RemakeFromMaterialJob::dispatch($activity->id);
        }
        return response()->json(['activity' => $activity->fresh(), 'remaking' => $request->boolean('remake', true)]);
    }

    public function status(Activity $activity)
    {
        abort_if($activity->user_id !== auth()->id(), 403);
        return response()->json(Cache::get(RemakeFromMaterialJob::statusKey($activity->id)) ?? ['state' => 'none']);
    }

    private function check(Activity $activity): void
    {
        abort_if($activity->user_id !== auth()->id(), 403);
        abort_unless(in_array($activity->type, self::TYPES, true), 422, 'Only a reading or a presentation can be replaced.');
        abort_unless(isset(LessonDrafter::BUSINESS[$activity->trilha]) && $activity->trilha_lesson, 422, 'This works for Aurora Business lessons.');
    }
}
