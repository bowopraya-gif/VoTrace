<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Use raw statement to modify ENUM column as Doctrine DBAL often has issues with enum changes
        DB::statement("ALTER TABLE practice_sessions MODIFY COLUMN mode ENUM('multiple_choice', 'typing', 'listening', 'mixed', 'matching') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum list
        DB::statement("ALTER TABLE practice_sessions MODIFY COLUMN mode ENUM('multiple_choice', 'typing', 'listening', 'mixed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL");
    }
};
