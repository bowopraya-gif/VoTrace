<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Vocabulary;
use App\Models\PracticeSession;
use App\Models\PracticeAttempt;
use App\Models\LessonProgress;
use App\Models\UserStatisticsSnapshot;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AggregateUserStatistics extends Command
{
    protected $signature = 'statistics:aggregate 
                            {--user= : Aggregate for specific user ID only}
                            {--date= : Specific date to aggregate (Y-m-d format)}
                            {--force : Force re-aggregate even if snapshot exists}';
    
    protected $description = 'Aggregate user statistics into snapshots for performance optimization';

    public function handle(): int
    {
        $date = $this->option('date') 
            ? Carbon::parse($this->option('date')) 
            : Carbon::yesterday(); // Default to yesterday for cron
        
        $userId = $this->option('user');
        $force = $this->option('force');
        
        $this->info("Aggregating statistics for: {$date->toDateString()}");
        
        $users = $userId 
            ? User::where('id', $userId)->get()
            : User::all();
        
        $bar = $this->output->createProgressBar($users->count());
        $bar->start();
        
        foreach ($users as $user) {
            $this->aggregateForUser($user, $date, $force);
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        $this->info("Aggregation completed for {$users->count()} users.");
        
        return Command::SUCCESS;
    }

    private function aggregateForUser(User $user, Carbon $date, bool $force): void
    {
        // Check if snapshot already exists
        $existing = UserStatisticsSnapshot::where('user_id', $user->id)
            ->where('snapshot_date', $date->toDateString())
            ->where('period_type', 'daily')
            ->first();
        
        if ($existing && !$force) {
            return; // Skip if exists and not forcing
        }
        
        // === VOCABULARY METRICS ===
        $vocabStats = $this->getVocabularyStats($user, $date);
        
        // === PRACTICE METRICS ===
        $practiceStats = $this->getPracticeStats($user, $date);
        
        // === LEARNING METRICS ===
        $learningStats = $this->getLearningStats($user, $date);
        
        // === UPSERT SNAPSHOT ===
        UserStatisticsSnapshot::updateOrCreate(
            [
                'user_id' => $user->id,
                'snapshot_date' => $date->toDateString(),
                'period_type' => 'daily',
            ],
            array_merge($vocabStats, $practiceStats, $learningStats)
        );
    }

    private function getVocabularyStats(User $user, Carbon $date): array
    {
        // Total counts by status (snapshot of current state)
        $statusCounts = Vocabulary::where('user_id', $user->id)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN learning_status = 'mastered' THEN 1 ELSE 0 END) as mastered,
                SUM(CASE WHEN learning_status = 'learning' THEN 1 ELSE 0 END) as learning,
                SUM(CASE WHEN learning_status = 'review' THEN 1 ELSE 0 END) as review
            ")
            ->first();
        
        // Words added on this specific date
        $addedToday = Vocabulary::where('user_id', $user->id)
            ->whereDate('created_at', $date)
            ->count();
        
        // By Part of Speech
        $byPos = Vocabulary::where('user_id', $user->id)
            ->select('part_of_speech', DB::raw('COUNT(*) as count'))
            ->groupBy('part_of_speech')
            ->pluck('count', 'part_of_speech')
            ->toArray();
        
        // SRS Level distribution (0-8)
        $srsLevels = [];
        for ($i = 0; $i <= 8; $i++) {
            $srsLevels[$i] = Vocabulary::where('user_id', $user->id)
                ->where('srs_level', $i)
                ->count();
        }
        
        // Difficulty distribution (0-20, 21-40, 41-60, 61-80, 81-100)
        $difficultyDist = [
            'very_easy' => Vocabulary::where('user_id', $user->id)->whereBetween('difficulty_score', [0, 20])->count(),
            'easy' => Vocabulary::where('user_id', $user->id)->whereBetween('difficulty_score', [21, 40])->count(),
            'medium' => Vocabulary::where('user_id', $user->id)->whereBetween('difficulty_score', [41, 60])->count(),
            'hard' => Vocabulary::where('user_id', $user->id)->whereBetween('difficulty_score', [61, 80])->count(),
            'very_hard' => Vocabulary::where('user_id', $user->id)->whereBetween('difficulty_score', [81, 100])->count(),
        ];
        
        // Retention Rate: % of words still remembered after SRS review
        // Calculate: words that were correct on their last practice / total practiced
        $totalPracticed = Vocabulary::where('user_id', $user->id)
            ->where('times_practiced', '>', 0)
            ->count();
        
        $stillRetained = Vocabulary::where('user_id', $user->id)
            ->where('times_practiced', '>', 0)
            ->where('consecutive_correct', '>=', 1) // At least 1 correct streak
            ->count();
        
        $retentionRate = $totalPracticed > 0 
            ? round(($stillRetained / $totalPracticed) * 100, 1) 
            : null;
        
        return [
            'vocab_total' => $statusCounts->total ?? 0,
            'vocab_mastered' => $statusCounts->mastered ?? 0,
            'vocab_learning' => $statusCounts->learning ?? 0,
            'vocab_review' => $statusCounts->review ?? 0,
            'vocab_added' => $addedToday,
            'vocab_retention_rate' => $retentionRate,
            'vocab_by_pos' => $byPos,
            'vocab_srs_levels' => $srsLevels,
            'vocab_difficulty_dist' => $difficultyDist,
        ];
    }

    private function getPracticeStats(User $user, Carbon $date): array
    {
        // Sessions on this date
        $sessions = PracticeSession::where('user_id', $user->id)
            ->whereDate('created_at', $date)
            ->where('status', 'completed')
            ->get();
        
        $sessionCount = $sessions->count();
        $totalQuestions = $sessions->sum('total_questions');
        $totalCorrect = $sessions->sum('correct_answers');
        $totalTime = $sessions->sum('duration_seconds');
        $avgAccuracy = $sessionCount > 0 ? round($sessions->avg('accuracy'), 1) : null;
        
        // By Mode
        $byMode = $sessions->groupBy('mode')->map(function ($group) {
            return [
                'sessions' => $group->count(),
                'accuracy' => round($group->avg('accuracy'), 1),
            ];
        })->toArray();
        
        // By Direction
        $byDirection = $sessions->groupBy('direction')->map(function ($group) {
            return [
                'count' => $group->sum('total_questions'),
                'accuracy' => round($group->avg('accuracy'), 1),
            ];
        })->toArray();
        
        // Mistakes by POS (from attempts on this date)
        $sessionIds = $sessions->pluck('id');
        $mistakesByPos = [];
        
        if ($sessionIds->isNotEmpty()) {
            $wrongAttempts = PracticeAttempt::whereIn('practice_session_id', $sessionIds)
                ->where('is_correct', false)
                ->with('vocabulary:id,part_of_speech')
                ->get();
            
            $mistakesByPos = $wrongAttempts
                ->groupBy(fn($a) => $a->vocabulary->part_of_speech ?? 'unknown')
                ->map(fn($group) => $group->count())
                ->toArray();
        }
        
        return [
            'practice_sessions' => $sessionCount,
            'practice_questions' => $totalQuestions,
            'practice_correct' => $totalCorrect,
            'practice_accuracy' => $avgAccuracy,
            'practice_time_seconds' => $totalTime,
            'practice_by_mode' => $byMode,
            'practice_by_direction' => $byDirection,
            'practice_mistakes_by_pos' => $mistakesByPos,
        ];
    }

    private function getLearningStats(User $user, Carbon $date): array
    {
        // Lessons completed on this date
        $completedToday = LessonProgress::where('user_id', $user->id)
            ->whereDate('completed_at', $date)
            ->where('status', 'completed')
            ->get();
        
        $lessonsCompleted = $completedToday->count();
        $learningTime = $completedToday->sum('time_spent');
        $quizCorrect = $completedToday->sum('correct_answers');
        $quizTotal = $completedToday->sum('total_quiz_blocks');
        
        return [
            'lessons_completed' => $lessonsCompleted,
            'learning_time_seconds' => $learningTime,
            'quiz_correct' => $quizCorrect,
            'quiz_total' => $quizTotal,
        ];
    }
}
