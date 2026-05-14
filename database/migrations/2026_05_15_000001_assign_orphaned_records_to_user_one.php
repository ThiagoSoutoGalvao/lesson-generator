<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Records created before user scoping was added (May 11 2026) have user_id = NULL.
        // They all belong to the first user (the developer). Assign them so they appear in the library.
        DB::table('activities')->whereNull('user_id')->update(['user_id' => 1]);
        DB::table('documents')->whereNull('user_id')->update(['user_id' => 1]);
    }

    public function down(): void
    {
        // Not reversible — we don't know which records were originally null.
    }
};
