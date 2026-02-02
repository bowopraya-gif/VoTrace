<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vocabulary;
use App\Jobs\GenerateAudioJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

use Illuminate\Support\Arr;

class VocabularyController extends Controller
{
    public function index(Request $request)
    {
        // 1. Base Query - Eager load examples for partial display in list
        $query = $request->user()->vocabularies()->with('exampleSentences');
        
        $searchTerm = $request->input('search');

        // 2. Hybrid Search: Full-Text for 4+ chars, LIKE for short words
        if ($searchTerm) {
            // MySQL Full-Text has minimum word length of 4 chars by default
            if (strlen($searchTerm) >= 4) {
                // Fast Full-Text Search for longer words
                $query->whereRaw(
                    "MATCH(english_word, translation, usage_note) AGAINST(? IN BOOLEAN MODE)", 
                    ['+' . $searchTerm . '*']
                );
            } else {
                // Fallback to LIKE for short words (e.g., "who", "the", "a")
                $query->where(function($q) use ($searchTerm) {
                    $q->where('english_word', 'like', "%{$searchTerm}%")
                      ->orWhere('translation', 'like', "%{$searchTerm}%")
                      ->orWhere('usage_note', 'like', "%{$searchTerm}%");
                });
            }
        }

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('learning_status', $status);
        }

        // Filter by part of speech
        if ($pos = $request->input('pos')) {
            $query->where('part_of_speech', $pos);
        }

        // Sorting
        $sortColumn = $request->input('sort', 'created_at');
        $sortOrder = $request->input('order', 'desc');
        
        $allowedSorts = [
            'english_word', 'translation', 'learning_status', 'part_of_speech', 'created_at',
            'mastery_score', 'next_review_at', 'srs_level', 'times_practiced', 'last_practiced_at'
        ];

        if (in_array($sortColumn, $allowedSorts)) {
            $query->orderBy($sortColumn, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min($request->input('per_page', 10), 50);
        
        // Get paginated results
        $results = $query->paginate($perPage);
        
        // 3. Return Lean Resource
        return \App\Http\Resources\VocabularyListResource::collection($results);
    }

    public function store(Request $request)
    {
        // ... (keep existing store method as is, unchanged)
        $validated = $request->validate([
            'english_word' => 'required|string|max:255',
            'pronunciation' => 'nullable|string|max:255',
            'translation' => 'required|string|max:255',
            'part_of_speech' => 'required|string',
            'learning_status' => 'required|in:learning,review,mastered',
            'usage_note' => 'nullable|string',
            'personal_notes' => 'nullable|string',
            'example_sentences' => 'nullable|array',
            'example_sentences.*.sentence' => 'required_with:example_sentences|string',
            'example_sentences.*.translation' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $vocabulary = $request->user()->vocabularies()->create([
                'english_word' => $validated['english_word'],
                'pronunciation' => $validated['pronunciation'] ?? null,
                'translation' => $validated['translation'],
                'part_of_speech' => $validated['part_of_speech'],
                'learning_status' => $validated['learning_status'],
                'usage_note' => $validated['usage_note'] ?? null,
                'personal_notes' => $validated['personal_notes'] ?? null,
            ]);

            if (!empty($validated['example_sentences'])) {
                foreach ($validated['example_sentences'] as $sentence) {
                    $vocabulary->exampleSentences()->create([
                        'sentence' => $sentence['sentence'],
                        'translation' => $sentence['translation'] ?? null,
                    ]);
                }
            }

            // Streak Update
            $timezone = $request->input('tz', 'UTC');
            app(\App\Services\StreakService::class)->recordVocabularyAdded($request->user(), $timezone);

            // Dispatch audio generation job (async)
            GenerateAudioJob::dispatch($vocabulary);

            DB::commit();

            return response()->json([
                'message' => 'Vocabulary added successfully',
                'vocabulary' => $vocabulary->load('exampleSentences')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to add vocabulary', 'error' => $e->getMessage()], 500);
        }
    }

    public function quickAdd(Request $request, \App\Services\StreakService $streakService)
    {
        $validated = $request->validate([
            'english_word' => 'required|string|max:255',
            'translation' => 'required|string|max:255',
            'example_sentence' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();
            
            // Check if already exists for user
            $existing = $request->user()->vocabularies()
                ->where('english_word', $validated['english_word'])
                ->first();
                
            if ($existing) {
                DB::rollBack();
                return response()->json(['message' => 'Vocabulary already exists', 'vocabulary' => $existing], 200);
            }

            $vocabulary = $request->user()->vocabularies()->create([
                'english_word' => $validated['english_word'],
                'translation' => $validated['translation'],
                'part_of_speech' => 'expression', // Default for quick add
                'learning_status' => 'learning',
            ]);

            if (!empty($validated['example_sentence'])) {
                $vocabulary->exampleSentences()->create([
                    'sentence' => $validated['example_sentence'],
                    'translation' => null,
                ]);
            }

            // Streak Update (Non-blocking)
            try {
                $timezone = $request->input('tz', 'UTC');
                $streakService->recordVocabularyAdded($request->user(), $timezone);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Streak update failed in quickAdd: " . $e->getMessage());
            }

            // Dispatch audio generation job (Non-blocking)
            try {
                GenerateAudioJob::dispatch($vocabulary);
            } catch (\Exception $e) {
                 \Illuminate\Support\Facades\Log::error("Audio job dispatch failed in quickAdd: " . $e->getMessage());
            }

            DB::commit();

            return response()->json([
                'message' => 'Vocabulary added successfully',
                'vocabulary' => $vocabulary->load('exampleSentences')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error("QuickAdd Vocabulary Failed: " . $e->getMessage());
            return response()->json(['message' => 'Failed to add vocabulary', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Request $request, Vocabulary $vocabulary)
    {
        if ($request->user()->id !== $vocabulary->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($vocabulary->load('exampleSentences'));
    }

    public function update(Request $request, Vocabulary $vocabulary)
    {
        if ($request->user()->id !== $vocabulary->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'english_word' => 'sometimes|required|string|max:255',
            'pronunciation' => 'nullable|string|max:255',
            'translation' => 'sometimes|required|string|max:255',
            'part_of_speech' => 'sometimes|required|string',
            'learning_status' => 'sometimes|in:learning,review,mastered',
            'usage_note' => 'nullable|string',
            'personal_notes' => 'nullable|string',
            'example_sentences' => 'nullable|array',
            'example_sentences.*.id' => 'nullable|integer',
            'example_sentences.*.sentence' => 'required|string',
            'example_sentences.*.translation' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Check if status is changing
            $statusChanged = isset($validated['learning_status']) && 
                             $validated['learning_status'] !== $vocabulary->learning_status;
            $newStatus = $validated['learning_status'] ?? null;

            // Update vocabulary fields
            $vocabulary->update(Arr::except($validated, ['example_sentences']));
            
            // Sync SRS if status changed
            if ($statusChanged) {
                app(\App\Services\SpacedRepetitionService::class)->syncSrsWithStatus($vocabulary, $newStatus);
            }
            
            // Sync example sentences
            if (isset($validated['example_sentences'])) {
                $existingIds = [];
                foreach ($validated['example_sentences'] as $sentence) {
                    if (!empty($sentence['id'])) {
                        // Update existing
                        $vocabulary->exampleSentences()
                            ->where('id', $sentence['id'])
                            ->update(['sentence' => $sentence['sentence'], 'translation' => $sentence['translation'] ?? null]);
                        $existingIds[] = $sentence['id'];
                    } else {
                        // Create new
                        $new = $vocabulary->exampleSentences()->create($sentence);
                        $existingIds[] = $new->id;
                    }
                }
                // Delete removed sentences
                $vocabulary->exampleSentences()->whereNotIn('id', $existingIds)->delete();
            }
            
            DB::commit();
            return response()->json([
                'message' => 'Vocabulary updated',
                'vocabulary' => $vocabulary->fresh()->load('exampleSentences')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Update failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, Vocabulary $vocabulary)
    {
        if ($request->user()->id !== $vocabulary->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $vocabulary->delete();

        return response()->json(['message' => 'Vocabulary deleted']);
    }

    public function aiGenerate(Request $request)
    {
        $request->validate([
            'word' => 'required|string|min:1|max:100'
        ]);

        $word = strtolower(trim($request->word));
        $cacheKey = "ai_vocab_{$word}";

        // 290. Check negative cache first
        $negativeCacheKey = "ai_vocab_not_found_{$word}";
        if (\Illuminate\Support\Facades\Cache::get($negativeCacheKey)) {
             return response()->json([
                'message' => 'Vocabulary not found or invalid.'
            ], 404);
        }

        // 1. Check permanent cache first
        $cached = \Illuminate\Support\Facades\Cache::get($cacheKey);
        if ($cached) {
            // Legacy Cache Compatibility:
            // Check if it's legacy format (has 'english_word' key directly)
            if (isset($cached['english_word'])) {
                // Wrap legacy format into array for compatibility
                $cached = [$cached];
            }

            // Now $cached is always an array
            if (count($cached) === 1) {
                return response()->json(['status' => 'success', 'data' => $cached[0]]);
            } else {
                return response()->json(['status' => 'ambiguous', 'options' => $cached]);
            }
        }

        // 2. Check if any user already has this word (with translation)
        $existing = \App\Models\Vocabulary::with('exampleSentences')
            ->where('english_word', $word)
            ->whereNotNull('translation')
            ->where('translation', '!=', '')
            ->first();

        if ($existing) {
            // Convert relation to array format expected by frontend
            $examples = $existing->exampleSentences->map(function ($ex) {
                return [
                    'sentence' => $ex->sentence,
                    'translation' => $ex->translation ?? '',
                ];
            })->toArray();

            // Check if this is legacy data (missing example translations)
            $isLegacy = false;
            
            if (empty($examples)) {
                $isLegacy = true;
            } else {
                foreach ($examples as $ex) {
                    if (empty($ex['translation'])) {
                        $isLegacy = true;
                        break;
                    }
                }
            }

            // Only use existing data if it's NOT legacy
            if (!$isLegacy) {
                $data = [
                    'english_word' => $existing->english_word,
                    'pronunciation' => $existing->pronunciation,
                    'part_of_speech' => $existing->part_of_speech,
                    'translation' => $existing->translation,
                    'usage_note' => $existing->usage_note,
                    'example_sentences' => $examples,
                ];

                // Cache forever for future requests (as single item array)
                \Illuminate\Support\Facades\Cache::forever($cacheKey, [$data]);

                return response()->json(['status' => 'success', 'data' => $data]);
            }
        }

        // 3. Generate from Gemini AI
        try {
            $geminiService = app(\App\Services\GeminiService::class);
            $meanings = $geminiService->generateVocabulary($word);

            // Cache the FULL array (all meanings) result forever
            \Illuminate\Support\Facades\Cache::forever($cacheKey, $meanings);

            if (count($meanings) === 1) {
                return response()->json(['status' => 'success', 'data' => $meanings[0]]);
            } else {
                return response()->json(['status' => 'ambiguous', 'options' => $meanings]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('AI Generation failed', [
                'word' => $word,
                'error' => $e->getMessage()
            ]);

            // Negative Caching: Save "NOT_FOUND" for 24 hours to prevent repeated API calls
            \Illuminate\Support\Facades\Cache::put($negativeCacheKey, true, 86400); // 1 day

            return response()->json([
                'message' => 'Could not generate vocabulary. Please try again or use manual input.'
            ], 500);
        }
    }
}
