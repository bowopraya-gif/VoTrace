<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Laravel\Scout\Searchable;

class Module extends Model
{
    use HasFactory, Searchable;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'thumbnail_url',
        'difficulty',
        'category',
        'is_published',
        'order_index'
    ];

    /**
     * Get the indexable data array for the model.
     *
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category,
            'difficulty' => $this->difficulty,
            'lessons_count' => $this->lessons()->count(),
        ];
    }

    protected $casts = [
        'is_published' => 'boolean',
        'lessons_count' => 'integer',
        'order_index' => 'integer',
    ];

    public function lessons()
    {
        return $this->hasMany(Lesson::class)->orderBy('order_index');
    }

    public function getRouteKeyName()
    {
        return 'slug';
    }
}
