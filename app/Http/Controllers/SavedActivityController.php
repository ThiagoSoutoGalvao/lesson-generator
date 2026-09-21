<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\Request;

class SavedActivityController extends Controller
{
    public function index()
    {
        return Activity::where('user_id', auth()->id())
            ->orderByDesc('created_at')
            ->get();
    }

    public function folders()
    {
        return Activity::where('user_id', auth()->id())
            ->whereNotNull('folder')
            ->where('folder', '!=', '')
            ->distinct()
            ->orderBy('folder')
            ->pluck('folder');
    }

    /** Fields a saved activity carries (everything except ownership). */
    private const FIELDS = ['name', 'type', 'content', 'tags', 'folder', 'book', 'lesson', 'trilha', 'trilha_lesson', 'built_by'];

    /** Validation for one activity; $prefix is e.g. 'activities.*.' when validating a list. */
    private function activityRules(string $prefix = ''): array
    {
        $rules = [
            'name'    => ['required', 'string', 'max:255'],
            'type'    => ['required', 'in:quiz,flashcards,unjumble,dialog_gap_fill,word_categorisation,true_false,mc_reading,image_vocab_match,odd_one_out,cloze,open_cloze,mc_cloze,read_complete,discussion_questions,sentence_transformation,error_correction,word_formation,match_pairs,signs_notices,picture_prompts,presentation,reading_text,essay_feedback'],
            'content' => ['required', 'array'],
            'tags'    => ['nullable', 'string', 'max:255'],
            'folder'  => ['nullable', 'string', 'max:255'],
            'book'    => ['nullable', 'string', 'max:255'],
            'lesson'  => ['nullable', 'string', 'max:255'],
            'trilha'        => ['nullable', 'string', 'in:Lights,Glow,Radiant'],
            'trilha_lesson' => ['nullable', 'integer', 'min:1', 'max:20'],
            'built_by'      => ['nullable', 'string', 'max:100'],
        ];

        return collect($rules)->mapWithKeys(fn ($rule, $key) => [$prefix . $key => $rule])->all();
    }

    public function store(Request $request)
    {
        $request->validate($this->activityRules());

        $activity = Activity::create(array_merge(
            $request->only(self::FIELDS),
            ['user_id' => auth()->id()]
        ));

        return response()->json($activity, 201);
    }

    /**
     * Bring activities exported from another copy of the app (`php artisan activities:export`) into
     * THIS teacher's library — always owned by whoever is signed in, whatever owner the file came
     * from. Re-importing the same file is harmless: an identical activity (same name, type and
     * content) is skipped, not duplicated.
     *
     * POST /api/activities/import   { activities: [ {name, type, content, …}, … ] }
     */
    public function import(Request $request)
    {
        $request->validate(['activities' => ['required', 'array', 'min:1', 'max:100']] + $this->activityRules('activities.*.'));

        $imported = 0;
        $skipped  = 0;

        foreach ($request->input('activities') as $item) {
            $already = Activity::where('user_id', auth()->id())
                ->where('name', $item['name'])
                ->where('type', $item['type'])
                ->get()
                ->contains(fn (Activity $a) => $a->content == $item['content']);

            if ($already) {
                $skipped++;
                continue;
            }

            Activity::create(array_merge(
                array_intersect_key($item, array_flip(self::FIELDS)),
                ['user_id' => auth()->id()]
            ));
            $imported++;
        }

        return response()->json(['imported' => $imported, 'skipped' => $skipped]);
    }

    /**
     * Rename one of the teacher's own activities. Only the name changes — trilha, lesson, content and
     * ownership are untouched. Whitespace is tidied the same way the Save panel does it.
     *
     * PATCH /api/activities/{activity}   { name }
     */
    public function update(Request $request, Activity $activity)
    {
        abort_if($activity->user_id !== auth()->id(), 403);

        $request->validate(['name' => ['required', 'string', 'max:255']]);

        $name = trim(preg_replace('/[\s\p{Z}]+/u', ' ', preg_replace('/[\x{200B}-\x{200D}\x{2060}\x{FEFF}]/u', '', $request->input('name'))));
        abort_if($name === '', 422, 'The name cannot be empty.');

        $activity->update(['name' => $name]);

        return response()->json($activity);
    }

    public function destroy(Activity $activity)
    {
        abort_if($activity->user_id !== auth()->id(), 403);
        $activity->delete();
        return response()->json(['ok' => true]);
    }
}
