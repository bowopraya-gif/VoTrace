<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserStatisticsSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'snapshot_date',
        'period_type',
        // Vocabulary
        'vocab_total',
        'vocab_mastered',
        'vocab_learning',
        'vocab_review',
        'vocab_added',
        'vocab_retention_rate',
        'vocab_by_pos',
        'vocab_srs_levels',
        'vocab_difficulty_dist',
        // Practice
        'practice_sessions',
        'practice_questions',
        'practice_correct',
        'practice_accuracy',
        'practice_time_seconds',
        'practice_by_mode',
        'practice_by_direction',
        'practice_mistakes_by_pos',
        // Learning
        'lessons_completed',
        'learning_time_seconds',
        'quiz_correct',
        'quiz_total',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'vocab_retention_rate' => 'float',
        'practice_accuracy' => 'float',
        'vocab_by_pos' => 'array',
        'vocab_srs_levels' => 'array',
        'vocab_difficulty_dist' => 'array',
        'practice_by_mode' => 'array',
        'practice_by_direction' => 'array',
        'practice_mistakes_by_pos' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for filtering by period type
     */
    public function scopeDaily($query)
    {
        return $query->where('period_type', 'daily');
    }

    public function scopeWeekly($query)
    {
        return $query->where('period_type', 'weekly');
    }

    public function scopeMonthly($query)
    {
        return $query->where('period_type', 'monthly');
    }

    /**
     * Scope for date range filtering with timezone support
     */
    public function scopeInPeriod($query, string $period, string $timezone = 'UTC')
    {
        $now = now($timezone);
        
        switch ($period) {
            case '7d':
                return $query->where('snapshot_date', '>=', $now->copy()->subDays(7)->toDateString());
            case '30d':
                return $query->where('snapshot_date', '>=', $now->copy()->subDays(30)->toDateString());
            case 'year':
                return $query->where('snapshot_date', '>=', $now->copy()->subYear()->toDateString());
            case 'all':
            default:
                return $query;
        }
    }
}
