<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Vocabulary;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Vocabulary>
 */
class VocabularyFactory extends Factory
{
    protected $model = Vocabulary::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'english_word' => fake()->unique()->word(),
            'translation' => fake()->word(),
            'pronunciation' => fake()->word(),
            'part_of_speech' => fake()->randomElement(['noun', 'verb', 'adjective', 'adverb']),
            'learning_status' => 'learning',
            'difficulty_score' => 50,
            'srs_level' => 0,
            'ease_factor' => 2.5,
            'interval_days' => 0,
            'times_practiced' => 0,
            'times_correct' => 0,
            'times_wrong' => 0,
            'consecutive_correct' => 0,
        ];
    }
}
