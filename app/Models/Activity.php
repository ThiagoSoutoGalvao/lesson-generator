<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['name', 'type', 'content', 'tags'];
    protected $casts = ['content' => 'array'];
}
