<?php

namespace App\Http\Controllers;

use App\Services\LearningService;
use App\Http\Resources\ModuleResource;
use Illuminate\Http\Request;

class LearningController extends Controller
{
    protected $service;

    public function __construct(LearningService $service)
    {
        $this->service = $service;
    }

    /**
     * List all modules
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'sort', 'per_page']);
        return ModuleResource::collection($this->service->getModules($request->user(), $filters));
    }

    /**
     * Get module details
     */
    public function showModule(Request $request, $slug)
    {
        return response()->json($this->service->getModuleBySlug($request->user(), $slug));
    }

    /**
     * Get lesson content
     */
    public function showLesson(Request $request, $slug)
    {
        return response()->json($this->service->getLessonBySlug($request->user(), $slug));
    }

    /**
     * Start/Resume Lesson
     */
    public function startLesson(Request $request, $id)
    {
        return response()->json($this->service->startLesson($request->user(), $id));
    }

    /**
     * Update Progress (Counter increment)
     */
    public function updateProgress(Request $request, $id)
    {
        $data = $request->validate([
            'increment_completed' => 'boolean',
            'increment_correct' => 'boolean',
            'block_id' => 'integer',
            'last_block_index' => 'integer',
            'add_time' => 'integer|min:0'
        ]);

        return response()->json($this->service->updateProgress($request->user(), $id, $data));
    }

    /**
     * Complete Lesson
     */
    public function completeLesson(Request $request, $id)
    {
        return response()->json($this->service->completeLesson($request->user(), $id));
    }
    
    /**
     * Get User Stats
     */
    public function stats(Request $request)
    {
         return response()->json($this->service->getDashboardStats($request->user()));
    }
    
    /**
     * Get History
     */
    public function history(Request $request)
    {
         $history = \App\Models\LessonProgress::where('user_id', $request->user()->id)
             ->with('lesson.module')
             ->latest('updated_at')
             ->limit(10)
             ->get();
             
         return response()->json($history);
    }
}
