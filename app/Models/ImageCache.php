<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImageCache extends Model
{
    protected $table = 'image_cache';
    protected $fillable = ['keyword', 'url'];
}
