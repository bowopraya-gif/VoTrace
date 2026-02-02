<?php

namespace App\Services;

use App\Models\Module;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LearningService
{
    /**
     * Get all modules with user progress
     */
    public function getModules(User $user, array $filters = [])
    {
        // 1. Search / Query
        $searchTerm = $filters['search'] ?? '';
        
        if (!empty($searchTerm)) {
            try {
                // Try Meilisearch via Scout (Meilisearch handles relevance natively)
                $query = Module::search($searchTerm);
                $modules = $query->take(100)->get();
            } catch (\Exception $e) {
                // Fallback to Database Search with Relevance Ranking
                // Priority: Title match > Description match
                $modules = Module::query()
                    ->where(function($q) use ($searchTerm) {
                        $q->where('title', 'like', '%' . $searchTerm . '%')
                          ->orWhere('description', 'like', '%' . $searchTerm . '%');
                    })
                    ->withCount('lessons')
                    ->get()
                    ->sortBy(function($module) use ($searchTerm) {
                        // Lower score = higher priority
                        $titleMatch = stripos($module->title, $searchTerm) !== false;
                        $descMatch = stripos($module->description, $searchTerm) !== false;
                        
                        if ($titleMatch && $descMatch) return 0; // Both match - highest
                        if ($titleMatch) return 1; // Title only - second
                        if ($descMatch) return 2; // Description only - third
                        return 3;
                    })
                    ->values(); // Re-index after sorting
            }
        } else {
            // OPTIMIZED: Database Level Sorting for basic sorts
            $query = Module::query()->withCount('lessons');
            
            $sort = $filters['sort'] ?? 'order_index';
            $dbSortable = ['newest', 'oldest', 'az', 'za'];
            
            if (in_array($sort, $dbSortable)) {
                $query->when($sort === 'newest', fn($q) => $q->orderByDesc('created_at'))
                      ->when($sort === 'oldest', fn($q) => $q->orderBy('created_at'))
                      ->when($sort === 'az', fn($q) => $q->orderBy('title'))
                      ->when($sort === 'za', fn($q) => $q->orderByDesc('title'));
            } else {
                // Default sort
                $query->orderBy('order_index');
            }
            
            $modules = $query->get();
        }

        // 2. Hydrate Progress - OPTIMIZED: Single query for all modules
        // Get all module IDs first
        $moduleIds = $modules->pluck('id')->toArray();
        
        // Single aggregated query to get completed lessons count per module
        $completedCounts = LessonProgress::query()
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->where('lesson_progress.user_id', $user->id)
            ->where('lesson_progress.status', 'completed')
            ->whereIn('lessons.module_id', $moduleIds)
            ->selectRaw('lessons.module_id, COUNT(*) as cnt')
            ->groupBy('lessons.module_id')
            ->pluck('cnt', 'module_id');

        $modules->transform(function ($module) use ($completedCounts) {
            // Ensure lessons count is loaded if coming from Scout
            if (!$module->lessons_count) {
                $module->loadCount('lessons');
            }

            $completedLessons = $completedCounts[$module->id] ?? 0;
            
            $module->progress_percent = $module->lessons_count > 0 
                ? round(($completedLessons / $module->lessons_count) * 100) 
                : 0;

            $module->completed_lessons_count = $completedLessons;
            
            return $module;
        });
        
        // 3. Sorting (PHP Collection) - Only for computed fields that can't be sorted in DB easily
        // Options: newest, oldest, difficulty_asc/desc, progress_asc/desc, total_lessons_asc/desc, az, za
        $sort = $filters['sort'] ?? 'order_index';
        $dbSortable = ['newest', 'oldest', 'az', 'za', 'order_index'];

        if (!in_array($sort, $dbSortable)) {
            $difficultyWeight = ['Beginner' => 1, 'Intermediate' => 2, 'Advanced' => 3]; 

            $modules = $modules->sort(function ($a, $b) use ($sort, $difficultyWeight) {
                switch ($sort) {
                    case 'difficulty_asc': 
                        return ($difficultyWeight[$a->difficulty] ?? 0) <=> ($difficultyWeight[$b->difficulty] ?? 0);
                    case 'difficulty_desc':
                        return ($difficultyWeight[$b->difficulty] ?? 0) <=> ($difficultyWeight[$a->difficulty] ?? 0);
                        
                    case 'progress_asc': return $a->progress_percent <=> $b->progress_percent;
                    case 'progress_desc': return $b->progress_percent <=> $a->progress_percent;
                    
                    case 'total_lessons_asc': return $a->lessons_count <=> $b->lessons_count;
                    case 'total_lessons_desc': return $b->lessons_count <=> $a->lessons_count;
                    
                    default: return 0;
                }
            });
        }

        // 4. Manual Pagination (since we sorted a Collection)
        $perPage = $filters['per_page'] ?? 10;
        $page = request()->get('page', 1); // Helper
        
        return new \Illuminate\Pagination\LengthAwarePaginator(
            $modules->forPage($page, $perPage)->values(), // Slice
            $modules->count(), // Total
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()]
        );
    }

    /**
     * Get specific module details with lessons and progress
     */
    public function getModuleBySlug(User $user, string $slug)
    {
        $module = Module::where('slug', $slug)
            ->with(['lessons' => function ($q) use ($user) {
                $q->orderBy('order_index')
                  ->with(['progress' => function ($qp) use ($user) {
                      $qp->where('user_id', $user->id);
                  }]);
            }])
            ->firstOrFail();

        // Flatten progress for each lesson
        $module->lessons->transform(function ($lesson) {
            $lesson->user_progress = $lesson->progress->first();
            unset($lesson->progress);
            return $lesson;
        });

        // Check if any lesson is completed to unlock certification? (Future)
        return $module;
    }

    /**
     * Get lesson content with blocks and current user progress
     */
    public function getLessonBySlug(User $user, string $slug)
    {
        $lesson = Lesson::where('slug', $slug)
            ->with(['module', 'contentBlocks' => function($q) {
                $q->orderBy('order_index');
            }, 'progress' => function($q) use ($user) {
                $q->where('user_id', $user->id);
            }])
            ->firstOrFail();

        // Flatten progress
        $lesson->user_progress = $lesson->progress->first();
        unset($lesson->progress);

        return $lesson;
    }

    /**
     * Start or resume a lesson
     */
    public function startLesson(User $user, int $lessonId)
    {
        // Check if exists first to avoid overwriting logic if we had complex start logic
        $progress = LessonProgress::firstOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lessonId],
            [
                'status' => 'in_progress',
                'completed_blocks' => 0,
                'completed_block_ids' => [],
                'started_at' => now(),
                'total_quiz_blocks' => Lesson::find($lessonId)->total_blocks
            ]
        );

        return $progress;
    }

    /**
     * Update progress (increment counters)
     */
    public function updateProgress(User $user, int $lessonId, array $data)
    {
        $progress = LessonProgress::where('user_id', $user->id)
            ->where('lesson_id', $lessonId)
            ->firstOrFail();

        // Atomic increments for scalability
        // We only increment count if this specific block wasn't already completed
        $alreadyCompleted = false;
        if (!empty($data['block_id'])) {
            $completedIds = $progress->completed_block_ids ?? [];
            if (!in_array($data['block_id'], $completedIds)) {
                $completedIds[] = $data['block_id'];
                $progress->completed_block_ids = $completedIds;
                
                // Only increment count if it's a new block completion
                if (!empty($data['increment_completed'])) {
                    $progress->increment('completed_blocks');
                }
            } else {
                $alreadyCompleted = true;
            }
        } else {
             // Fallback for legacy calls without block_id (though we should avoid this)
             if (!empty($data['increment_completed'])) {
                $progress->increment('completed_blocks');
            }
        }

        if (!empty($data['increment_correct']) && !$alreadyCompleted) {
            $progress->increment('correct_answers');
        }

        // Update generic fields
        $updates = [];
        if (isset($data['last_block_index'])) {
            $updates['last_block_index'] = $data['last_block_index'];
        }

        if (isset($data['add_time'])) {
            $progress->increment('time_spent', $data['add_time']);
        }

        if (!empty($updates)) {
            $progress->update($updates); // Save regular updates
        }
        
        $progress->save(); // Ensure array cast is saved

        return $progress->fresh();
    }

    /**
     * Mark lesson as complete
     */
    public function completeLesson(User $user, int $lessonId)
    {
        $progress = LessonProgress::where('user_id', $user->id)
            ->where('lesson_id', $lessonId)
            ->firstOrFail();

        // Calculate final score
        $lesson = Lesson::find($lessonId);
        // Assuming total_quiz_blocks is stored (or count quiz blocks)
        // For now, let's just use correct_answers / total_quiz_blocks logic if available
        // Or simple completion logic.
        
        // Let's assume passed if all required blocks done?
        
        $progress->update([
            'status' => 'completed',
            'completed_at' => now(),
            // Score calculation logic to be refined based on quiz blocks count
        ]);

        return $progress;
    }
    /**
     * Get Dashboard Stats
     */
    public function getDashboardStats(User $user)
    {
        // 1. Learned Today: Lessons completed today
        $learnedToday = LessonProgress::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereDate('completed_at', today())
            ->count();

        $learnedYesterday = LessonProgress::where('user_id', $user->id)
            ->where('status', 'completed')
            ->whereDate('completed_at', today()->subDay())
            ->count();
        
        // 2. Modules Started: Modules with at least 1 lesson in progress or completed
        // Efficient query: Join lessons -> check if module_id distinct count
        $modulesStarted = LessonProgress::where('user_id', $user->id)
            ->whereIn('status', ['in_progress', 'completed'])
            ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
            ->select('lessons.module_id')
            ->distinct()
            ->get()
            ->count();
            
        // 3. Lessons Completed: Total completed lessons
        $lessonsCompleted = LessonProgress::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();
            
        // 4. Learning Time: Total time_spent across all lessons
        $totalTimeSeconds = LessonProgress::where('user_id', $user->id)
            ->sum('time_spent');
            
        return [
            'learned_today' => $learnedToday,
            'learned_yesterday' => $learnedYesterday,
            'modules_started' => $modulesStarted,
            'lessons_completed' => $lessonsCompleted,
            'learning_time_seconds' => (int) $totalTimeSeconds
        ];
    }
}
