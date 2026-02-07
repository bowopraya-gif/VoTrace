<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\VocabularyController;
use App\Http\Controllers\Api\StreakController;
use App\Http\Controllers\Api\PracticeController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/email/resend', [AuthController::class, 'resendVerification']);
Route::post('/check-username', [AuthController::class, 'checkUsername']);
Route::post('/check-email', [AuthController::class, 'checkEmail']);

// Password Reset Routes
Route::post('/forgot-password', [App\Http\Controllers\Api\PasswordResetController::class, 'sendResetLink']);
Route::post('/reset-password', [App\Http\Controllers\Api\PasswordResetController::class, 'reset']);

// Google OAuth Routes (public)
Route::get('/auth/google/redirect', [App\Http\Controllers\Api\GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [App\Http\Controllers\Api\GoogleAuthController::class, 'callback']);

Route::middleware(['auth:sanctum', 'no-cache'])->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    
    // Vocabulary Routes
    Route::post('/vocabularies/ai-generate', [VocabularyController::class, 'aiGenerate']);
    Route::post('/vocabularies/quick-add', [VocabularyController::class, 'quickAdd']);
    Route::apiResource('vocabularies', VocabularyController::class);
    // Streak Routes
    Route::get('/streak', [StreakController::class, 'status']);
    Route::get('/streak/calendar', [StreakController::class, 'calendar']);
    Route::get('/streak/stats', [StreakController::class, 'stats']);
    Route::get('/streak/history', [StreakController::class, 'history']);

    // Practice Routes
    Route::get('/practice/stats', [PracticeController::class, 'stats']);
    Route::get('/practice/history', [PracticeController::class, 'history']);
    Route::get('/practice/options', [PracticeController::class, 'options']);
    Route::post('/practice/count', [PracticeController::class, 'count']);
    Route::post('/practice/start', [PracticeController::class, 'start']);
    Route::post('/practice/answer', [PracticeController::class, 'answer']);
    Route::post('/practice/answer-batch', [PracticeController::class, 'answerBatch']);
    Route::post('/practice/complete', [PracticeController::class, 'complete']);
    Route::get('/practice/session/{id}', [PracticeController::class, 'show']);
    
    // Translation
    Route::post('/translate', [App\Http\Controllers\Api\TranslationController::class, 'translate']);

    // Learning Feature
    Route::prefix('learning')->group(function () {
        Route::get('/stats', [App\Http\Controllers\LearningController::class, 'stats']);
        Route::get('/history', [App\Http\Controllers\LearningController::class, 'history']);
        
        Route::get('/modules', [App\Http\Controllers\LearningController::class, 'index']);
        Route::get('/modules/{slug}', [App\Http\Controllers\LearningController::class, 'showModule']);
        
        Route::get('/lessons/{slug}', [App\Http\Controllers\LearningController::class, 'showLesson']);
        Route::post('/lessons/{id}/start', [App\Http\Controllers\LearningController::class, 'startLesson']);
        Route::post('/lessons/{id}/progress', [App\Http\Controllers\LearningController::class, 'updateProgress']);
        Route::post('/lessons/{id}/complete', [App\Http\Controllers\LearningController::class, 'completeLesson']);
    });

    // Profile Routes
    Route::prefix('profile')->group(function () {
        Route::get('/', [App\Http\Controllers\ProfileController::class, 'show']);
        Route::put('/', [App\Http\Controllers\ProfileController::class, 'update']);
        Route::post('/avatar', [App\Http\Controllers\ProfileController::class, 'uploadAvatar']);
        Route::put('/password', [App\Http\Controllers\ProfileController::class, 'changePassword']);
        Route::get('/check-username', [App\Http\Controllers\ProfileController::class, 'checkUsername']);
        Route::post('/request-email-change', [App\Http\Controllers\ProfileController::class, 'requestEmailChange']);
        
        // OAuth users: Set password for hybrid login
        Route::post('/set-password', [App\Http\Controllers\Api\SetPasswordController::class, 'setPassword']);
        Route::get('/password-status', [App\Http\Controllers\Api\SetPasswordController::class, 'checkPasswordStatus']);
    });

    // Statistics Routes
    Route::prefix('statistics')->group(function () {
        Route::get('/overview', [App\Http\Controllers\Api\StatisticsController::class, 'overview']);
        Route::get('/vocabulary', [App\Http\Controllers\Api\StatisticsController::class, 'vocabulary']);
        Route::get('/vocabulary/drill-down', [App\Http\Controllers\Api\StatisticsController::class, 'vocabularyDrillDown']);
        Route::get('/practice', [App\Http\Controllers\Api\StatisticsController::class, 'practice']);
        Route::get('/learning', [App\Http\Controllers\Api\StatisticsController::class, 'learning']);
    });
});
