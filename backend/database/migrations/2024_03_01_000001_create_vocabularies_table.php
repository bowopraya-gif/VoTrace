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
        Schema::create('vocabularies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('english_word');
            $table->string('pronunciation')->nullable();
            $table->string('translation');
            
            // Expanded POS list as requested
            $table->enum('part_of_speech', [
                'noun', 'verb', 'adjective', 'adverb', 'pronoun', 
                'preposition', 'conjunction', 'interjection', 'determiner', 
                'modal', 'verb phrase', 'phrasal verb', 'idiom', 
                'expression', 'slang'
            ]);
            
            // Status: default 'learning'
            $table->enum('learning_status', ['learning', 'review', 'mastered'])->default('learning');
            
            $table->text('usage_note')->nullable();
            $table->text('personal_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vocabularies');
    }
};
