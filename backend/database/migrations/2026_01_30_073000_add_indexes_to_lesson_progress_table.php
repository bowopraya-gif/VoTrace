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
        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'lp_user_status_idx');
            $table->index(['lesson_id', 'status'], 'lp_lesson_status_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->dropIndex('lp_user_status_idx');
            $table->dropIndex('lp_lesson_status_idx');
        });
    }
};
