<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Aurora Business (2026-11-28): the last lesson taught to this student ("4B" = 4 + B).
            // The student app opens lessons up to it, never ahead. NULL = nothing marked yet = 1A only.
            if (! Schema::hasColumn('users', 'taught_lesson')) {
                $table->unsignedSmallInteger('taught_lesson')->nullable()->after('trilha');
            }
            if (! Schema::hasColumn('users', 'taught_part')) {
                $table->char('taught_part', 1)->nullable()->after('taught_lesson');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['taught_part', 'taught_lesson'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
