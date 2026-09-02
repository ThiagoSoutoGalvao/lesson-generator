<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('trilha_lesson_briefs')) {
            return;
        }

        Schema::create('trilha_lesson_briefs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('trilha'); // 'Lights' | 'Glow' | 'Radiant'
            $table->unsignedTinyInteger('trilha_lesson');
            $table->text('target_language')->nullable();
            $table->text('vocabulary')->nullable();
            $table->text('level_notes')->nullable();
            $table->text('source')->nullable();
            $table->string('updated_by')->nullable(); // teacher who last edited it
            $table->timestamps();

            $table->unique(['user_id', 'trilha', 'trilha_lesson']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trilha_lesson_briefs');
    }
};
