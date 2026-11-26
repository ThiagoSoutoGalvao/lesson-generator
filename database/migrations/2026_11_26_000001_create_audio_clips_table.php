<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Listening (2026-11-26): spoken lines for listening activities, kept in the database because Railway's disk is
// wiped on every deploy. One row per line and voice; `key` (a hash of model + voice + style + text) lets the same
// line be reused instead of paid for twice. The audio is stored base64 in a long text column (works on MySQL and sqlite).
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('audio_clips')) return;
        Schema::create('audio_clips', function (Blueprint $table) {
            $table->id();
            $table->string('key', 64)->unique();
            $table->string('voice', 32);
            $table->string('mime', 32)->default('audio/mpeg');
            $table->unsignedInteger('bytes')->default(0);
            $table->longText('data');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audio_clips');
    }
};
