<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StatisticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class StatisticsController extends Controller
{
    private StatisticsService $service;

    public function __construct(StatisticsService $service)
    {
        $this->service = $service;
    }

    /**
     * Get overview statistics with storytelling insights
     * 
     * GET /api/statistics/overview
     */
    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();
        $timezone = $request->input('tz', 'UTC');
        
        $key = "stats:overview:{$user->id}:{$timezone}";

        $stats = Cache::remember($key, 300, function () use ($user, $timezone) {
            return $this->service->getOverviewStats($user, $timezone);
        });
        
        return response()->json($stats);
    }

    /**
     * Get vocabulary statistics
     * 
     * GET /api/statistics/vocabulary?period=30d&tz=Asia/Jakarta
     */
    public function vocabulary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'nullable|in:7d,30d,year,all',
            'tz' => 'nullable|string|max:64',
        ]);

        $user = $request->user();
        $period = $validated['period'] ?? '30d';
        $timezone = $validated['tz'] ?? 'UTC';

        $key = "stats:vocab:{$user->id}:{$period}:{$timezone}";

        $stats = Cache::remember($key, 300, function () use ($user, $period, $timezone) {
            return $this->service->getVocabularyStats($user, $period, $timezone);
        });

        return response()->json($stats);
    }

    /**
     * Get practice statistics
     * 
     * GET /api/statistics/practice?period=30d&tz=Asia/Jakarta
     */
    public function practice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'nullable|in:7d,30d,year,all',
            'tz' => 'nullable|string|max:64',
        ]);

        $user = $request->user();
        $period = $validated['period'] ?? '30d';
        $timezone = $validated['tz'] ?? 'UTC';

        $key = "stats:practice:{$user->id}:{$period}:{$timezone}";

        $stats = Cache::remember($key, 300, function () use ($user, $period, $timezone) {
            return $this->service->getPracticeStats($user, $period, $timezone);
        });

        return response()->json($stats);
    }

    /**
     * Get learning statistics
     * 
     * GET /api/statistics/learning?period=30d&tz=Asia/Jakarta
     */
    public function learning(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'period' => 'nullable|in:7d,30d,year,all',
            'tz' => 'nullable|string|max:64',
        ]);

        $user = $request->user();
        $period = $validated['period'] ?? '30d';
        $timezone = $validated['tz'] ?? 'UTC';

        $key = "stats:learning:{$user->id}:{$period}:{$timezone}";

        $stats = Cache::remember($key, 300, function () use ($user, $period, $timezone) {
            return $this->service->getLearningStats($user, $period, $timezone);
        });

        return response()->json($stats);
    }

    /**
     * Get vocabulary drill-down for chart interactions
     * 
     * GET /api/statistics/vocabulary/drill-down?type=pos&value=noun&page=1
     */
    public function vocabularyDrillDown(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:pos,status,srs_level,difficulty,review_status',
            'value' => 'required|string|max:64',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:50',
            'tz' => 'nullable|string|max:64',
        ]);

        $type = $validated['type'];
        $value = $validated['value'];
        $page = $validated['page'] ?? 1;
        $perPage = $validated['per_page'] ?? 20;
        $timezone = $validated['tz'] ?? 'UTC';

        return response()->json(
            $this->service->getVocabularyDrillDown($request->user(), $type, $value, $page, $perPage, $timezone)
        );
    }
}
