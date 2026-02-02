<?php

namespace App\Console\Commands;

use App\Models\Vocabulary;
use App\Services\TTSService;
use Illuminate\Console\Command;

class GenerateMissingAudio extends Command
{
    protected $signature = 'tts:generate-missing 
                            {--limit=100 : Maximum vocabularies to process}
                            {--user= : Only process vocabularies for specific user ID}';

    protected $description = 'Generate TTS audio for vocabularies that are missing audio';

    public function handle(TTSService $tts): int
    {
        if (!$tts->isEnabled()) {
            $this->error('TTS is not configured. Please check GOOGLE_TTS_CREDENTIALS in .env');
            return Command::FAILURE;
        }

        $query = Vocabulary::whereNull('audio_url')
            ->orWhere('audio_status', '!=', 'ready');

        if ($userId = $this->option('user')) {
            $query->where('user_id', $userId);
        }

        $vocabularies = $query->limit($this->option('limit'))->get();

        if ($vocabularies->isEmpty()) {
            $this->info('✨ All vocabularies already have audio!');
            return Command::SUCCESS;
        }

        $this->info("Found {$vocabularies->count()} vocabularies without audio.");
        $bar = $this->output->createProgressBar($vocabularies->count());
        $bar->start();

        $success = 0;
        $failed = 0;

        foreach ($vocabularies as $vocab) {
            try {
                $result = $tts->generateAudio($vocab);
                if ($result) {
                    $success++;
                } else {
                    $failed++;
                }
            } catch (\Exception $e) {
                $failed++;
                $this->newLine();
                $this->error("Failed for '{$vocab->english_word}': {$e->getMessage()}");
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✅ Successfully generated: {$success}");
        if ($failed > 0) {
            $this->warn("⚠️ Failed: {$failed}");
        }

        return Command::SUCCESS;
    }
}
