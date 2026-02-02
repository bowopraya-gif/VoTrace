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
        Schema::create('practice_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('practice_session_id')->constrained()->onDelete('cascade');
            $table->foreignId('vocabulary_id')->constrained()->onDelete('cascade');
            $table->enum('question_type', ['multiple_choice', 'typing', 'listening']);
            $table->string('user_answer')->nullable();
            $table->string('correct_answer');
            $table->boolean('is_correct');
            $table->integer('time_spent_ms')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('practice_attempts');
    }
};
