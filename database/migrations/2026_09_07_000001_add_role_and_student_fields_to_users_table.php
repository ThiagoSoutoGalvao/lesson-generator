<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'role')) {
                // 'teacher' (every existing account) | 'student'
                $table->string('role')->default('teacher')->after('email');
            }
            if (! Schema::hasColumn('users', 'trilha')) {
                // student's current trilha: 'Lights' | 'Glow' | 'Radiant' — null for teachers
                $table->string('trilha')->nullable()->after('role');
            }
            if (! Schema::hasColumn('users', 'teacher_id')) {
                // the teacher who created / owns this student account
                $table->foreignId('teacher_id')->nullable()->after('trilha')
                    ->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('teacher_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'teacher_id')) {
                $table->dropConstrainedForeignId('teacher_id');
            }
            foreach (['role', 'trilha', 'is_active'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
