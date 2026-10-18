<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrilhaLessonBrief extends Model
{
    protected $fillable = [
        'user_id', 'trilha', 'trilha_lesson',
        'target_language', 'vocabulary', 'level_notes', 'source', 'part_plans', 'updated_by',
    ];

    protected $casts = ['part_plans' => 'array'];
}
