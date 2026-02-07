<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\PracticeSession;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "Filesystem DB: " . config('database.connections.mysql.database') . "\n";
    echo "Actual Connection Database: " . DB::connection()->getDatabaseName() . "\n";
    
    $columns = DB::select("SHOW COLUMNS FROM practice_sessions LIKE 'mode'");
    if (!empty($columns)) {
        echo "Column Type: " . $columns[0]->Type . "\n";
    }

    echo "Attempting insert...\n";
    $user = User::first();
    if (!$user) {
        $user = User::factory()->create();
    }
    
    $session = PracticeSession::forceCreate([
        'user_id' => $user->id,
        'mode' => 'matching', // TEST THIS SPECIFIC VALUE
        'direction' => 'en_to_id',
        'total_questions' => 10,
        'settings' => [],
        'status' => 'in_progress'
    ]);
    
    echo "Insert SUCCESS! ID: " . $session->id . "\n";
    $session->delete();
    echo "Test row deleted.\n";

} catch (\Exception $e) {
    echo "Insert FAILED: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
