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
        // 1. Temporarily change to VARCHAR to allow data updates
        DB::statement("ALTER TABLE users MODIFY COLUMN english_level VARCHAR(50) DEFAULT 'A1'");
        
        // 2. Map existing values from legacy to CEFR
        DB::statement("UPDATE users SET english_level = 'A1' WHERE english_level = 'beginner' OR english_level IS NULL");
        DB::statement("UPDATE users SET english_level = 'B1' WHERE english_level = 'intermediate'");
        DB::statement("UPDATE users SET english_level = 'C1' WHERE english_level = 'advanced'");

        // 3. Finalize column as ENUM with new values
        DB::statement("ALTER TABLE users MODIFY COLUMN english_level ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') DEFAULT 'A1'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN english_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner'");
    }
};
