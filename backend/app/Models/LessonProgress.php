<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonProgress extends Model
{
    use HasFactory;

    protected $table = 'lesson_progress';

    protected $fillable = [
        'user_id',
        'lesson_id',
        'status',
        'completed_blocks',
        'completed_block_ids',
        'correct_answers',
        'total_quiz_blocks',
        'score',
        'last_block_index',
        'started_at',
        'completed_at',
        'time_spent',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'completed_blocks' => 'integer',
        'completed_block_ids' => 'array',
        'correct_answers' => 'integer',
        'total_quiz_blocks' => 'integer',
        'score' => 'float',
        'last_block_index' => 'integer',
        'time_spent' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function getModuleIdAttribute()
    {
        return $this->lesson?->module_id;
    }
}
