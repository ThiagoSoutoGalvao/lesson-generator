<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One spoken line for a listening activity (see the audio_clips migration and App\Services\Speech). */
class AudioClip extends Model
{
    protected $fillable = ['key', 'voice', 'mime', 'bytes', 'data'];
    protected $hidden = ['data'];
}
