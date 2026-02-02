<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StreakActivity extends Model
{
    protected $fillable = [
        'user_id',
        'activity_date',
        'vocabulary_count'
    ];

    protected $casts = [
        'activity_date' => 'date',
    ];
}
