<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One student's completion of one activity. Created by the student app when a
 * student finishes a scored or completion-tracked activity (Phase S3). Unlimited
 * retakes — every attempt is kept; the latest per (student_id, activity_id)
 * drives the lesson-view badge and the trilha progress count.
 */
class ActivityAttempt extends Model
{
    protected $fillable = [
        'student_id', 'activity_id', 'score', 'max_score', 'answers', 'completed_at',
    ];

    protected $casts = [
        'answers'      => 'array',
        'completed_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }
}
