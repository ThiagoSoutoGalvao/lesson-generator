<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A student's handed-in Cambridge Writing exam (2026-11-28): both parts' texts, for the teacher to correct in class. */
class WritingSubmission extends Model
{
    protected $fillable = ['student_id', 'exam', 'parts', 'seconds_used', 'timed_out'];

    protected function casts(): array
    {
        return ['parts' => 'array', 'timed_out' => 'boolean'];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
