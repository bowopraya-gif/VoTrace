<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserStreak;
use App\Models\StreakActivity;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StreakService
{
    /**
     * Record a new vocabulary addition and update streak.
     */
    public function recordVocabularyAdded(User $user, string $timezone = 'UTC'): void
    {
        $now = Carbon::now($timezone);
        $today = $now->toDateString();
        
        // Ensure streak record exists
        $streak = UserStreak::firstOrCreate(['user_id' => $user->id]);
        
        // Update daily activity log
        StreakActivity::updateOrCreate(
            ['user_id' => $user->id, 'activity_date' => $today],
            ['vocabulary_count' => DB::raw('vocabulary_count + 1')]
        );
        
        // Calculate streak logic using timezone-aware comparisons
        $lastActivityDate = $streak->last_activity_date 
            ? Carbon::parse($streak->last_activity_date)->setTimezone($timezone) 
            : null;
        
        if ($lastActivityDate === null) {
            // First ever activity
            $streak->current_streak = 1;
            $streak->streak_started_at = $today;
        } elseif ($lastActivityDate->isYesterday()) {
            // Continuing streak (activity was yesterday)
            $streak->current_streak++;
        } elseif (!$lastActivityDate->isToday()) {
            // Streak broken (activity was before yesterday)
            $streak->current_streak = 1;
            $streak->streak_started_at = $today;
        }
        
        $streak->last_activity_date = $today;
        $streak->total_active_days = StreakActivity::where('user_id', $user->id)->count();
        
        if ($streak->current_streak > $streak->longest_streak) {
            $streak->longest_streak = $streak->current_streak;
        }
        
        $streak->save();
    }
    
    /**
     * Get current streak status for a user.
     */
    public function getStreakStatus(User $user, string $timezone = 'UTC'): array
    {
        $streak = UserStreak::firstOrCreate(['user_id' => $user->id]);
        
        // Parse last activity date with user's timezone
        $lastActivityDate = $streak->last_activity_date 
            ? Carbon::parse($streak->last_activity_date)->setTimezone($timezone) 
            : null;
        $now = Carbon::now($timezone);
        
        $addedToday = $lastActivityDate?->isSameDay($now) ?? false;
        
        // Streak is active if added today OR added yesterday
        $isActive = $addedToday || ($lastActivityDate?->isSameDay($now->copy()->subDay()) ?? false);
        
        // If streak is broken (not active), display 0, unless they just started today (isActive=true)
        $displayStreak = $isActive ? $streak->current_streak : 0;

        return [
            'current_streak' => $displayStreak,
            'longest_streak' => $streak->longest_streak,
            'added_today' => $addedToday,
            'is_active' => $isActive,
            'last_activity_date' => $streak->last_activity_date,
            'total_active_days' => $streak->total_active_days,
        ];
    }

    /**
     * Get detailed statistics including per month and consistency.
     */
    public function getDetailedStats(User $user, string $timezone = 'UTC'): array
    {
        $basic = $this->getStreakStatus($user, $timezone);
        
        $now = Carbon::now($timezone);
        $currentMonth = $now->copy()->startOfMonth();
        $daysInMonth = $now->daysInMonth;
        
        // This Month Count
        $thisMonthCount = StreakActivity::where('user_id', $user->id)
            ->where('activity_date', '>=', $currentMonth->toDateString())
            ->count();
            
        // Consistency Rate
        $consistencyRate = ($thisMonthCount / $daysInMonth) * 100;

        // Total active days
        $totalActive = $basic['total_active_days'];
        
        return array_merge($basic, [
            'this_month_count' => $thisMonthCount,
            'consistency_rate' => round($consistencyRate, 1),
            'total_active_days' => $totalActive
        ]);
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
