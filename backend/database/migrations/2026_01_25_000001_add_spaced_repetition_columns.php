<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('vocabularies', function (Blueprint $table) {
            // Spaced Repetition Fields
            $table->unsignedTinyInteger('srs_level')->default(0);        // 0-5 (Leitner box)
            $table->decimal('ease_factor', 3, 2)->default(2.50);         // SM-2 ease factor
            $table->unsignedInteger('interval_days')->default(0);        // Days until next review
            $table->timestamp('next_review_at')->nullable();             // When to review next
            
            // Difficulty scoring for smart options
            $table->decimal('difficulty_score', 5, 2)->default(50.00);   // 0-100 difficulty
            
            // Add index for efficient querying
            $table->index('next_review_at');
            $table->index('srs_level');
            $table->index('difficulty_score');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vocabularies', function (Blueprint $table) {
            $table->dropIndex(['next_review_at']);
            $table->dropIndex(['srs_level']);
            $table->dropIndex(['difficulty_score']);
            
            $table->dropColumn([
                'srs_level',
                'ease_factor',
                'interval_days',
                'next_review_at',
                'difficulty_score'
            ]);
        });
    }
};
