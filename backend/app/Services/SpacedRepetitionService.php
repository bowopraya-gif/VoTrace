<?php

namespace App\Services;

use App\Models\Vocabulary;
use Carbon\Carbon;

class SpacedRepetitionService
{
    /**
     * Base intervals for each SRS level (in days)
     * Level 0: New word (same day)
     * Level 1: 1 day
     * Level 2: 3 days
     * Level 3: 7 days
     * Level 4: 14 days
     * Level 5: 30 days (mastered)
     */
    private const BASE_INTERVALS = [0, 1, 3, 7, 14, 30];

    /**
     * Process an answer and update vocabulary stats
     */
    public function processAnswer(Vocabulary $vocab, bool $isCorrect, int $timeMs = 0, int $hintPenalty = 0, float $weight = 1.0, string $timezone = 'UTC'): array
    {
        $oldLevel = $vocab->srs_level;
        $difficultyScore = $vocab->difficulty_score ?? 50; // Initialize if null
        $easeFactor = $vocab->ease_factor ?? 2.5; // Initialize if null
        $currentInterval = $vocab->interval_days ?? 0; // Keep this for existing logic

        // 1. Calculate new Difficulty Score (0-100)
        // If wrong: increase difficulty significantly
        // If correct: decrease difficulty slightly
        if (!$isCorrect) {
            $difficultyScore = min(100, $difficultyScore + (10 * $weight));
        } else {
            // Faster answer = easier
            $timeFactor = max(0, (3000 - $timeMs) / 100); // Bonus for answers under 3s
            $difficultyScore = max(0, $difficultyScore - (2 * $weight) - ($timeFactor * 0.5 * $weight));
        }

        // 2. Apply Hint Penalty to Ease Factor
        // Each hint reduces ease factor by 0.05, minimum 1.3
        if ($hintPenalty > 0) {
            $easeFactor = max(1.3, $easeFactor - (0.05 * $hintPenalty));
        }
        
        // Existing logic for SRS level and interval calculation
        if ($isCorrect) {
            // Move up one level (max 5)
            // Weight affects probability of level up? No, standard SRS doesn't weight easy/hard modes usually this way.
            // But user requested "half the effect".
            // If weight is 0.5, maybe we shouldn't increase interval as much?
            // "SRS Weight: 50% impact compared to other modes" 
            
            $newLevel = min($oldLevel + 1, 5);
            
            // Calculate interval using ease factor
            $baseInterval = self::BASE_INTERVALS[$newLevel] ?? 30;
            
            // Apply weight to the interval multiplier? 
            // Or apply weight to Ease Factor changes?
            // Let's apply weight to the interval growth.
            // If weight is 0.5, the interval grows 50% less? 
            // Actually, simply scaling the final interval might be safest.
            
            $calculatedInterval = (int) round($baseInterval * $easeFactor);
            
            // If weight < 1, damp the interval increase vs previous interval
            // But here we are just setting absolute values from table.
            // Let's just scale the interval directly.
            if ($weight < 1.0) {
                 // Blend between previous interval and new calculated interval
                 $newInterval = (int) round($currentInterval + (($calculatedInterval - $currentInterval) * $weight));
                 // Ensure at least 1 day increase if it was supposed to increase
                 if ($newInterval <= $currentInterval && $calculatedInterval > $currentInterval) {
                     $newInterval = $currentInterval + 1;
                 }
            } else {
                 $newInterval = $calculatedInterval;
            }

            
            // Bonus for fast correct answers (< 3 seconds)
            if ($timeMs > 0 && $timeMs < 3000) {
                $easeFactor = min($easeFactor + (0.1 * $weight), 3.0); // Max ease 3.0
            }
            
            // Update consecutive correct
            $consecutiveCorrect = $vocab->consecutive_correct + 1;
            
        } else {
            // Wrong answer: reset to level 1 (not 0, to give a chance)
            // If weight is low, maybe punishment is less severe?
            // Let's keep punishment standard for now, or maybe reduce level drop?
            // User said "50% impact". 
            
            $newLevel = max($oldLevel - 2, 1);
            $newInterval = 1; // Review again tomorrow
            
            // Decrease ease factor (makes intervals shorter)
            $easeFactor = max($easeFactor - (0.2 * $weight), 1.3); // Min ease 1.3
            
            // Reset consecutive correct
            $consecutiveCorrect = 0;
        }

        // Calculate next review date
        $nextReviewAt = Carbon::now($timezone)->addDays($newInterval);

        // Calculate difficulty score based on performance
        $difficultyScore = $this->calculateDifficultyScore($vocab, $isCorrect, $timeMs);

        // Update learning status based on SRS level
        $learningStatus = $this->determineLearningStatus($newLevel, $consecutiveCorrect);

        $updates = [
            'srs_level' => $newLevel,
            'ease_factor' => round($easeFactor, 2),
            'interval_days' => $newInterval,
            'next_review_at' => $nextReviewAt,
            'difficulty_score' => $difficultyScore,
            'consecutive_correct' => $consecutiveCorrect,
            'times_practiced' => $vocab->times_practiced + 1,
            'times_correct' => $vocab->times_correct + ($isCorrect ? 1 : 0),
            'times_wrong' => $vocab->times_wrong + ($isCorrect ? 0 : 1),
            'last_practiced_at' => Carbon::now($timezone),
            'learning_status' => $learningStatus,
        ];

        // Handle mastered_at timestamp
        if ($learningStatus === 'mastered' && $vocab->learning_status !== 'mastered') {
            $updates['mastered_at'] = Carbon::now($timezone);
        } elseif ($learningStatus !== 'mastered') {
            $updates['mastered_at'] = null;
        }

        // Update vocabulary
        $vocab->update($updates);

        return [
            'new_level' => $newLevel,
            'next_review_days' => $newInterval,
            'next_review_at' => $nextReviewAt->toIso8601String(),
            'difficulty_score' => $difficultyScore,
            'learning_status' => $learningStatus,
        ];
    }

    /**
     * Calculate difficulty score (0-100, higher = harder)
     */
    private function calculateDifficultyScore(Vocabulary $vocab, bool $isCorrect, int $responseTimeMs): float
    {
        $currentDifficulty = $vocab->difficulty_score ?? 50;
        $totalAttempts = $vocab->times_practiced + 1;
        
        // Factor 1: Accuracy ratio (wrong answers increase difficulty)
        $wrongRatio = $totalAttempts > 0 
            ? ($vocab->times_wrong + ($isCorrect ? 0 : 1)) / $totalAttempts 
            : 0;
        
        // Factor 2: Response time (slower = harder)
        $timeScore = 0;
        if ($responseTimeMs > 0) {
            // 0-2s = easy, 2-5s = medium, 5s+ = hard
            if ($responseTimeMs < 2000) {
                $timeScore = -10;
            } elseif ($responseTimeMs > 5000) {
                $timeScore = 10;
            }
        }
        
        // Factor 3: Word length (longer = potentially harder)
        $wordLengthScore = strlen($vocab->english_word) > 8 ? 5 : 0;
        
        // Weighted calculation
        $newDifficulty = ($currentDifficulty * 0.7) + ($wrongRatio * 100 * 0.3);
        $newDifficulty += $timeScore + $wordLengthScore;
        
        // Clamp to 0-100
        return max(0, min(100, round($newDifficulty, 2)));
    }

    /**
     * Determine learning status based on SRS level
     */
    private function determineLearningStatus(int $srsLevel, int $consecutiveCorrect): string
    {
        if ($srsLevel >= 5 && $consecutiveCorrect >= 5) {
            return 'mastered';
        } elseif ($srsLevel >= 3) {
            return 'review';
        }
        return 'learning';
    }

    /**
     * Get vocabularies due for review (for smart selection)
     */
    /**
     * Get vocabularies due for review (for smart selection)
     */
    public function getDueVocabularies(int $userId, int $limit = 50, string $timezone = 'UTC'): \Illuminate\Database\Eloquent\Collection
    {
        $now = Carbon::now($timezone);
        return Vocabulary::where('user_id', $userId)
            ->where(function ($query) use ($now) {
                $query->whereNull('next_review_at')
                      ->orWhere('next_review_at', '<=', $now);
            })
            ->orderByRaw('CASE 
                WHEN next_review_at IS NULL THEN 0 
                ELSE 1 
            END')
            ->orderBy('next_review_at')
            ->orderBy('srs_level')
            ->limit($limit)
            ->get();
    }

    /**
     * Sync SRS data when learning status is manually changed
     */
    public function syncSrsWithStatus(Vocabulary $vocab, string $newStatus, string $timezone = 'UTC'): void
    {
        // Default values
        $updates = [];
        $now = Carbon::now($timezone);

        switch ($newStatus) {
            case 'mastered':
                $updates = [
                    'srs_level' => 5,
                    'interval_days' => 30,
                    'next_review_at' => $now->addDays(30),
                    'ease_factor' => max($vocab->ease_factor, 2.5), // Keep higher factor or reset to default
                    'consecutive_correct' => max($vocab->consecutive_correct, 5), // Ensure min 5
                    'mastery_score' => 100.00,
                    'mastered_at' => $now,
                ];
                break;

            case 'review':
                $updates = [
                    'srs_level' => 3,
                    'interval_days' => 7,
                    'next_review_at' => $now->addDays(7),
                    // Keep existing ease factor or default
                    'consecutive_correct' => 3,  // Assume some consistency
                    'mastered_at' => null,
                ];
                break;

            case 'learning':
                $updates = [
                    'srs_level' => 1,
                    'interval_days' => 1,
                    'next_review_at' => $now->addDays(1),
                    'consecutive_correct' => 0,
                    'mastery_score' => 0.00,
                    'mastered_at' => null,
                ];
                break;
        }

        if (!empty($updates)) {
            $vocab->update($updates);
        }
    }
}
