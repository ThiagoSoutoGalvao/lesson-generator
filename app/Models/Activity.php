<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['user_id', 'name', 'type', 'content', 'tags', 'folder', 'book', 'lesson', 'trilha', 'trilha_lesson', 'stage', 'built_by', 'student_visible'];
    protected $casts = ['content' => 'array', 'student_visible' => 'boolean'];

    /**
     * Activity types built for the teacher to deliver live. Always excluded from a student's
     * automatic trilha list. `presentation` is the one exception a teacher can still reach a
     * student with — via a deliberate Homework assignment, as a take-home reference
     * (`StudentContentController::assertVisible()`, 2026-09-24) — the other three stay blocked
     * on every path.
     */
    /**
     * Speaking tasks that carry a "Use it!" checklist (`content.targets`, a list of target-language
     * strings) the teacher ticks live (Aurora Lessons Phase 1, step 2). New production templates join here.
     */
    public const SPEAKING_CHECK_TYPES = ['discussion_questions', 'picture_prompts', 'role_play', 'story_builder', 'debate', 'mini_presentation'];

    public const TEACHER_ONLY_TYPES = ['presentation', 'reading_text', 'essay_feedback', 'grammar_explainer'];
}
