<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cambridge Writing exam mode (2026-11-28): what a student hands in, kept for the teacher to correct in class.
        // No AI marking — the text is only stored and shown to the student's own teacher.
        if (! Schema::hasTable('writing_submissions')) {
            Schema::create('writing_submissions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->string('exam', 40);                 // 'b2-first'
                $table->json('parts');                       // [{ part, task_id, genre, prompt, text, words }]
                $table->unsignedInteger('seconds_used')->nullable();
                $table->boolean('timed_out')->default(false);
                $table->timestamps();
                $table->index(['student_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('writing_submissions');
    }
};
