<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('student_assignments')) {
            return;
        }

        // Aurora Homework Phase H2 (narrowed scope — see AuroraHomework.md): the
        // second, independent visibility path alongside trilha membership. A
        // one-off activity (trilha_lesson null) has no other way to reach a
        // student at all — StudentContentController::assertVisible() now allows
        // either "same trilha" (existing) or "an assignment row exists" (this).
        // No `kind`/`practice_ref` — Cambridge/DET practice stays free and
        // unassigned via the Practice tab (H1); this table is activities only.
        Schema::create('student_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('activity_id')->constrained('activities')->cascadeOnDelete();
            $table->string('note', 255)->nullable();
            $table->timestamps();

            // One assignment per (student, activity) — re-assigning updates the
            // existing row (see StudentController::assign) rather than duplicating.
            $table->unique(['student_id', 'activity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_assignments');
    }
};
