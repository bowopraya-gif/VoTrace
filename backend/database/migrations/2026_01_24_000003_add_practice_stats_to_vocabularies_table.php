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
            $table->integer('times_practiced')->default(0);
            $table->integer('times_correct')->default(0);
            $table->integer('times_wrong')->default(0);
            $table->integer('consecutive_correct')->default(0);
            $table->timestamp('last_practiced_at')->nullable();
            $table->decimal('mastery_score', 5, 2)->default(0); // 0-100 score
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vocabularies', function (Blueprint $table) {
            $table->dropColumn([
                'times_practiced',
                'times_correct',
                'times_wrong',
                'consecutive_correct',
                'last_practiced_at',
                'mastery_score'
            ]);
        });
    }
};
