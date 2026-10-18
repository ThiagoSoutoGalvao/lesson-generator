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
    private const FIELDS = ['name', 'type', 'content', 'tags', 'folder', 'book', 'lesson', 'trilha', 'trilha_lesson', 'trilha_part', 'stage', 'built_by', 'student_visible'];

    /** Lesson-pack stages — the same keys as `resources/js/lib/stages.js`. */
    private const STAGES = 'warmer,presentation,practice,production';

    /** The lessons of a course unit — the same letters as `parts` in `resources/js/lib/trilhas.js`. */
    private const PARTS = 'A,B,C';

    /** Validation for one activity; $prefix is e.g. 'activities.*.' when validating a list. */
    private function activityRules(string $prefix = ''): array
    {
        $rules = [
            'name'    => ['required', 'string', 'max:255'],
            'type'    => ['required', 'in:quiz,flashcards,unjumble,dialog_gap_fill,word_categorisation,true_false,mc_reading,image_vocab_match,odd_one_out,cloze,open_cloze,mc_cloze,read_complete,discussion_questions,sentence_transformation,error_correction,word_formation,match_pairs,signs_notices,picture_prompts,role_play,story_builder,debate,mini_presentation,presentation,reading_text,essay_feedback'],
            'content' => ['required', 'array'],
            'tags'    => ['nullable', 'string', 'max:255'],
            'folder'  => ['nullable', 'string', 'max:255'],
            'book'    => ['nullable', 'string', 'max:255'],
            'lesson'  => ['nullable', 'string', 'max:255'],
            'trilha'        => ['nullable', 'string', 'in:Lights,Glow,Radiant'],
            'trilha_lesson' => ['nullable', 'integer', 'min:1', 'max:20'],
            // Which lesson of the unit (1A / 1B / 1C); NULL counts as A.
            'trilha_part'   => ['nullable', 'string', 'in:' . self::PARTS],
            'stage'         => ['nullable', 'string', 'in:' . self::STAGES],
            'built_by'      => ['nullable', 'string', 'max:100'],
            // false = saved hidden from students — a lesson pack's "Suggest one with Claude" saves unreviewed
            // activities this way until the teacher approves them (Aurora Lessons Phase 1, step 7).
            'student_visible' => ['sometimes', 'boolean'],
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
     * Rename one of the teacher's own activities, set its lesson-pack stage (null clears it), move it to
     * another lesson of its unit (`trilha_part`, A / B / C), and/or replace a speaking activity's "Use it!"
     * targets (`content.targets`). Nothing else changes — trilha, unit, the rest of the content and
     * ownership are untouched. Whitespace in a new name is tidied the same way the Save panel does it.
     *
     * PATCH /api/activities/{activity}   { name?, stage?, trilha_part?, targets?, student_visible? }
     */
    public function update(Request $request, Activity $activity)
    {
        abort_if($activity->user_id !== auth()->id(), 403);

        // `stage: null` is a real request (clear the stage), so "at least one field" is checked by key, not by value.
        abort_unless($request->has('name') || $request->exists('stage') || $request->has('trilha_part') || $request->has('targets') || $request->has('student_visible'), 422, 'Nothing to update.');

        $request->validate([
            'name'      => ['sometimes', 'required', 'string', 'max:255'],
            'stage'     => ['nullable', 'string', 'in:' . self::STAGES],
            'trilha_part' => ['sometimes', 'required', 'string', 'in:' . self::PARTS],
            'student_visible' => ['sometimes', 'boolean'],
            'targets'   => ['sometimes', 'array', 'max:12'],
            'targets.*' => ['string', 'max:80'],
        ]);

        $changes = [];

        if ($request->has('name')) {
            $name = trim(preg_replace('/[\s\p{Z}]+/u', ' ', preg_replace('/[\x{200B}-\x{200D}\x{2060}\x{FEFF}]/u', '', $request->input('name'))));
            abort_if($name === '', 422, 'The name cannot be empty.');
            $changes['name'] = $name;
        }

        if ($request->has('student_visible')) {
            $changes['student_visible'] = $request->boolean('student_visible');   // "Approve" on a suggested activity
        }

        if ($request->exists('stage')) {
            $changes['stage'] = $request->input('stage');
        }

        if ($request->has('trilha_part')) {
            abort_if($activity->trilha_lesson === null, 422, 'Only an activity in a course lesson can move to another lesson.');
            $changes['trilha_part'] = $request->input('trilha_part');
        }

        if ($request->has('targets')) {
            abort_unless(in_array($activity->type, Activity::SPEAKING_CHECK_TYPES, true), 422, 'This activity has no "Use it!" checklist.');
            $targets = array_values(array_unique(array_filter(array_map(
                fn ($t) => trim(preg_replace('/\s+/u', ' ', (string) $t)),
                $request->input('targets', []),
            ), fn ($t) => $t !== '')));
            $changes['content'] = array_merge($activity->content ?? [], ['targets' => $targets]);
        }

        $activity->update($changes);

        return response()->json($activity);
    }

    /**
     * "+ From Library" on a lesson pack: a COPY of one of the teacher's own activities, placed in a course
     * lesson + stage. The original stays exactly where it was — an older one-off can still be set as homework
     * or used as an extra, and an activity already in another lesson keeps its place there. The copy keeps the
     * original's content, author and visibility (an unapproved suggestion stays hidden from students).
     *
     * POST /api/activities/{activity}/copy   { name, trilha, trilha_lesson, trilha_part, stage }
     */
    public function copy(Request $request, Activity $activity)
    {
        abort_if($activity->user_id !== auth()->id(), 403);

        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'trilha'        => ['required', 'string', 'in:Lights,Glow,Radiant'],
            'trilha_lesson' => ['required', 'integer', 'min:1', 'max:20'],
            'trilha_part'   => ['required', 'string', 'in:' . self::PARTS],
            'stage'         => ['required', 'string', 'in:' . self::STAGES],
        ]);

        $copy = $activity->replicate(['folder', 'book', 'lesson']);
        $copy->fill($data);
        $copy->save();

        return response()->json($copy, 201);
    }

    public function destroy(Activity $activity)
    {
        abort_if($activity->user_id !== auth()->id(), 403);
        $activity->delete();
        return response()->json(['ok' => true]);
    }
}
