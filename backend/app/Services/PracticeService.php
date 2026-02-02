<?php

namespace App\Services;

use App\Models\PracticeSession;
use App\Models\PracticeAttempt;
use App\Models\Vocabulary;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PracticeService
{
    private SpacedRepetitionService $srsService;

    public function __construct(SpacedRepetitionService $srsService)
    {
        $this->srsService = $srsService;
    }

    /**
     * Get practice statistics for the user
     */
    public function getPracticeStats(User $user, string $timezone = 'UTC'): array
    {
        $now = Carbon::now($timezone);
        $sessions = PracticeSession::where('user_id', $user->id)->where('status', 'completed');
        
        $todaySessions = (clone $sessions)->whereDate('created_at', $now->toDateString())->get();
        $wordsPracticedToday = $todaySessions->sum('total_questions');

        $yesterdaySessions = (clone $sessions)->whereDate('created_at', $now->copy()->subDay()->toDateString())->get();
        $wordsPracticedYesterday = $yesterdaySessions->sum('total_questions');
        
        $allSessions = $sessions->get();
        $totalSessions = $allSessions->count();
        $averageAccuracy = $allSessions->avg('accuracy') ?? 0;
        
        $vocabularyStats = Vocabulary::where('user_id', $user->id)
            ->selectRaw("
                SUM(CASE WHEN learning_status = 'mastered' THEN 1 ELSE 0 END) as mastered,
                SUM(CASE WHEN learning_status = 'learning' THEN 1 ELSE 0 END) as learning,
                SUM(CASE WHEN learning_status = 'review' THEN 1 ELSE 0 END) as review
            ")->first();

        $wordsMasteredToday = Vocabulary::where('user_id', $user->id)
            ->whereDate('mastered_at', $now->toDateString())
            ->count();

        $wordsMasteredYesterday = Vocabulary::where('user_id', $user->id)
            ->whereDate('mastered_at', $now->copy()->subDay()->toDateString())
            ->count();
            
        return [
            'words_practiced_today' => $wordsPracticedToday,
            'words_practiced_yesterday' => $wordsPracticedYesterday,
            'total_sessions' => $totalSessions,
            'current_streak' => $user->streak->current_streak ?? 0,
            'average_accuracy' => round($averageAccuracy, 1),
            'words_mastered_today' => $wordsMasteredToday,
            'words_mastered_yesterday' => $wordsMasteredYesterday,
            'words_mastered' => $vocabularyStats->mastered ?? 0,
            'words_learning' => $vocabularyStats->learning ?? 0,
            'words_review' => $vocabularyStats->review ?? 0,
            'learned_yesterday' => 0, // Placeholder if needed by generic types, but specialized types handle it
        ];
    }

    /**
     * Get recent practice history
     */
    public function getHistory(User $user, int $limit = 10): array
    {
        return PracticeSession::where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get filter options (parts of speech, status counts)
     */
    public function getFilterOptions(User $user): array
    {
        $partsOfSpeech = Vocabulary::where('user_id', $user->id)
            ->whereNotNull('part_of_speech')
            ->distinct()
            ->pluck('part_of_speech')
            ->toArray();

        $statusCounts = Vocabulary::where('user_id', $user->id)
            ->selectRaw("
                SUM(CASE WHEN learning_status = 'learning' THEN 1 ELSE 0 END) as learning,
                SUM(CASE WHEN learning_status = 'review' THEN 1 ELSE 0 END) as review,
                SUM(CASE WHEN learning_status = 'mastered' THEN 1 ELSE 0 END) as mastered
            ")->first();

        return [
            'parts_of_speech' => $partsOfSpeech,
            'status_counts' => [
                'learning' => $statusCounts->learning ?? 0,
                'review' => $statusCounts->review ?? 0,
                'mastered' => $statusCounts->mastered ?? 0,
            ]
        ];
    }

    /**
     * Get the count of vocabulary matching filters
     */
    public function getAvailableCount(User $user, array $filters): int
    {
        $query = Vocabulary::where('user_id', $user->id);
        $query = $this->applyFilters($query, $filters);
        return $query->count();
    }

    /**
     * Start a new practice session
     */
    public function startSession(User $user, array $config): array
    {
        $mode = $config['mode'] ?? 'multiple_choice';
        $direction = $config['direction'] ?? 'en_to_id';
        $questionCount = $config['question_count'] ?? 10;
        $filters = $config['filters'] ?? [];
        $useSmartSelection = $config['smart_selection'] ?? true; // Default to true if not specified

        // Build base query with filters
        $query = Vocabulary::where('user_id', $user->id);
        $query = $this->applyFilters($query, $filters);
        
        if ($useSmartSelection) {
            /**
             * SMART SELECTION ALGORITHM WITH CIRCUIT BREAKER:
             * 
             * 1. Check Overdue Debt:
             *    Jika total Overdue > 50 kata:
             *    - 80% Overdue (Prioritas pelunasan hutang)
             *    - 20% High Difficulty
             *    - 0% New Words (Stop kata baru sampai hutang lunas)
             *
             * 2. Default Distribution (Normal State):
             *    - 30% Overdue
             *    - 30% New Words 
             *    - 20% High Difficulty
             *    - 20% Random Fill
             */
            $vocabulary = $this->getSmartVocabularySelection($query, $questionCount, $user->id);
        } else {
            $vocabulary = $query->inRandomOrder()->limit($questionCount)->get();
        }

        if ($vocabulary->isEmpty()) {
            return ['error' => 'No vocabulary available for the selected filters'];
        }

        // Create session
        $session = PracticeSession::create([
            'user_id' => $user->id,
            'mode' => $mode,
            'direction' => $direction,
            'total_questions' => $vocabulary->count(),
            'correct_answers' => 0,
            'wrong_answers' => 0,
            'accuracy' => 0,
            'duration_seconds' => 0,
            'settings' => $filters,
            'status' => 'in_progress',
        ]);

        // Generate questions
        $questions = [];
        // Eager load exampleSentences to avoid N+1 and ensure we have data
        $pool = Vocabulary::where('user_id', $user->id)->with('exampleSentences')->get();
        
        foreach ($vocabulary as $vocab) {
            // Reload vocab with relationship if not loaded (since smart selection might not have loaded it)
            // Or better, just load it on demand or ensure smart selection returns IDs and we refetch?
            // Smart selection returns Collection of Models. 
            // We can just rely on lazy loading for the few questions we generate, or load it.
            $vocab->load('exampleSentences'); 

            if ($mode === 'typing') {
                $questions[] = $this->generateTypingQuestion($vocab, $direction);
            } elseif ($mode === 'listening') {
                $questions[] = $this->generateListeningQuestion($vocab, $direction);
            } else {
                $questions[] = $this->generateMultipleChoiceQuestion($vocab, $direction, $pool);
            }
        }

        return [
            'session_id' => $session->uuid, // Return UUID
            'questions' => $questions,
            'total' => count($questions),
        ];
    }

    /**
     * Generate a typing question
     */
    private function generateTypingQuestion(Vocabulary $vocab, string $direction): array
    {
        $isEnToId = $direction === 'en_to_id';
        
        // Contextual Cloze Logic:
        // Prioritize columns on Vocabulary table (if user added them manually/new feature)
        // Fallback to example_sentences table (existing data)
        
        $sentenceEn = $vocab->example_sentence;
        $sentenceId = $vocab->example_sentence_translation;

        // If columns empty, check relationship
        if (empty($sentenceEn) && $vocab->exampleSentences->isNotEmpty()) {
            // Pick the first one (or random?)
            $example = $vocab->exampleSentences->first();
            $sentenceEn = $example->sentence;
            $sentenceId = $example->translation;
        }

        // EN -> ID (Type Indo): Use Indo Sentence (translation)
        // ID -> EN (Type English): Use English Sentence
        $finalSentence = $isEnToId 
            ? ($sentenceId ?? $sentenceEn) 
            : $sentenceEn;

        return [
            'id' => $vocab->id,
            'vocabulary_id' => $vocab->uuid, // Return UUID
            'question_text' => $isEnToId ? $vocab->english_word : $vocab->translation,
            'correct_answer' => $isEnToId ? $vocab->translation : $vocab->english_word,
            'learning_status' => $vocab->learning_status,
            'part_of_speech' => $vocab->part_of_speech,
            'example_sentence' => $finalSentence, // Correct language context
        ];
    }

    /**
     * Generate a listening question (audio-based)
     */
    private function generateListeningQuestion(Vocabulary $vocab, string $direction): array
    {
        // Listening Mode is always Dictation (Listen English -> Type English)
        return [
            'id' => $vocab->id,
            'vocabulary_id' => $vocab->uuid, // Return UUID
            'audio_url' => $vocab->audio_url, // Pre-generated audio
            'audio_status' => $vocab->audio_status,
            'question_text' => $vocab->english_word, // Used for generating underscores
            'translation' => $vocab->translation, // Meaning shown in feedback
            'correct_answer' => $vocab->english_word, // User must type the English word
            'learning_status' => $vocab->learning_status,
            'part_of_speech' => $vocab->part_of_speech,
        ];
    }

    /**
     * Smart vocabulary selection with SRS priority and Circuit Breaker
     */
    private function getSmartVocabularySelection($baseQuery, int $limit, int $userId): \Illuminate\Support\Collection
    {
        $now = Carbon::now();
        $result = collect();
        $selectedIds = [];
        
        // Check Overdue Debt (Circuit Breaker)
        $totalOverdue = Vocabulary::where('user_id', $userId)
            ->where('next_review_at', '<=', $now)
            ->count();
            
        $isCircuitBreakerActive = $totalOverdue > 50;
        
        // Determine Ratios
        if ($isCircuitBreakerActive) {
            // Mode: Lunasi Hutang Belajar
            $dueRatio = 0.8;
            $difficultyRatio = 0.2;
            $newRatio = 0.0;
            $randomRatio = 0.0;
        } else {
            // Mode: Normal Balanced Learning
            $dueRatio = 0.3;
            $newRatio = 0.3;
            $difficultyRatio = 0.2;
            $randomRatio = 0.2;
        }

        // Priority 1: Due for review
        $dueCount = (int) ceil($limit * $dueRatio);
        if ($dueCount > 0) {
            $dueItems = (clone $baseQuery)
                ->whereNotNull('next_review_at')
                ->where('next_review_at', '<=', $now)
                ->orderBy('next_review_at') // Prioritize most overdue
                ->limit($dueCount)
                ->get();
            
            $result = $result->merge($dueItems);
            $selectedIds = array_merge($selectedIds, $dueItems->pluck('id')->toArray());
        }

        // Priority 2: New words (Only if Circuit Breaker is OFF)
        $newCount = (int) ceil($limit * $newRatio);
        if ($newCount > 0) {
            $newItems = (clone $baseQuery)
                ->whereNotIn('id', $selectedIds)
                ->where('times_practiced', 0)
                ->orderBy('created_at', 'desc')
                ->limit($newCount)
                ->get();
            
            $result = $result->merge($newItems);
            $selectedIds = array_merge($selectedIds, $newItems->pluck('id')->toArray());
        }

        // Priority 3: High difficulty words
        // Calculate remaining allowance for difficulty after due & new
        $usedCount = $result->count();
        $remainingForDifficulty = (int) ceil($limit * $difficultyRatio);
        
        // Adjustment: fill gap if previous queries returned less than requested
        $actualDifficultyCount = $remainingForDifficulty + ($dueCount - $dueItems->count()) + ($newCount - ($newItems ? $newItems->count() : 0));
        
        if ($actualDifficultyCount > 0) {
            $difficultItems = (clone $baseQuery)
                ->whereNotIn('id', $selectedIds)
                ->orderByDesc('difficulty_score')
                ->limit($actualDifficultyCount)
                ->get();
            
            $result = $result->merge($difficultItems);
            $selectedIds = array_merge($selectedIds, $difficultItems->pluck('id')->toArray());
        }

        // Priority 4: Random Fill (Fallback)
        $remaining = $limit - $result->count();
        if ($remaining > 0) {
            $fillItems = (clone $baseQuery)
                ->whereNotIn('id', $selectedIds)
                ->inRandomOrder()
                ->limit($remaining)
                ->get();
            
            $result = $result->merge($fillItems);
        }

        // Shuffle final result to mix priorities
        return $result->shuffle()->take($limit);
    }

    /**
     * Apply filters to vocabulary query
     */
    private function applyFilters($query, array $filters)
    {
        // Learning status filter
        if (!empty($filters['learning_status'])) {
            $query->whereIn('learning_status', $filters['learning_status']);
        }

        // Part of speech filter
        if (!empty($filters['part_of_speech'])) {
            $query->whereIn('part_of_speech', $filters['part_of_speech']);
        }

        // Last practiced filter (Implemented)
        if (!empty($filters['last_practiced'])) {
            $now = Carbon::now();
            
            foreach ($filters['last_practiced'] as $period) {
                switch ($period) {
                    case 'not_practiced':
                        // Never practiced
                        $query->whereNull('last_practiced_at');
                        break;
                        
                    case 'today':
                        // Practiced today
                        $query->whereDate('last_practiced_at', $now->toDateString());
                        break;
                        
                    case 'this_week':
                        // Practiced within last 7 days
                        $query->where('last_practiced_at', '>=', $now->clone()->subDays(7));
                        break;
                        
                    case 'long_ago':
                        // Practiced more than 30 days ago
                        $query->where('last_practiced_at', '<', $now->clone()->subDays(30));
                        break;
                        
                    case 'overdue':
                        // SRS due date has passed
                        $query->where('next_review_at', '<', $now);
                        break;
                }
            }
        }

        // Time added filter
        if (!empty($filters['time_added'])) {
            foreach ($filters['time_added'] as $period) {
                if ($period === 'today') {
                    $query->whereDate('created_at', Carbon::today());
                } elseif ($period === 'this_week') {
                    $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()]);
                } elseif ($period === 'this_month') {
                    $query->whereBetween('created_at', [Carbon::now()->startOfMonth(), Carbon::now()]);
                }
            }
        }

        return $query;
    }

    /**
     * Generate a multiple choice question from a vocabulary item
     */
    private function generateMultipleChoiceQuestion(Vocabulary $vocab, string $direction, $pool): array
    {
        // Set question text based on direction
        if ($direction === 'en_to_id') {
            $questionText = $vocab->english_word;
            $correctAnswer = $vocab->translation;
        } else {
            $questionText = $vocab->translation;
            $correctAnswer = $vocab->english_word;
        }

        // Generate wrong options with Smart Logic
        $wrongOptions = $this->generateWrongOptions($vocab, $direction, $pool, 3);

        // Create options array and shuffle
        $options = array_merge([$correctAnswer], $wrongOptions);
        shuffle($options);

        // Find correct index after shuffle
        $correctIndex = array_search($correctAnswer, $options);

        return [
            'id' => $vocab->id,
            'vocabulary_id' => $vocab->uuid, // Return UUID
            'question_text' => $questionText,
            'learning_status' => $vocab->learning_status,
            'part_of_speech' => $vocab->part_of_speech,
            'options' => $options,
            'correct_index' => $correctIndex,
        ];
    }

    /**
     * Generate SMART wrong options for multiple choice
     * 
     * Strategy:
     * 1. Prioritas 1: Same part of speech (lebih menipu)
     * 2. Prioritas 2: Similar difficulty score (fair challenge)
     * 3. Fallback: Random dari pool
     */
    private function generateWrongOptions(Vocabulary $correct, string $direction, $pool, int $count = 3): array
    {
        $correctDifficulty = $correct->difficulty_score ?? 50;
        $correctPos = $correct->part_of_speech;
        
        // Exclude the correct answer
        $candidates = $pool->filter(fn($v) => $v->id !== $correct->id);
        $totalCandidates = $candidates->count();

        // SPECIAL HANDLING: Small Database (< 4 items)
        // Jika user punya < 4 kata, kita tidak bisa generate 3 opsi unik.
        // Solusi: Ambil semua unique candidates yang ada.
        if ($totalCandidates < $count) {
            return $candidates->shuffle()
                ->map(fn($v) => $direction === 'en_to_id' ? $v->translation : $v->english_word)
                ->values()
                ->toArray();
        }
        
        $selected = collect();
        $usedIds = [];
        
        // Strategy 1: Same POS + Similar difficulty (±20) - 2 options
        $samePosOptions = $candidates
            ->filter(fn($v) => $v->part_of_speech === $correctPos)
            ->filter(fn($v) => abs(($v->difficulty_score ?? 50) - $correctDifficulty) <= 20)
            ->shuffle()
            ->take(2);
        
        $selected = $selected->merge($samePosOptions);
        $usedIds = array_merge($usedIds, $selected->pluck('id')->toArray());
        
        // Strategy 2: Same POS, any difficulty - 1 option
        if ($selected->count() < $count) {
            $remaining = $count - $selected->count();
            $samePosAny = $candidates
                ->filter(fn($v) => $v->part_of_speech === $correctPos)
                ->filter(fn($v) => !in_array($v->id, $usedIds))
                ->shuffle()
                ->take($remaining);
            
            $selected = $selected->merge($samePosAny);
            $usedIds = array_merge($usedIds, $samePosAny->pluck('id')->toArray());
        }
        
        // Strategy 3: Similar difficulty, any POS (Fallback)
        if ($selected->count() < $count) {
            $remaining = $count - $selected->count();
            $similarDifficulty = $candidates
                ->filter(fn($v) => !in_array($v->id, $usedIds))
                // Note: sortBy is not mutable, returns new collection
                ->sortBy(fn($v) => abs(($v->difficulty_score ?? 50) - $correctDifficulty))
                ->take($remaining);
            
            $selected = $selected->merge($similarDifficulty);
            $usedIds = array_merge($usedIds, $similarDifficulty->pluck('id')->toArray());
        }
        
        // Fallback: Random fill
        if ($selected->count() < $count) {
            $remaining = $count - $selected->count();
            $randomFill = $candidates
                ->filter(fn($v) => !in_array($v->id, $usedIds))
                ->shuffle()
                ->take($remaining);
            
            $selected = $selected->merge($randomFill);
        }

        // Return the answer text based on direction
        return $selected->map(function ($vocab) use ($direction) {
            return $direction === 'en_to_id' ? $vocab->translation : $vocab->english_word;
        })->values()->toArray();
    }

    /**
     * Submit an answer for a question
     */
    public function submitAnswer(User $user, array $data): array
    {
        $vocab = Vocabulary::where('uuid', $data['vocabulary_id']) 
            ->where('user_id', $user->id)
            ->firstOrFail();

        $session = PracticeSession::where('uuid', $data['session_id']) 
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Record the attempt
        PracticeAttempt::create([
            'practice_session_id' => $session->id, // Still use INT ID for relation
            'vocabulary_id' => $vocab->id, // Still use INT ID for relation
            'user_answer' => $data['user_answer'],
            'correct_answer' => $data['correct_answer'],
            'is_correct' => $data['is_correct'],
            'time_spent_ms' => $data['time_spent_ms'],
        ]);

        // Update Session Stats
        if ($data['is_correct']) {
            $session->increment('correct_answers');
        } else {
            $session->increment('wrong_answers');
        }

        // Calculate accuracy
        $total = $session->correct_answers + $session->wrong_answers;
        $accuracy = ($total > 0) ? ($session->correct_answers / $total) * 100 : 0;
        $session->update(['accuracy' => $accuracy]);

        // === SRS UPDATE ===
        // Delegate SRS logic to SpacedRepetitionService
        $hintCount = $data['hint_count'] ?? 0;
        $srsResult = $this->srsService->processAnswer(
            $vocab, 
            $data['is_correct'], 
            $data['time_spent_ms'],
            $hintCount
        );

        return [
            'status' => 'success',
            'srs_update' => $srsResult
        ];
    }

    /**
     * Complete a practice session
     */
    public function completeSession(User $user, array $data): array
    {
        $session = PracticeSession::where('uuid', $data['session_id']) 
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Calculate accuracy
        $total = $session->correct_answers + $session->wrong_answers;
        $accuracy = $total > 0 ? ($session->correct_answers / $total) * 100 : 0;

        // Update session
        $session->update([
            'status' => 'completed',
            'duration_seconds' => $data['duration_seconds'],
            'accuracy' => round($accuracy, 1),
        ]);

        return [
            'session' => $session->fresh()->toArray(),
        ];
    }
    /**
     * Get session details (for result page)
     */
    public function getSessionDetails(User $user, string $sessionId): array
    {
        $session = PracticeSession::where('uuid', $sessionId) 
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Get wrong answers for review
        // Logic: Find attempts where is_correct = 0 in this session
        $wrongAttempts = PracticeAttempt::with('vocabulary')
            ->where('practice_session_id', $session->id)
            ->where('is_correct', false)
            ->get();
            
        $wrongAnswers = $wrongAttempts->map(function ($attempt) {
            return [
                'id' => $attempt->vocabulary->id,
                'english' => $attempt->vocabulary->english_word,
                'translation' => $attempt->vocabulary->translation,
            ];
        })->unique('id')->values()->toArray();

        return [
            'session' => $session->toArray(),
            'wrong_answers' => $wrongAnswers
        ];
    }
}
