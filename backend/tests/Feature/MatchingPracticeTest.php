<?php

namespace Tests\Feature;

use App\Models\PracticeSession;
use App\Models\User;
use App\Models\Vocabulary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MatchingPracticeTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_start_matching_session_with_jumbled_grid()
    {
        $user = User::factory()->create();
        
        // Create 10 vocabularies (enough for 2 rounds of 5 pairs)
        $vocabs = Vocabulary::factory()->count(10)->create([
            'user_id' => $user->id
        ]);

        $response = $this->actingAs($user)->postJson('/api/practice/start', [
            'mode' => 'matching',
            'direction' => 'en_to_id',
            'question_count' => 10,
            'filters' => []
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'session_id',
            'questions' => [
                '*' => [
                    'type',
                    'pair_count',
                    'items' => [
                        '*' => ['id', 'pair_id', 'text', 'type']
                    ]
                ]
            ]
        ]);

        $data = $response->json();
        $firstRound = $data['questions'][0];
        
        $this->assertEquals('matching', $firstRound['type']);
        $this->assertEquals(5, $firstRound['pair_count']);
        $this->assertCount(10, $firstRound['items']); // 5 pairs * 2 items (source/target)
        
        // Verify items are shuffled/jumbled (at least type shouldn't be alternating perfectly or id sorted)
        // Hard to test randomness, but we can verify structure
        $this->assertArrayHasKey('id', $firstRound['items'][0]);
        $this->assertArrayHasKey('pair_id', $firstRound['items'][0]);
    }

    public function test_can_submit_batch_matching_answers()
    {
        $user = User::factory()->create();
        $vocab = Vocabulary::factory()->create(['user_id' => $user->id]);
        
        $session = PracticeSession::create([
            'user_id' => $user->id,
            'mode' => 'matching',
            'total_questions' => 10,
            'status' => 'in_progress'
        ]);

        $payload = [
            'session_id' => $session->uuid,
            'results' => [
                [
                    'vocabulary_id' => $vocab->uuid,
                    'is_correct' => true,
                    'time_spent_ms' => 2000
                ]
            ]
        ];

        $response = $this->actingAs($user)->postJson('/api/practice/answer-batch', $payload);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success', 'processed' => 1]);

        // Verify session stats updated
        $session->refresh();
        $this->assertEquals(1, $session->correct_answers);
        $this->assertEquals(100, $session->accuracy);
        
        // Verify SRS update happened (50% weight)
        // Default difficulty is 50. 
        // Correct answer changes:
        // Difficulty: -2 * 0.5 = -1
        // Time factor bonus (<3s): (3000-2000)/100 = 10 * 0.5 * 0.5 = 2.5? 
        // Formula: max(0, diff - (2*w) - (timeFact * 0.5 * w))
        
        $vocab->refresh();
        $this->assertNotEquals(50, $vocab->difficulty_score); // Should have changed
    }
}
