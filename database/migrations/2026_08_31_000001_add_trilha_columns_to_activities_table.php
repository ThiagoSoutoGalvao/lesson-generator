<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            if (! Schema::hasColumn('activities', 'trilha')) {
                // 'Lights' | 'Glow' | 'Radiant' — null for non-trilha activities
                $table->string('trilha')->nullable()->after('lesson');
            }
            if (! Schema::hasColumn('activities', 'trilha_lesson')) {
                // lesson number within the trilha (1-12)
                $table->unsignedTinyInteger('trilha_lesson')->nullable()->after('trilha');
            }
            if (! Schema::hasColumn('activities', 'built_by')) {
                // teacher who built it (shared Aurora login can't tell us on its own)
                $table->string('built_by')->nullable()->after('trilha_lesson');
            }
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            foreach (['trilha', 'trilha_lesson', 'built_by'] as $col) {
                if (Schema::hasColumn('activities', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
