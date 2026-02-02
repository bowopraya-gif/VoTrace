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
        Schema::create('login_attempts', function (Blueprint $table) {
            $table->id();
            
            // User Reference
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('login_identifier'); // Email or username attempted
            
            // Network Info
            $table->string('ip_address', 45); // IPv4 or IPv6
            
            // User Agent Parsing (using jenssegers/agent)
            $table->text('user_agent_raw')->nullable();
            $table->string('device_type', 20)->nullable(); // Mobile, Tablet, Desktop
            $table->string('platform', 50)->nullable();    // Windows 11, macOS 14, Android 14
            $table->string('browser', 50)->nullable();     // Chrome 121, Safari 17, Firefox 122
            
            // Location Info (using stevebauman/location)
            $table->string('city', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('location', 200)->nullable(); // "Jakarta, Indonesia"
            
            // Attempt Status
            $table->enum('status', ['success', 'failed', 'locked'])->default('failed');
            
            // Timestamps
            $table->timestamp('attempted_at');
            $table->timestamps();
            
            // Indexes for fast querying
            $table->index(['ip_address', 'attempted_at']);
            $table->index(['user_id', 'status', 'attempted_at']);
            $table->index(['login_identifier', 'attempted_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('login_attempts');
    }
};
