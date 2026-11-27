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
    public const TYPES = ['picture_prompts', 'discussion_questions'];

    public function update(Request $request, Activity $activity)
    {
        abort_if($activity->user_id !== auth()->id(), 403);
        abort_unless(in_array($activity->type, self::TYPES, true), 422, 'This activity type cannot be edited here yet.');

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
}
