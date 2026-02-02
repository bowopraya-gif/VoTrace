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
            // example_sentence already added by previous migration
            if (!Schema::hasColumn('vocabularies', 'example_sentence_translation')) {
                 $table->text('example_sentence_translation')->nullable()->after('example_sentence');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vocabularies', function (Blueprint $table) {
            $table->dropColumn('example_sentence');
            $table->dropColumn('example_sentence_translation');
        });
    }
};
