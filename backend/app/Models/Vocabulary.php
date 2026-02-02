<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vocabulary extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'english_word',
        'pronunciation',
        'translation',
        'part_of_speech',
        'learning_status',
        'usage_note',
        'personal_notes',
        'example_sentence',
        'example_sentence_translation',
        // Audio/TTS Fields
        'audio_url',
        'audio_hash',
        'audio_status',
        // SRS Fields
        'srs_level',
        'ease_factor',
        'interval_days',
        'next_review_at',
        'difficulty_score',
        'times_practiced',
        'times_correct',
        'times_wrong',
        'consecutive_correct',
        'last_practiced_at',
        'mastery_score',
        'mastered_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'next_review_at' => 'datetime',
        'last_practiced_at' => 'datetime',
        'mastered_at' => 'datetime',
        'mastery_score' => 'float',
        'difficulty_score' => 'float',
        'ease_factor' => 'float',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->uuid = $model->uuid ?? (string) \Illuminate\Support\Str::uuid();
        });
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function exampleSentences()
    {
        return $this->hasMany(ExampleSentence::class);
    }
}
