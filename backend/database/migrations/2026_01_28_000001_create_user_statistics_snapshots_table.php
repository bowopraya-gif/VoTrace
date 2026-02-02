<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_statistics_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('snapshot_date');
            $table->enum('period_type', ['daily', 'weekly', 'monthly'])->default('daily');
            
            // === VOCABULARY METRICS ===
            $table->unsignedInteger('vocab_total')->default(0);
            $table->unsignedInteger('vocab_mastered')->default(0);
            $table->unsignedInteger('vocab_learning')->default(0);
            $table->unsignedInteger('vocab_review')->default(0);
            $table->unsignedInteger('vocab_added')->default(0);           // New words added on this date
            $table->float('vocab_retention_rate')->nullable();            // SRS retention percentage
            $table->json('vocab_by_pos')->nullable();                     // {"noun": 45, "verb": 32}
            $table->json('vocab_srs_levels')->nullable();                 // [10, 25, 30, ...] for levels 0-8
            $table->json('vocab_difficulty_dist')->nullable();            // Histogram by difficulty range
            
            // === PRACTICE METRICS ===
            $table->unsignedInteger('practice_sessions')->default(0);
            $table->unsignedInteger('practice_questions')->default(0);
            $table->unsignedInteger('practice_correct')->default(0);
            $table->float('practice_accuracy')->nullable();
            $table->unsignedInteger('practice_time_seconds')->default(0);
            $table->json('practice_by_mode')->nullable();                 // {"multiple_choice": {sessions: 5, accuracy: 85}}
            $table->json('practice_by_direction')->nullable();            // {"en_to_id": {count: 50, accuracy: 82}}
            $table->json('practice_mistakes_by_pos')->nullable();         // {"verb": 25, "noun": 5}
            
            // === LEARNING METRICS ===
            $table->unsignedInteger('lessons_completed')->default(0);
            $table->unsignedInteger('learning_time_seconds')->default(0);
            $table->unsignedInteger('quiz_correct')->default(0);
            $table->unsignedInteger('quiz_total')->default(0);
            
            $table->timestamps();
            
            // Indexes for fast queries (shortened names to fit MySQL 64-char limit)
            $table->unique(['user_id', 'snapshot_date', 'period_type'], 'user_stats_unique');
            $table->index(['user_id', 'snapshot_date'], 'user_stats_date_idx');
            $table->index(['user_id', 'period_type'], 'user_stats_period_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_statistics_snapshots');
    }
};
