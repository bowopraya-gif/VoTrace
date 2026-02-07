<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PracticeService;
use Illuminate\Http\Request;

class PracticeController extends Controller
{
    public function stats(Request $request, PracticeService $service)
    {
        $timezone = $request->input('tz', 'UTC');
        return response()->json($service->getPracticeStats($request->user(), $timezone));
    }

    public function history(Request $request, PracticeService $service)
    {
        return response()->json($service->getHistory($request->user()));
    }

    public function start(Request $request, PracticeService $service)
    {
        $validated = $request->validate([
            'mode' => 'required|string',
            'direction' => 'nullable|string',
            'question_count' => 'nullable|integer',
            'filters' => 'nullable|array',
            'smart_selection' => 'nullable|boolean', // Added smart_selection
        ]);

        return response()->json($service->startSession($request->user(), $validated));
    }

    public function options(Request $request, PracticeService $service)
    {
        return response()->json($service->getFilterOptions($request->user()));
    }

    public function count(Request $request, PracticeService $service)
    {
        $validated = $request->validate([
            'filters' => 'nullable|array',
        ]);
        
        return response()->json([
            'count' => $service->getAvailableCount($request->user(), $validated['filters'] ?? [])
        ]);
    }

    public function answer(Request $request, PracticeService $service)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:practice_sessions,uuid',
            'vocabulary_id' => 'required|exists:vocabularies,uuid',
            'question_type' => 'required|string',
            'user_answer' => 'nullable|string',
            'correct_answer' => 'required|string',
            'is_correct' => 'required|boolean',
            'time_spent_ms' => 'required|integer',
            'hint_count' => 'nullable|integer|min:0'
        ]);

        return response()->json($service->submitAnswer($request->user(), $validated));
    }

    public function answerBatch(Request $request, PracticeService $service)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:practice_sessions,uuid',
            'results' => 'required|array|min:1',
            'results.*.vocabulary_id' => 'required|exists:vocabularies,uuid',
            'results.*.is_correct' => 'required|boolean',
            'results.*.time_spent_ms' => 'required|integer',
        ]);

        return response()->json($service->submitMatchingBatch($request->user(), $validated));
    }

    public function complete(Request $request, PracticeService $service)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:practice_sessions,uuid',
            'duration_seconds' => 'required|integer',
        ]);

        return response()->json($service->completeSession($request->user(), $validated));
    }

    public function show(Request $request, string $id, PracticeService $service)
    {
        return response()->json($service->getSessionDetails($request->user(), $id));
    }
}
