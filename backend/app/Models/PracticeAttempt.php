<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PracticeAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'practice_session_id',
        'vocabulary_id',
        'question_type',
        'user_answer',
        'correct_answer',
        'is_correct',
        'time_spent_ms',
    ];

    public function session()
    {
        return $this->belongsTo(PracticeSession::class, 'practice_session_id');
    }

    public function vocabulary()
    {
        return $this->belongsTo(Vocabulary::class);
    }
}
