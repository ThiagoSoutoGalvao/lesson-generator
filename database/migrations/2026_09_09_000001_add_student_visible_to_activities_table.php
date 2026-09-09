<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            if (! Schema::hasColumn('activities', 'student_visible')) {
                // Escape hatch — everything trilha-tagged is visible to students by
                // default; a teacher can pull one activity by flipping this to false.
                // No UI in v1 (Phase S2).
                $table->boolean('student_visible')->default(true)->after('built_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            if (Schema::hasColumn('activities', 'student_visible')) {
                $table->dropColumn('student_visible');
            }
        });
    }
};
