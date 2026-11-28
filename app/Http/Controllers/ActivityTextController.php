<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;

/**
 * "Edit text" on an activity in the lesson pack (2026-11-27). The teacher fixes the WORDS of an activity by hand —
 * e.g. a Picture Prompts question that doesn't match its photo. Only text fields are taken from the request; everything
 * else (photos, credits, item count, type) is kept from the saved activity, so an edit can never break the screen.
 * Types so far: picture_prompts, discussion_questions.
 */
class ActivityTextController extends Controller
{
    public const TYPES = ['picture_prompts', 'discussion_questions', 'story_builder'];

    public function update(Request $request, Activity $activity)
    {
        abort_if($activity->user_id !== auth()->id(), 403);
        abort_unless(in_array($activity->type, self::TYPES, true), 422, 'This activity type cannot be edited here yet.');
        if ($activity->type === 'story_builder') return $this->updateStories($request, $activity);

        $items = $activity->type === 'picture_prompts' ? 'prompts' : 'questions';
        $lines = $activity->type === 'picture_prompts' ? 'starters' : 'follow_ups';
        $saved = (array) ($activity->content[$items] ?? []);

        $request->validate([
            'content'                         => ['required', 'array'],
            'content.topic'                   => ['nullable', 'string', 'max:200'],
            'content.targets'                 => ['sometimes', 'array', 'max:12'],
            'content.targets.*'               => ['nullable', 'string', 'max:80'],
            "content.{$items}"                => ['required', 'array', 'size:' . count($saved)],
            "content.{$items}.*.question"     => ['required', 'string', 'max:600'],
            "content.{$items}.*.{$lines}"     => ['sometimes', 'array', 'max:8'],
            "content.{$items}.*.{$lines}.*"   => ['nullable', 'string', 'max:300'],
        ], [
            "content.{$items}.*.question.required" => 'Every question needs some text.',
            "content.{$items}.size"                => 'The number of items cannot change here.',
        ]);

        $in = $request->input('content');
        $tidy = fn ($list) => array_values(array_filter(array_map(fn ($s) => trim((string) $s), (array) $list), fn ($s) => $s !== ''));
        $content = $activity->content;
        foreach ($saved as $i => $item) {
            $item['question'] = trim($in[$items][$i]['question']);
            if (array_key_exists($lines, $in[$items][$i])) $item[$lines] = $tidy($in[$items][$i][$lines]);
            $content[$items][$i] = $item;
        }
        if (trim((string) ($in['topic'] ?? '')) !== '') $content['topic'] = trim($in['topic']);
        if (array_key_exists('targets', $in)) $content['targets'] = $tidy($in['targets']);

        $activity->update(['content' => $content]);
        return response()->json(['activity' => $activity->fresh()]);
    }

    /**
     * Story Builder (2026-11-28): each step's "ask" (what is on screen — a question, or cues at B1+), its optional "full"
     * question (behind "Show the question") and the "word" the answer must use. Stories and steps can't be added or
     * removed here; old-style stories (`prompts`, no steps) are kept as they are.
     */
    private function updateStories(Request $request, Activity $activity)
    {
        $saved = (array) ($activity->content['stories'] ?? []);
        $request->validate([
            'content'                         => ['required', 'array'],
            'content.stories'                 => ['required', 'array', 'size:' . count($saved)],
            'content.stories.*.steps'         => ['sometimes', 'array', 'max:20'],
            'content.stories.*.steps.*.ask'   => ['required', 'string', 'max:300'],
            'content.stories.*.steps.*.full'  => ['nullable', 'string', 'max:300'],
            'content.stories.*.steps.*.word'  => ['nullable', 'string', 'max:60'],
        ], [
            'content.stories.*.steps.*.ask.required' => 'Every question needs some text.',
            'content.stories.size'                   => 'The number of stories cannot change here.',
        ]);

        $in = $request->input('content.stories');
        $content = $activity->content;
        foreach ($saved as $i => $story) {
            if (! isset($story['steps']) || ! is_array($story['steps'])) continue; // old-style story
            $steps = $in[$i]['steps'] ?? null;
            if (! is_array($steps) || count($steps) !== count($story['steps'])) {
                return response()->json(['message' => 'The number of questions cannot change here.', 'errors' => ['content.stories' => ['The number of questions cannot change here.']]], 422);
            }
            foreach ($story['steps'] as $j => $step) {
                $step['ask'] = trim($steps[$j]['ask']);
                $full = trim((string) ($steps[$j]['full'] ?? ''));
                if ($full === '') unset($step['full']); else $step['full'] = $full;
                $word = trim((string) ($steps[$j]['word'] ?? ''));
                if ($word === '') unset($step['word']); else $step['word'] = $word;
                $content['stories'][$i]['steps'][$j] = $step;
            }
        }

        $activity->update(['content' => $content]);
        return response()->json(['activity' => $activity->fresh()]);
    }
}
