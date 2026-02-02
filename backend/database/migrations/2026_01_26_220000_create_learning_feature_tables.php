<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Modules Table
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->enum('difficulty', ['beginner', 'intermediate', 'advanced']);
            $table->string('category')->default('general');
            $table->integer('order_index')->default(0);
            $table->boolean('is_published')->default(false);
            $table->integer('lessons_count')->default(0); // Cached count
            $table->timestamps();
        });

        // Lessons Table
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->integer('order_index')->default(0);
            $table->integer('estimated_mins')->default(5);
            $table->enum('difficulty', ['beginner', 'intermediate', 'advanced']);
            $table->integer('total_blocks')->default(0); // Cached count
            $table->integer('required_blocks')->default(0); // For completion logic
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });

        // Content Blocks Table
        Schema::create('content_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->enum('type', [
                'text', 'image', 'video', 'audio', 
                'quiz_mc', 'quiz_typing', 'quiz_fill', 
                'vocabulary', 'link', 'divider'
            ]);
            $table->json('content'); // Flexible JSON structure
            $table->integer('order_index')->default(0);
            $table->boolean('is_required')->default(true);
            $table->timestamps();
            
            $table->index(['lesson_id', 'order_index']);
        });

        // Lesson Progress Table (Aggregated)
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['not_started', 'in_progress', 'completed'])->default('not_started');
            
            $table->integer('completed_blocks')->default(0);
            $table->integer('correct_answers')->default(0);
            $table->integer('total_quiz_blocks')->default(0); // Snapshot for accuracy calculation
            $table->float('score')->default(0);
            
            $table->integer('last_block_index')->default(0); // For resume
            
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('content_blocks');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('modules');
    }
};
