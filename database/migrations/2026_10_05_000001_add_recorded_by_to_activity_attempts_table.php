<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_attempts', function (Blueprint $table) {
            if (! Schema::hasColumn('activity_attempts', 'recorded_by')) {
                // NULL = the student's own practice (the student app posted it). A teacher id = a
                // "Use it!" speaking check the teacher ticked live in class (Aurora Lessons Phase 1,
                // step 2, 2026-10-05). Kept apart so live checks never count as homework "done".
                $table->foreignId('recorded_by')->nullable()->after('answers')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('activity_attempts', function (Blueprint $table) {
            if (Schema::hasColumn('activity_attempts', 'recorded_by')) {
                $table->dropConstrainedForeignId('recorded_by');
            }
        });
    }
};
