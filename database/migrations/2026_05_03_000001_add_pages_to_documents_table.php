<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->json('pages_text')->nullable()->after('extracted_text');
            $table->unsignedInteger('page_count')->nullable()->after('pages_text');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['pages_text', 'page_count']);
        });
    }
};
