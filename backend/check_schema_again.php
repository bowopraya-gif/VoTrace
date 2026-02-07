<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$columns = DB::select("SHOW COLUMNS FROM practice_sessions LIKE 'mode'");
if (!empty($columns)) {
    echo "Current Type: " . $columns[0]->Type . "\n";
} else {
    echo "Column not found\n";
}
