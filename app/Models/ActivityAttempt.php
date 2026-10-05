<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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
        'student_id', 'activity_id', 'score', 'max_score', 'answers', 'recorded_by', 'completed_at',
    ];

    protected $casts = [
        'answers'      => 'array',
        'completed_at' => 'datetime',
    ];

    /** The student's own practice — excludes "Use it!" checks a teacher recorded live (`recorded_by` set). */
    public function scopeOwnPractice(Builder $query): Builder
    {
        return $query->whereNull('recorded_by');
    }

    /** "Use it!" speaking checks a teacher ticked live in class. */
    public function scopeSpeakingChecks(Builder $query): Builder
    {
        return $query->whereNotNull('recorded_by');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }
}
