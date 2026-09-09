<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['user_id', 'name', 'type', 'content', 'tags', 'folder', 'book', 'lesson', 'trilha', 'trilha_lesson', 'built_by', 'student_visible'];
    protected $casts = ['content' => 'array', 'student_visible' => 'boolean'];

    /**
     * Activity types that are delivered by the teacher in the live lesson and are
     * never shown in the student app, regardless of the student_visible flag.
     */
    public const TEACHER_ONLY_TYPES = ['presentation', 'reading_text', 'essay_feedback', 'grammar_explainer'];
}
