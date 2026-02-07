<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\PracticeSession;
use App\Models\User;
use App\Services\PracticeService;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $service = $app->make(PracticeService::class);
    
    $user = User::first();
    if (!$user) {
        $user = User::factory()->create();
    }
    
    echo "Testing PracticeService::startSession with mode='matching'...\n";
    
    $config = [
        'mode' => 'matching',
        'direction' => 'en_to_id',
        'question_count' => 5,
        'filters' => [],
        'smart_selection' => false
    ];
    
    // We need some vocab first for matching logic to not return error?
    // Actually if it returns error array ['error'=>...], that's fine, we want to see if it CRASHES on Insert.
    // The insert happens BEFORE the matching question generation logic might return error?
    // Let's check PracticeService logic order.
    // 1. Get vocab -> if empty return error.
    // 2. CREATE SESSION (This causes the crash).
    // 3. Generate questions.
    
    // So we need valid vocab query results to reach step 2.
    // Assuming user has vocab.
    
    $result = $service->startSession($user, $config);
    
    if (isset($result['error'])) {
        echo "Service returned logical error: " . $result['error'] . "\n";
    } else {
        echo "Service SUCCESS! Session ID: " . $result['session_id'] . "\n";
        // Cleanup
        PracticeSession::where('uuid', $result['session_id'])->delete();
    }

} catch (\Exception $e) {
    echo "Service FAILED: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
