<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserStreak extends Model
{
    protected $fillable = [
        'user_id',
        'current_streak',
        'longest_streak',
        'last_activity_date',
        'streak_started_at',
        'total_active_days'
    ];

    protected $casts = [
        'last_activity_date' => 'date',
        'streak_started_at' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
