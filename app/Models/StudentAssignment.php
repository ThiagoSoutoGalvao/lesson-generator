<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One activity handed to one specific student by their teacher, independent of
 * trilha (Aurora Homework Phase H2). Grants visibility via the second `OR`
 * branch in StudentContentController::assertVisible() — completion itself is
 * read straight off activity_attempts, not tracked here, so there's nothing to
 * keep in sync when a student plays an assigned activity.
 */
class StudentAssignment extends Model
{
    protected $fillable = ['student_id', 'activity_id', 'note'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }
}
