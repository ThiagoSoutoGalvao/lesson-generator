<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['user_id', 'name', 'type', 'content', 'tags', 'folder', 'book', 'lesson'];
    protected $casts = ['content' => 'array'];
}
