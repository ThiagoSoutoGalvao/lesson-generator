<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            if (! Schema::hasColumn('activities', 'trilha_part')) {
                // A course unit is taught over three lessons: 1A / 1B / 1C (2026-10-18).
                // NULL = saved before the split, and counts as lesson A — nothing is back-filled,
                // so a finished course keeps every activity where it was.
                $table->char('trilha_part', 1)->nullable()->after('trilha_lesson');
            }
        });

        Schema::table('trilha_lesson_briefs', function (Blueprint $table) {
            if (! Schema::hasColumn('trilha_lesson_briefs', 'part_plans')) {
                // One plan line per lesson of the unit: {"A": "...", "B": "...", "C": "..."}.
                $table->json('part_plans')->nullable()->after('source');
            }
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            if (Schema::hasColumn('activities', 'trilha_part')) {
                $table->dropColumn('trilha_part');
            }
        });

        Schema::table('trilha_lesson_briefs', function (Blueprint $table) {
            if (Schema::hasColumn('trilha_lesson_briefs', 'part_plans')) {
                $table->dropColumn('part_plans');
            }
        });
    }
};
