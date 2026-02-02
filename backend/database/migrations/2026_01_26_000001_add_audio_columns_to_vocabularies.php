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
            $table->string('audio_url')->nullable()->after('pronunciation');
            $table->string('audio_hash', 64)->nullable()->after('audio_url');
            $table->enum('audio_status', ['pending', 'generating', 'ready', 'failed'])
                  ->default('pending')->after('audio_hash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vocabularies', function (Blueprint $table) {
            $table->dropColumn(['audio_url', 'audio_hash', 'audio_status']);
        });
    }
};
