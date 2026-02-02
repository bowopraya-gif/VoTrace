<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExampleSentence extends Model
{
    use HasFactory;

    protected $fillable = [
        'vocabulary_id',
        'sentence',
        'translation',
    ];

    public function vocabulary()
    {
        return $this->belongsTo(Vocabulary::class);
    }
}
