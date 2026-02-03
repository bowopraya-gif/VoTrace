<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\UserStreak;
use App\Models\StreakActivity;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class StreakUpdateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $user;
    public $timezone;

    /**
     * Create a new job instance.
     */
    public function __construct(User $user, string $timezone)
    {
        $this->user = $user;
        $this->timezone = $timezone;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $userId = $this->user->id;
        $lockKey = "streak_lock:{$userId}";

        // 1. Atomic Lock (5 seconds) to prevent Race Conditions
        Cache::lock($lockKey, 5)->get(function () use ($userId) {
            
            $now = Carbon::now($this->timezone);
            $today = $now->toDateString();
            
            // 2. Wrap DB updates in Transaction
            DB::transaction(function () use ($userId, $today, $now) {
                
                // Ensure record exists
                $streak = UserStreak::firstOrCreate(['user_id' => $userId]);

                // Update Daily Activity Log
                StreakActivity::updateOrCreate(
                    ['user_id' => $userId, 'activity_date' => $today],
                    ['vocabulary_count' => DB::raw('vocabulary_count + 1')]
                );

                // Logic Calculation
                $lastActivityDate = $streak->last_activity_date 
                    ? Carbon::parse($streak->last_activity_date)->setTimezone($this->timezone) 
                    : null;

                $addedToday = false;

                if ($lastActivityDate === null) {
                    // First ever
                    $streak->current_streak = 1;
                    $streak->streak_started_at = $today;
                    $addedToday = true;
                } elseif ($lastActivityDate->isYesterday()) {
                    // Continue streak
                    $streak->current_streak++;
                    $addedToday = true;
                } elseif ($lastActivityDate->isToday()) {
                    // Already added today (just updating count, streak stays same)
                    $addedToday = true;
                } else {
                    // Broken streak -> Reset
                    // Except if user missed days, but added today, it restarts at 1
                    $streak->current_streak = 1;
                    $streak->streak_started_at = $today;
                    $addedToday = true;
                }

                $streak->last_activity_date = $today;
                $streak->total_active_days = StreakActivity::where('user_id', $userId)->count();

                if ($streak->current_streak > $streak->longest_streak) {
                    $streak->longest_streak = $streak->current_streak;
                }

                $streak->save();

                // 3. Write-Through Cache Strategy
                // Calculate the Fresh State that Frontend expects
                $statusData = [
                    'current_streak' => $streak->current_streak,
                    'longest_streak' => $streak->longest_streak,
                    'added_today' => $addedToday,
                    'is_active' => true, // Since we just added, it IS active
                    'last_activity_date' => $today,
                    'total_active_days' => $streak->total_active_days,
                ];

                // Put in Cache (Valid for 24 hours or until next update)
                // Using 'put' overwrites any existing key
                Cache::put("streak_status:user_{$userId}", $statusData, now()->addHours(24));
                
                Log::info("Streak processed for user {$userId}. New streak: {$streak->current_streak}");
            });
        });
    }
}
