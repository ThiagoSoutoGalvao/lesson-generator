<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->string('folder')->nullable()->after('tags');
            $table->string('book')->nullable()->after('folder');
            $table->string('lesson')->nullable()->after('book');
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['folder', 'book', 'lesson']);
        });
    }
};
