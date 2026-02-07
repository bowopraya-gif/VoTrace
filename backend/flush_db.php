<?php

use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    DB::statement("FLUSH TABLES");
    echo "Tables flushed successfully.\n";
} catch (\Exception $e) {
    echo "Flush failed: " . $e->getMessage() . "\n";
}
