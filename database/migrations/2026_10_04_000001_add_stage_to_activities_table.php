<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            if (! Schema::hasColumn('activities', 'stage')) {
                // Lesson-pack stage: warmer / presentation / practice / production.
                // NULL = not tagged yet — existing activities are NOT back-filled, so a
                // teacher confirms each one (Aurora Lessons Phase 1, 2026-10-04).
                $table->string('stage', 20)->nullable()->after('trilha_lesson');
            }
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            if (Schema::hasColumn('activities', 'stage')) {
                $table->dropColumn('stage');
            }
        });
    }
};
