<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StreakActivity;
use App\Models\UserStreak;
use App\Services\StreakService;
use Illuminate\Http\Request;

class StreakController extends Controller
{
    public function status(Request $request, StreakService $streakService)
    {
        return response()->json($streakService->getStreakStatus($request->user(), $request->input('tz', 'UTC')));
    }

    public function calendar(Request $request)
    {
        // Allow filtering by year/month if needed, or return all for now to let frontend handle navigation
        // User wants "Calendar UI" which often needs fetching by month.
        // For simplicity, let's return ALL dates (lightweight) or a specific year.
        
        $year = $request->input('year', now()->year);
        
        $activities = StreakActivity::where('user_id', $request->user()->id)
            ->whereYear('activity_date', $year)
            ->get(['activity_date', 'vocabulary_count']);

        return response()->json($activities);
    }

    public function stats(Request $request, StreakService $streakService)
    {
        return response()->json($streakService->getDetailedStats($request->user(), $request->input('tz', 'UTC')));
    }
    
    public function history(Request $request, StreakService $streakService)
    {
        return response()->json($streakService->getStreakHistory($request->user()));
    }
}
