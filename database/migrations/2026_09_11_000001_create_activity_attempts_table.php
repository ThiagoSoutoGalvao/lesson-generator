<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('activity_attempts')) {
            return;
        }

        Schema::create('activity_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('activity_id')->constrained('activities')->cascadeOnDelete();
            // score / max_score are null for completion-only activities (no
            // scoring concept — the student reached the end). One row per attempt;
            // the latest row per (student, activity) drives the lesson-view badge.
            $table->unsignedSmallInteger('score')->nullable();
            $table->unsignedSmallInteger('max_score')->nullable();
            $table->json('answers')->nullable();
            $table->timestamp('completed_at');
            $table->timestamps();

            $table->index(['student_id', 'activity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_attempts');
    }
};
