<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'title',
        'slug',
        'description',
        'order_index',
        'estimated_mins',
        'difficulty',
        'total_blocks',
        'required_blocks',
        'completion_criteria',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'total_blocks' => 'integer',
        'required_blocks' => 'integer',
        'completion_criteria' => 'array',
        'estimated_mins' => 'integer',
        'order_index' => 'integer',
    ];

    public function module()
    {
        return $this->belongsTo(Module::class);
    }

    public function contentBlocks()
    {
        return $this->hasMany(ContentBlock::class)->orderBy('order_index');
    }

    public function progress()
    {
        return $this->hasMany(LessonProgress::class);
    }

    // Helper to get user progress
    public function getUserProgress($userId)
    {
        return $this->progress()->where('user_id', $userId)->first();
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }
}
