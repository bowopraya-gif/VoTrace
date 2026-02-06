<?php

namespace App\Services;

use App\Models\User;
use App\Models\Vocabulary;
use App\Models\PracticeSession;
use App\Models\PracticeAttempt;
use App\Models\LessonProgress;
use App\Models\UserStatisticsSnapshot;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
    /**
     * Get overview statistics with storytelling insights
     */
    public function getOverviewStats(User $user, string $timezone = 'UTC'): array
    {
        $now = now($timezone);
        
        // Total vocabulary
        $totalWords = Vocabulary::where('user_id', $user->id)->count();
        
        // Calculate Average / Day
        // We need to know when the user started adding vocabulary to calculate a meaningful average
        // Ensure created_at is valid
        $firstVocab = Vocabulary::where('user_id', $user->id)
            ->whereNotNull('created_at')
            ->orderBy('created_at', 'asc')
            ->value('created_at');
            
        $averagePerDay = 0;
        $consistencyRate = 0;
        $daysActive = 1;
        
        if ($firstVocab) {
            $startDate = Carbon::parse($firstVocab)->startOfDay();
            $endDate = $now->copy()->endOfDay();
            
            // Calculate absolute difference in days
            $totalDays = max(1, $startDate->diffInDays($endDate));
            $daysActive = $totalDays;
            
            $averagePerDay = $totalWords > 0 ? round($totalWords / $daysActive, 1) : 0;
            
            // Consistency Rate: Days with ANY activity (vocabulary, practice, or learning)
            // Use GROUP BY to get unique dates properly
            $vocabDates = Vocabulary::where('user_id', $user->id)
                ->where('created_at', '>=', $startDate)
                ->selectRaw('DATE(created_at) as activity_date')
                ->groupBy('activity_date')
                ->pluck('activity_date')
                ->toArray();
                
            $practiceDates = PracticeSession::where('user_id', $user->id)
                ->where('status', 'completed')
                ->where('created_at', '>=', $startDate)
                ->selectRaw('DATE(created_at) as activity_date')
                ->groupBy('activity_date')
                ->pluck('activity_date')
                ->toArray();
                
            $lessonDates = LessonProgress::where('user_id', $user->id)
                ->where('updated_at', '>=', $startDate)
                ->selectRaw('DATE(updated_at) as activity_date')
                ->groupBy('activity_date')
                ->pluck('activity_date')
                ->toArray();
                
            // Merge all dates and count unique ones
            $allDates = array_unique(array_merge($vocabDates, $practiceDates, $lessonDates));
            $activeDaysCount = count($allDates);
            
            $consistencyRate = round(($activeDaysCount / $totalDays) * 100, 0);
        } elseif ($totalWords > 0) {
            // Fallback if created_at is null but words exist (e.g. imported without dates)
            // Assume 1 day activity to avoid 0 average
             $averagePerDay = $totalWords;
             $consistencyRate = 100; // If they have words, they were active today
        }

        // Total study time (from snapshots or live)
        $totalTimeSeconds = LessonProgress::where('user_id', $user->id)->sum('time_spent')
            + PracticeSession::where('user_id', $user->id)->where('status', 'completed')->sum('duration_seconds');
        $totalHours = round($totalTimeSeconds / 3600, 1);
        
        // Generate insights
        $insights = $this->generateInsights($user, $timezone);

        return [
            'words_learned' => $totalWords,
            'consistency_rate' => $consistencyRate,
            'average_per_day' => $averagePerDay,
            'total_study_hours' => $totalHours,
            'insights' => $insights,
        ];
    }

    /**
     * Get vocabulary statistics
     */
    public function getVocabularyStats(User $user, string $period, string $timezone = 'UTC'): array
    {
        $now = now($timezone);
        $startDate = $this->getPeriodStartDate($period, $now);
        
        // Overview (live counts - small query)
        $overview = Vocabulary::where('user_id', $user->id)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN learning_status = 'mastered' THEN 1 ELSE 0 END) as mastered,
                SUM(CASE WHEN learning_status = 'learning' THEN 1 ELSE 0 END) as learning,
                SUM(CASE WHEN learning_status = 'review' THEN 1 ELSE 0 END) as review
            ")
            ->first();
        
        $total = $overview->total ?? 0;
        $masteryRate = $total > 0 ? round((($overview->mastered ?? 0) / $total) * 100, 1) : 0;
        
        // By Part of Speech (for drill-down)
        $byPos = Vocabulary::where('user_id', $user->id)
            ->select('part_of_speech', DB::raw('COUNT(*) as count'))
            ->groupBy('part_of_speech')
            ->orderByDesc('count')
            ->get()
            ->map(fn($item) => [
                'label' => ucfirst($item->part_of_speech ?? 'Other'),
                'value' => $item->part_of_speech ?? 'other',
                'count' => $item->count,
            ])
            ->toArray();
        
        // SRS Level Breakdown (0-8)
        $srsLabels = ['New', 'Apprentice 1', 'Apprentice 2', 'Apprentice 3', 'Apprentice 4', 'Guru 1', 'Guru 2', 'Master', 'Enlightened'];
        
        // Optimized: Single query with GROUP BY
        $srsCounts = Vocabulary::where('user_id', $user->id)
            ->selectRaw('srs_level, COUNT(*) as count')
            ->groupBy('srs_level')
            ->pluck('count', 'srs_level')
            ->toArray();

        $srsBreakdown = [];
        for ($i = 0; $i <= 8; $i++) {
            $srsBreakdown[] = [
                'level' => $i,
                'label' => $srsLabels[$i] ?? "Level $i",
                'count' => $srsCounts[$i] ?? 0,
            ];
        }
        
        // Due for Review
        $dueForReview = [
            'today' => Vocabulary::where('user_id', $user->id)
                ->whereDate('next_review_at', $now->toDateString())
                ->count(),
            'overdue' => Vocabulary::where('user_id', $user->id)
                ->where('next_review_at', '<', $now)
                ->count(),
            'upcoming_7_days' => Vocabulary::where('user_id', $user->id)
                ->whereBetween('next_review_at', [$now, $now->copy()->addDays(7)])
                ->count(),
        ];
        
        // Difficulty Distribution
        // Optimized: Single query with CASE WHEN
        $diffStats = Vocabulary::where('user_id', $user->id)
            ->selectRaw("
                SUM(CASE WHEN difficulty_score BETWEEN 0 AND 20 THEN 1 ELSE 0 END) as range_1,
                SUM(CASE WHEN difficulty_score BETWEEN 21 AND 40 THEN 1 ELSE 0 END) as range_2,
                SUM(CASE WHEN difficulty_score BETWEEN 41 AND 60 THEN 1 ELSE 0 END) as range_3,
                SUM(CASE WHEN difficulty_score BETWEEN 61 AND 80 THEN 1 ELSE 0 END) as range_4,
                SUM(CASE WHEN difficulty_score BETWEEN 81 AND 100 THEN 1 ELSE 0 END) as range_5
            ")
            ->first();

        $difficultyDistribution = [
            ['range' => '0-20', 'label' => 'Very Easy', 'count' => (int)($diffStats->range_1 ?? 0)],
            ['range' => '21-40', 'label' => 'Easy', 'count' => (int)($diffStats->range_2 ?? 0)],
            ['range' => '41-60', 'label' => 'Medium', 'count' => (int)($diffStats->range_3 ?? 0)],
            ['range' => '61-80', 'label' => 'Hard', 'count' => (int)($diffStats->range_4 ?? 0)],
            ['range' => '81-100', 'label' => 'Very Hard', 'count' => (int)($diffStats->range_5 ?? 0)],
        ];
        
        // Retention Curve (SRS effectiveness proof)
        $retentionCurve = $this->calculateRetentionCurve($user);
        
        // Recent Activity (from snapshots or live)
        $recentActivity = $this->getRecentVocabActivity($user, $startDate, $now);
        
        // Improvement Zone (Wall of Shame - top 5 failed words)
        $improvementZone = Vocabulary::where('user_id', $user->id)
            ->where('times_wrong', '>', 0)
            ->orderByDesc('times_wrong')
            ->orderByDesc('difficulty_score')
            ->limit(5)
            ->get(['id', 'english_word', 'translation', 'times_wrong', 'times_correct', 'difficulty_score'])
            ->map(fn($v) => [
                'id' => $v->id,
                'word' => $v->english_word,
                'translation' => $v->translation,
                'times_wrong' => $v->times_wrong,
                'times_correct' => $v->times_correct ?? 0,
                'total_attempts' => ($v->times_correct ?? 0) + $v->times_wrong,
                'difficulty' => $v->difficulty_score ?? 50,
            ])
            ->toArray();
        
        return [
            'overview' => [
                'total' => $total,
                'mastered' => $overview->mastered ?? 0,
                'learning' => $overview->learning ?? 0,
                'review' => $overview->review ?? 0,
                'mastery_rate' => $masteryRate,
            ],
            'by_part_of_speech' => $byPos,
            'srs_breakdown' => $srsBreakdown,
            'due_for_review' => $dueForReview,
            'difficulty_distribution' => $difficultyDistribution, // Keeping for backward compatibility or remove if strictly unused
            'retention_curve' => $retentionCurve,
            'recent_activity' => $recentActivity, // Keeping for backward compatibility
            'mastered_activity' => $this->getMasteredActivity($user, $now, $startDate),
            'daily_heatmap' => $this->getVocabularyHeatmap($user, $now, $startDate),
            'improvement_zone' => $improvementZone,
        ];
    }

    private function getMasteredActivity(User $user, Carbon $now, ?Carbon $startDate): array
    {
        // If 'all' time (null startDate), default to 30 days or handle differently? 
        // Usually charts need a finite range. Let's default to 30 days if null, or 1 year.
        // Or if the user really wants ALL time, we might need to find the first activity.
        if (!$startDate) {
            $firstActivity = Vocabulary::where('user_id', $user->id)->min('updated_at');
            $startDate = $firstActivity ? Carbon::parse($firstActivity) : $now->copy()->subDays(30);
        }

        // Ensure we don't go into the future
        if ($startDate > $now) {
            $startDate = $now->copy()->subDays(6);
        }

        $stats = Vocabulary::where('user_id', $user->id)
            ->where('learning_status', 'mastered')
            ->where('updated_at', '>=', $startDate)
            ->selectRaw('DATE(updated_at) as date, count(*) as count')
            ->groupBy('date')
            ->get()
            ->mapWithKeys(function ($item) {
                return [substr($item->date, 0, 10) => $item];
            });

        $activity = [];
        $current = $startDate->copy();
        
        // Safety: Limit to 366 days to prevent infinite loops or huge payloads
        $daysDiff = $startDate->diffInDays($now);
        if ($daysDiff > 366) {
             // For very long periods, maybe group by week? For now, let's just cap or stick to daily but beware payload size.
             // Let's stick to daily but simple loop.
        }

        while ($current <= $now) {
            $date = $current->toDateString();
            $activity[] = [
                'date' => $date,
                'mastered' => isset($stats[$date]) ? $stats[$date]->count : 0,
            ];
            $current->addDay();
        }
        
        return $activity;
    }

    private function getVocabularyHeatmap(User $user, Carbon $now, ?Carbon $startDate): array
    {
        // Heatmap usually shows a fixed grid (e.g. year). 
        // If period is filtered, we can either:
        // 1. Show only dots for that period (on the full year grid).
        // 2. Or filter the query.
        // Let's filter the query to be efficient, but the frontend might still render the full year grid.
        
        $queryStart = $startDate ?? $now->copy()->startOfYear();
        // However, standard heatmap usually shows "This Year" or "Last 365 days".
        // If user selects "Last 7 days", showing just 7 dots on a year grid is accurate.
        
        // If startDate is BEFORE start of this year, we should probably include it?
        // The frontend renders Jan-Dec of CURRENT YEAR (2026).
        // So we should bound the query to the current year to match the frontend grid.
        $gridStart = $now->copy()->startOfYear();
        $gridEnd = $now->copy()->endOfYear();

        $counts = Vocabulary::where('user_id', $user->id)
            ->whereBetween('created_at', [$gridStart, $gridEnd])
             // Optionally add startDate filter if it's within this year?
             // Actually, if I select "Last 7 Days", I probably only want to see those 7 days highlighted.
             // So:
            ->when($startDate, fn($q) => $q->where('created_at', '>=', $startDate))
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->get()
            ->map(fn($item) => [
                'date' => $item->date,
                'count' => $item->count
            ])
            ->values()
            ->toArray();
            
        return $counts;
    }

    /**
     * Get practice statistics
     */
    public function getPracticeStats(User $user, string $period, string $timezone = 'UTC'): array
    {
        $now = now($timezone);
        $startDate = $this->getPeriodStartDate($period, $now);
        
        // Completed sessions in period
        $sessions = PracticeSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->when($startDate, fn($q) => $q->where('created_at', '>=', $startDate))
            ->get();
        
        $totalSessions = $sessions->count();
        $totalQuestions = $sessions->sum('total_questions');
        $totalCorrect = $sessions->sum('correct_answers');
        $totalTime = $sessions->sum('duration_seconds');
        $avgAccuracy = $totalSessions > 0 ? round($sessions->avg('accuracy'), 1) : 0;
        $bestAccuracy = $totalSessions > 0 ? round($sessions->max('accuracy'), 1) : 0;
        
        // Streak
        $streak = $user->streak->current_streak ?? 0;
        
        // By Mode
        $byMode = $sessions->groupBy('mode')->map(function ($group, $mode) {
            return [
                'mode' => $mode,
                'sessions' => $group->count(),
                'accuracy' => round($group->avg('accuracy'), 1),
            ];
        })->values()->toArray();
        
        // Accuracy Trend (daily for period)
        $accuracyTrend = $this->getAccuracyTrend($user, $startDate, $now);
        
        // Time Distribution (hour of day)
        $timeDistribution = $sessions->groupBy(fn($s) => Carbon::parse($s->created_at)->hour)
            ->map(fn($g, $hour) => ['hour' => (int) $hour, 'sessions' => $g->count()])
            ->sortBy('hour')
            ->values()
            ->toArray();
        
        // Direction Performance
        $directionPerformance = $sessions->groupBy('direction')->map(function ($group, $direction) {
            return [
                'direction' => $direction,
                'count' => $group->sum('total_questions'),
                'accuracy' => round($group->avg('accuracy'), 1),
            ];
        })->values()->toArray();
        
        // Weekly Heatmap (GitHub-style)
        $weeklyHeatmap = $this->getWeeklyHeatmap($user, $now);
        
        // Hardest Words (words with lowest accuracy)
        $hardestWords = $this->getHardestWords($user, $startDate, $now);
        
        // Recent Sessions
        $recentSessions = $sessions->sortByDesc('created_at')->take(10)->map(fn($s) => [
            'id' => $s->id,
            'mode' => $s->mode,
            'accuracy' => $s->accuracy,
            'duration' => $s->duration_seconds,
            'date' => $s->created_at->toIso8601String(),
        ])->values()->toArray();
        
        return [
            'overview' => [
                'sessions' => $totalSessions,
                'questions' => $totalQuestions,
                'time_mins' => round($totalTime / 60),
                'avg_accuracy' => $avgAccuracy,
                'best_accuracy' => $bestAccuracy,
                'streak' => $streak,
            ],
            'by_mode' => $byMode,
            'accuracy_trend' => $accuracyTrend,
            'time_distribution' => $timeDistribution,
            'direction_performance' => $directionPerformance,
            'weekly_heatmap' => $weeklyHeatmap,
            'hardest_words' => $hardestWords,
            'recent_sessions' => $recentSessions,
        ];
    }

    /**
     * Get learning statistics
     */
    public function getLearningStats(User $user, string $period, string $timezone = 'UTC'): array
    {
        $now = now($timezone);
        $startDate = $this->getPeriodStartDate($period, $now);
        
        // Module stats
        $modulesStarted = LessonProgress::where('user_id', $user->id)
            ->whereIn('status', ['in_progress', 'completed'])
            ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
            ->distinct('lessons.module_id')
            ->count('lessons.module_id');
        
        // Completed lessons
        $completedLessons = LessonProgress::where('user_id', $user->id)
            ->where('status', 'completed')
            ->when($startDate, fn($q) => $q->where('completed_at', '>=', $startDate))
            ->count();
        
        $inProgressLessons = LessonProgress::where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->count();
        
        // Time spent
        $totalTimeSeconds = LessonProgress::where('user_id', $user->id)
            ->when($startDate, fn($q) => $q->where('started_at', '>=', $startDate))
            ->sum('time_spent');
        
        
        // Progress by Module
        $progressByModule = $this->getProgressByModule($user);
        
        // Daily Learning Activity (minutes per day for current week, with week offset support)
        $dailyActivity = $this->getDailyLearningActivity($user, $now);
        
        // Activity Heatmap (Yearly)
        $heatmap = $this->getLearningHeatmap($user, $now);
        
        // Quiz Performance
        $quizStats = LessonProgress::where('user_id', $user->id)
            ->where('status', 'completed')
            ->when($startDate, fn($q) => $q->where('completed_at', '>=', $startDate))
            ->selectRaw('SUM(correct_answers) as correct, SUM(total_quiz_blocks) as total')
            ->first();
        
        $quizAccuracy = ($quizStats->total ?? 0) > 0 
            ? round((($quizStats->correct ?? 0) / $quizStats->total) * 100, 1) 
            : 0;
        
        // Recent Lessons (Completed & In Progress)
        $recentLessons = LessonProgress::where('user_id', $user->id)
            ->whereIn('status', ['completed', 'in_progress'])
            ->with('lesson.module')
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get()
            ->map(fn($lp) => [
                'title' => $lp->lesson->title ?? 'Unknown',
                'module' => $lp->lesson->module->title ?? 'Unknown',
                'score' => $lp->score,
                'status' => $lp->status,
                'progress' => ($lp->lesson->total_blocks ?? 0) > 0 
                    ? round(($lp->completed_blocks / $lp->lesson->total_blocks) * 100) 
                    : 0,
                'has_quiz' => ($lp->total_quiz_blocks ?? 0) > 0,
                'date' => $lp->updated_at?->toIso8601String(),
            ])
            ->toArray();
        
        return [
            'overview' => [
                'modules_started' => $modulesStarted,
                'modules_completed' => $this->countCompletedModules($user),
                'lessons_completed' => $completedLessons,
                'lessons_in_progress' => $inProgressLessons,
                'hours' => round($totalTimeSeconds / 3600, 1),
            ],
            'progress_by_module' => $progressByModule,
            'daily_activity' => $dailyActivity,
            'activity_heatmap' => $heatmap,
            'quiz_performance' => [
                'total' => $quizStats->total ?? 0,
                'correct' => $quizStats->correct ?? 0,
                'accuracy' => $quizAccuracy,
            ],
            'recent_lessons' => $recentLessons,
        ];
    }

    /**
     * Get vocabulary list for drill-down modal
     */
    public function getVocabularyDrillDown(User $user, string $type, string $value, int $page = 1, int $perPage = 20, string $timezone = 'UTC'): array
    {
        $query = Vocabulary::where('user_id', $user->id);
        
        switch ($type) {
            case 'pos':
                $query->where('part_of_speech', $value);
                break;
            case 'status':
                $query->where('learning_status', $value);
                break;
            case 'srs_level':
                $query->where('srs_level', (int) $value);
                break;
            case 'difficulty':
                $ranges = [
                    'very_easy' => [0, 20],
                    'easy' => [21, 40],
                    'medium' => [41, 60],
                    'hard' => [61, 80],
                    'very_hard' => [81, 100],
                ];
                if (isset($ranges[$value])) {
                    $query->whereBetween('difficulty_score', $ranges[$value]);
                }
                break;
            case 'review_status':
                $now = now($timezone);
                
                switch ($value) {
                    case 'overdue':
                        // Match 'overdue' logic in getVocabularyStats: strictly less than now
                        $query->where('next_review_at', '<', $now);
                        break;
                    case 'today':
                        // Match 'today' logic: strictly this calendar date
                        $query->whereDate('next_review_at', $now->toDateString());
                        break;
                    case 'soon':
                        // Match 'upcoming_7_days' logic: between now and 7 days from now
                        $query->where('next_review_at', '>=', $now)
                              ->where('next_review_at', '<=', $now->copy()->addDays(7));
                        break;
                }
                break;
        }
        
        return $query->orderBy('english_word')
            ->paginate($perPage, ['id', 'english_word', 'translation', 'part_of_speech', 'learning_status', 'difficulty_score'])
            ->toArray();
    }

    // === PRIVATE HELPER METHODS ===

    private function getPeriodStartDate(string $period, Carbon $now): ?Carbon
    {
        return match ($period) {
            '7d' => $now->copy()->subDays(7),
            '30d' => $now->copy()->subDays(30),
            'year' => $now->copy()->subYear(),
            'all' => null,
            default => $now->copy()->subDays(30),
        };
    }

    private function generateInsights(User $user, string $timezone): array
    {
        $insights = [];
        $now = now($timezone);
        
        // Vocabulary growth insight
        $thisWeekAdded = Vocabulary::where('user_id', $user->id)
            ->where('created_at', '>=', $now->copy()->subWeek())
            ->count();
        
        $lastWeekAdded = Vocabulary::where('user_id', $user->id)
            ->whereBetween('created_at', [$now->copy()->subWeeks(2), $now->copy()->subWeek()])
            ->count();
        
        if ($thisWeekAdded > 0) {
            $growth = $lastWeekAdded > 0 ? round((($thisWeekAdded - $lastWeekAdded) / $lastWeekAdded) * 100) : 100;
            
            if ($growth > 0) {
                $insights[] = [
                    'type' => 'growth',
                    'message' => "Vocab up {$growth}% this week! Nice growth! 🌱",
                    'trend' => 'up',
                    'value' => $growth,
                ];
            } elseif ($growth < 0) {
                $insights[] = [
                    'type' => 'suggestion',
                    'message' => 'Time to add some new words!',
                    'trend' => 'down',
                    'value' => abs($growth),
                ];
            }
        }
        
        // Practice streak insight
        $streak = $user->streak->current_streak ?? 0;
        if ($streak >= 7) {
            $insights[] = [
                'type' => 'achievement',
                'message' => "{$streak}-day streak! You're crushing it! 🔥",
                'trend' => 'up',
                'value' => $streak,
            ];
        } else {
            // Instead of "Start a fresh streak", show more useful insights
            
            // 1. Words due for review today
            $dueToday = Vocabulary::where('user_id', $user->id)
                ->whereDate('next_review_at', $now->toDateString())
                ->count();
            $overdue = Vocabulary::where('user_id', $user->id)
                ->where('next_review_at', '<', $now)
                ->count();
            
            if ($overdue > 0) {
                $insights[] = [
                    'type' => 'suggestion',
                    'message' => "{$overdue} words overdue for review! Time to practice 📚",
                    'trend' => 'down',
                    'value' => $overdue,
                ];
            } elseif ($dueToday > 0) {
                $insights[] = [
                    'type' => 'suggestion',
                    'message' => "{$dueToday} words to review today. Keep your memory sharp! 🧠",
                    'trend' => 'stable',
                    'value' => $dueToday,
                ];
            } else {
                // 2. Consistency feedback based on this week
                $daysActiveThisWeek = collect([
                    Vocabulary::where('user_id', $user->id)
                        ->where('created_at', '>=', $now->copy()->startOfWeek())
                        ->selectRaw('DATE(created_at) as d')->groupBy('d')->pluck('d')->toArray(),
                    PracticeSession::where('user_id', $user->id)
                        ->where('status', 'completed')
                        ->where('created_at', '>=', $now->copy()->startOfWeek())
                        ->selectRaw('DATE(created_at) as d')->groupBy('d')->pluck('d')->toArray(),
                ])->flatten()->unique()->count();
                
                $dayOfWeek = $now->dayOfWeek ?: 7; // 1-7 (Mon-Sun)
                
                if ($daysActiveThisWeek >= $dayOfWeek) {
                    $insights[] = [
                        'type' => 'achievement',
                        'message' => "Perfect week so far! {$daysActiveThisWeek}/{$dayOfWeek} days active 💪",
                        'trend' => 'up',
                        'value' => $daysActiveThisWeek,
                    ];
                } elseif ($daysActiveThisWeek > 0) {
                    $remaining = $dayOfWeek - $daysActiveThisWeek;
                    $insights[] = [
                        'type' => 'suggestion',
                        'message' => "Active {$daysActiveThisWeek} days this week. {$remaining} more to go! 🎯",
                        'trend' => 'stable',
                        'value' => $daysActiveThisWeek,
                    ];
                } else {
                    // 3. Motivational: Show total mastered words as encouragement
                    $masteredCount = Vocabulary::where('user_id', $user->id)
                        ->where('learning_status', 'mastered')
                        ->count();
                    
                    if ($masteredCount > 0) {
                        $insights[] = [
                            'type' => 'achievement',
                            'message' => "You've mastered {$masteredCount} words! Keep it up! ⭐",
                            'trend' => 'up',
                            'value' => $masteredCount,
                        ];
                    } else {
                        $insights[] = [
                            'type' => 'suggestion',
                            'message' => 'Add some vocabulary to start your journey! 🚀',
                            'trend' => 'stable',
                        ];
                    }
                }
            }
        }
        
        // Accuracy insight
        $recentSessions = PracticeSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->where('created_at', '>=', $now->copy()->subWeek())
            ->avg('accuracy');
        
        if ($recentSessions !== null && $recentSessions >= 80) {
            $insights[] = [
                'type' => 'achievement',
                'message' => round($recentSessions) . '% accuracy this week! Sharp! 🎯',
                'trend' => 'up',
                'value' => round($recentSessions),
            ];
        }
        
        return array_slice($insights, 0, 3); // Max 3 insights
    }

    private function calculateRetentionCurve(User $user): array
    {
        // Calculate retention rate by days since last practice
        // This shows SRS effectiveness - words practiced N days ago, how many still retained
        $curve = [];
        $now = now();
        
        foreach ([1, 3, 7, 14, 30] as $days) {
            $practicedBefore = Vocabulary::where('user_id', $user->id)
                ->where('last_practiced_at', '<=', $now->copy()->subDays($days))
                ->where('times_practiced', '>', 0)
                ->count();
            
            $stillRetained = Vocabulary::where('user_id', $user->id)
                ->where('last_practiced_at', '<=', $now->copy()->subDays($days))
                ->where('times_practiced', '>', 0)
                ->where('consecutive_correct', '>=', 1)
                ->count();
            
            $retention = $practicedBefore > 0 ? round(($stillRetained / $practicedBefore) * 100) : 100;
            
            $curve[] = [
                'days_since' => $days,
                'retention_percent' => $retention,
            ];
        }
        
        return $curve;
    }

    private function getRecentVocabActivity(User $user, ?Carbon $startDate, Carbon $endDate): array
    {
        $activity = [];
        $start = ($startDate ?? $endDate->copy()->subDays(30));
        
        // Optimized: Fetch all counts in 2 queries instead of looping through dates
        $addedCounts = Vocabulary::where('user_id', $user->id)
            ->whereBetween('created_at', [$start, $endDate])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();
            
        $masteredCounts = Vocabulary::where('user_id', $user->id)
            ->where('learning_status', 'mastered')
            ->whereBetween('updated_at', [$start, $endDate])
            ->selectRaw('DATE(updated_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date')
            ->toArray();

        $current = $start->copy();
        while ($current <= $endDate) {
            $dateStr = $current->toDateString();
            
            $activity[] = [
                'date' => $dateStr,
                'added' => $addedCounts[$dateStr] ?? 0,
                'mastered' => $masteredCounts[$dateStr] ?? 0,
            ];
            $current->addDay();
        }
        
        return $activity;
    }

    private function getAccuracyTrend(User $user, ?Carbon $startDate, Carbon $endDate): array
    {
        $trend = [];
        $start = ($startDate ?? $endDate->copy()->subDays(14));
        
        // Optimized: Group by date query
        $statsByDate = PracticeSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$start, $endDate])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as sessions, AVG(accuracy) as avg_accuracy')
            ->groupBy('date')
            ->get()
            ->keyBy('date');
            
        $current = $start->copy();
        while ($current <= $endDate) {
            $dateStr = $current->toDateString();
            
            // Note: If no sessions, we skip adding to array to match original behavior logic
            // (Original code only added if sessions > 0)
            if (isset($statsByDate[$dateStr])) {
                $stat = $statsByDate[$dateStr];
                $trend[] = [
                    'date' => $dateStr,
                    'accuracy' => round($stat->avg_accuracy, 1),
                    'sessions' => $stat->sessions,
                ];
            }
            
            $current->addDay();
        }
        
        return $trend;
    }

    private function getWeeklyHeatmap(User $user, Carbon $now): array
    {
        $heatmap = [];
        $startOfYear = $now->copy()->startOfYear();
        
        // Get all sessions for the year
        $sessions = PracticeSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->where('created_at', '>=', $startOfYear)
            ->get()
            ->groupBy(fn($s) => $s->created_at->toDateString());
        
        // Build heatmap for last 52 weeks
        for ($week = 0; $week < 52; $week++) {
            for ($day = 0; $day < 7; $day++) {
                $date = $startOfYear->copy()->addWeeks($week)->startOfWeek()->addDays($day);
                $dateString = $date->toDateString();
                
                if ($date > $now) continue;
                
                $count = isset($sessions[$dateString]) ? $sessions[$dateString]->count() : 0;
                
                $heatmap[] = [
                    'day' => $day,
                    'week' => $week,
                    'count' => $count,
                    'date' => $dateString,
                ];
            }
        }
        
        return $heatmap;
    }

    private function getDailyLearningActivity(User $user, Carbon $now, int $weekOffset = 0): array
    {
        // Calculate week start based on offset (0 = current week, 1 = last week, etc.)
        $weekStart = $now->copy()->subWeeks($weekOffset)->startOfWeek();
        $weekEnd = $weekStart->copy()->endOfWeek();
        
        // Get all lesson progress for this week
        $progress = LessonProgress::where('user_id', $user->id)
            ->whereBetween('updated_at', [$weekStart, $weekEnd])
            ->get()
            ->groupBy(fn($p) => $p->updated_at->toDateString());
        
        // Build activity array for each day of the week
        $activity = [];
        for ($day = 0; $day < 7; $day++) {
            $date = $weekStart->copy()->addDays($day);
            $dateString = $date->toDateString();
            
            $minutes = 0;
            if (isset($progress[$dateString])) {
                $minutes = round($progress[$dateString]->sum('time_spent') / 60);
            }
            
            $activity[] = [
                'day' => $date->format('D'),  // Mon, Tue, Wed...
                'date' => $dateString,
                'minutes' => (int) $minutes,
            ];
        }
        
        return [
            'week_start' => $weekStart->toDateString(),
            'week_end' => $weekEnd->toDateString(),
            'week_label' => $weekStart->format('M d') . ' - ' . $weekEnd->format('M d'),
            'data' => $activity,
            'total_minutes' => array_sum(array_column($activity, 'minutes')),
        ];
    }

    private function getLearningHeatmap(User $user, Carbon $now): array
    {
        $heatmap = [];
        $startOfYear = $now->copy()->startOfYear();
        
        // Get all completed lessons/progress for the year
        // We count any lesson activity (started or completed)
        $progress = LessonProgress::where('user_id', $user->id)
            ->where('updated_at', '>=', $startOfYear)
            ->get()
            ->groupBy(fn($p) => $p->updated_at->toDateString());
        
        // Build heatmap for last 52 weeks
        for ($week = 0; $week < 52; $week++) {
            for ($day = 0; $day < 7; $day++) {
                $date = $startOfYear->copy()->addWeeks($week)->startOfWeek()->addDays($day);
                $dateString = $date->toDateString();
                
                if ($date > $now) continue;
                
                // Count how many lessons were active/completed on this day and total duration
                $dayData = isset($progress[$dateString]) ? $progress[$dateString] : collect();
                $count = $dayData->count();
                $minutes = round($dayData->sum('time_spent') / 60);
                
                $heatmap[] = [
                    'day' => $day,
                    'week' => $week,
                    'count' => $count,
                    'minutes' => (int) $minutes,
                    'date' => $dateString,
                ];
            }
        }
        
        return $heatmap;
    }

    private function getHardestWords(User $user, ?Carbon $startDate, Carbon $endDate): array
    {
        // Get all attempts grouped by vocabulary
        $attempts = PracticeAttempt::whereHas('session', function ($q) use ($user, $startDate) {
                $q->where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->when($startDate, fn($q2) => $q2->where('created_at', '>=', $startDate));
            })
            ->with('vocabulary:id,english_word,translation,part_of_speech')
            ->get()
            ->groupBy('vocabulary_id');
        
        $hardestWords = [];
        
        foreach ($attempts as $vocabId => $vocabAttempts) {
            $total = $vocabAttempts->count();
            $correct = $vocabAttempts->where('is_correct', true)->count();
            $accuracy = $total > 0 ? round(($correct / $total) * 100, 1) : 0;
            
            // Only include words with at least 2 attempts and accuracy < 80%
            if ($total >= 2 && $accuracy < 80) {
                $vocab = $vocabAttempts->first()->vocabulary;
                if ($vocab) {
                    $hardestWords[] = [
                        'id' => $vocab->id,
                        'english_word' => $vocab->english_word,
                        'translation' => $vocab->translation,
                        'part_of_speech' => $vocab->part_of_speech,
                        'total_attempts' => $total,
                        'correct' => $correct,
                        'accuracy' => $accuracy,
                    ];
                }
            }
        }
        
        // Sort by accuracy ascending (hardest first), take top 8
        usort($hardestWords, fn($a, $b) => $a['accuracy'] <=> $b['accuracy']);
        
        return array_slice($hardestWords, 0, 8);
    }

    private function getProgressByModule(User $user): array
    {
        // Optimized: Eager load lesson counts and progress to avoid N+1 queries
        $modules = \App\Models\Module::withCount('lessons')
            ->withCount(['lessons as completed_count' => function ($q) use ($user) {
                $q->whereHas('progress', function($p) use ($user) {
                    $p->where('user_id', $user->id)
                      ->where('status', 'completed');
                });
            }])
            ->get();
            
        // Fetch average scores in a separate efficient query or eager load
        // Since withAvg on hasManyThrough/deep relations can be tricky, 
        // we can fetch aggregated scores grouped by module
        $moduleScores = DB::table('lesson_progress')
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->where('lesson_progress.user_id', $user->id)
            ->where('lesson_progress.status', 'completed')
            ->select('lessons.module_id', DB::raw('AVG(lesson_progress.score) as avg_score'))
            ->groupBy('lessons.module_id')
            ->pluck('avg_score', 'module_id');

        $progress = [];
        
        foreach ($modules as $module) {
            $completed = $module->completed_count;
            $avgScore = $moduleScores[$module->id] ?? 0;
            
            $progress[] = [
                'id' => $module->id,
                'slug' => $module->slug,
                'title' => $module->title,
                'total' => $module->lessons_count,
                'completed' => $completed,
                'percent' => $module->lessons_count > 0 ? round(($completed / $module->lessons_count) * 100) : 0,
                'score' => round($avgScore, 1),
            ];
        }
        
        return $progress;
    }

    private function getCompletionTrend(User $user, ?Carbon $startDate, Carbon $endDate): array
    {
        $trend = [];
        $current = ($startDate ?? $endDate->copy()->subWeeks(12))->copy()->startOfWeek();
        
        while ($current <= $endDate) {
            $weekEnd = $current->copy()->endOfWeek();
            $weekLabel = $current->format('Y-\\WW');
            
            $completed = LessonProgress::where('user_id', $user->id)
                ->where('status', 'completed')
                ->whereBetween('completed_at', [$current, $weekEnd])
                ->count();
            
            $timeSpent = LessonProgress::where('user_id', $user->id)
                ->whereBetween('started_at', [$current, $weekEnd])
                ->sum('time_spent');
            
            $trend[] = [
                'week' => $weekLabel,
                'completed' => $completed,
                'time_mins' => round($timeSpent / 60),
            ];
            
            $current->addWeek();
        }
        
        return $trend;
    }
    private function countCompletedModules(User $user): int
    {
        $modules = \App\Models\Module::withCount('lessons')->get();
        $completedCount = 0;
        
        foreach ($modules as $module) {
            if ($module->lessons_count === 0) continue;
            
            $userCompletedLessons = LessonProgress::where('user_id', $user->id)
                ->whereIn('lesson_id', $module->lessons()->select('id'))
                ->where('status', 'completed')
                ->count();
                
            if ($userCompletedLessons >= $module->lessons_count) {
                $completedCount++;
            }
        }
        
        return $completedCount;
    }
}
