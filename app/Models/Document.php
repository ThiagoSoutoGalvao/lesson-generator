<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = ['user_id', 'original_name', 'stored_path', 'extracted_text', 'pages_text', 'page_count', 'source_type', 'status'];
    protected $casts = ['pages_text' => 'array'];
}
