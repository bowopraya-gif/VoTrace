<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserStreak;
use App\Models\StreakActivity;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class StreakService
{
    /**
     * Record a new vocabulary addition and update streak.
     */
    /**
     * Record a new vocabulary addition.
     * @deprecated Logic moved to StreakUpdateJob for background processing.
     */
    public function recordVocabularyAdded(User $user, string $timezone = 'UTC'): void
    {
        // This method is kept for legacy support or testing but should not be used in main flow.
        // Logic is now in App\Jobs\StreakUpdateJob
    }
    
    /**
     * Get current streak status for a user.
     * Uses Write-Through Cache strategy (Read from Redis).
     */
    public function getStreakStatus(User $user, string $timezone = 'UTC'): array
    {
        $cacheKey = "streak_status:user_{$user->id}";

        // Attempt to get from Cache first
        return Cache::remember($cacheKey, now()->addHours(24), function () use ($user, $timezone) {
            // If Miss (should be rare with Write-Through), calculate from DB
            $streak = UserStreak::firstOrCreate(['user_id' => $user->id]);
            
            $lastActivityDate = $streak->last_activity_date 
                ? Carbon::parse($streak->last_activity_date)->setTimezone($timezone) 
                : null;
            $now = Carbon::now($timezone);
            
            $addedToday = $lastActivityDate?->isSameDay($now) ?? false;
            $isActive = $addedToday || ($lastActivityDate?->isSameDay($now->copy()->subDay()) ?? false);
            
            $displayStreak = $isActive ? $streak->current_streak : 0;
            
            return [
                'current_streak' => $displayStreak,
                'longest_streak' => $streak->longest_streak,
                'added_today' => $addedToday,
                'is_active' => $isActive,
                'last_activity_date' => $streak->last_activity_date,
                'total_active_days' => $streak->total_active_days,
            ];
        });
    }

    /**
     * Get detailed statistics including per month and consistency.
     */
    public function getDetailedStats(User $user, string $timezone = 'UTC'): array
    {
        // Get basic stats from cache
        $basic = $this->getStreakStatus($user, $timezone);
        
        // Detailed stats might still need DB, or can be cached separately.
        // For now, let's cache this heavy query too.
        
        $cacheKey = "streak_detail_stats:user_{$user->id}";
        
        return Cache::remember($cacheKey, now()->addHours(1), function() use ($user, $timezone, $basic) {
            $now = Carbon::now($timezone);
            $currentMonth = $now->copy()->startOfMonth();
            $daysInMonth = $now->daysInMonth;
            
            $thisMonthCount = StreakActivity::where('user_id', $user->id)
                ->where('activity_date', '>=', $currentMonth->toDateString())
                ->count();
                
            $consistencyRate = ($thisMonthCount / $daysInMonth) * 100;
            
            return array_merge($basic, [
                'this_month_count' => $thisMonthCount,
                'consistency_rate' => round($consistencyRate, 1),
                'total_active_days' => $basic['total_active_days'] // Use from basic to ensure consistency
            ]);
        });
    }

    /**
     * Calculate streak history rankings from activity logs.
     * This finds all contiguous date ranges and ranks them.
     */
    public function getStreakHistory(User $user, int $limit = 5): array
    {
        // Get all activity dates sorted ascending
        $dates = StreakActivity::where('user_id', $user->id)
            ->orderBy('activity_date', 'asc')
            ->pluck('activity_date')
            ->map(fn($d) => \Carbon\Carbon::parse($d))
            ->toArray();
            
        if (empty($dates)) return [];

        $streaks = [];
        $currentStart = $dates[0];
        $currentEnd = $dates[0];
        $length = 1;

        for ($i = 1; $i < count($dates); $i++) {
            $diff = $currentEnd->diffInDays($dates[$i]);
            
            if ($diff == 1) {
                // Consecutive
                $currentEnd = $dates[$i];
                $length++;
            } else {
                // Break in streak
                $streaks[] = [
                    'start_date' => $currentStart->toDateString(),
                    'end_date' => $currentEnd->toDateString(),
                    'length' => $length
                ];
                
                // Start new
                $currentStart = $dates[$i];
                $currentEnd = $dates[$i];
                $length = 1;
            }
        }
        
        // Add last streak
        $streaks[] = [
            'start_date' => $currentStart->toDateString(),
            'end_date' => $currentEnd->toDateString(),
            'length' => $length
        ];

        // Sort by length desc
        usort($streaks, fn($a, $b) => $b['length'] <=> $a['length']);
        
        return array_slice($streaks, 0, $limit);
    }
}
