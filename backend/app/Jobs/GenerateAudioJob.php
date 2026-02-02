<?php

namespace App\Jobs;

use App\Models\Vocabulary;
use App\Services\TTSService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateAudioJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60; // Wait 60 seconds between retries

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Vocabulary $vocabulary
    ) {}

    /**
     * Execute the job.
     */
    public function handle(TTSService $ttsService): void
    {
        Log::info("GenerateAudioJob: Processing vocab #{$this->vocabulary->id} - {$this->vocabulary->english_word}");

        $result = $ttsService->generateAudio($this->vocabulary);

        if ($result) {
            Log::info("GenerateAudioJob: Successfully generated audio for vocab #{$this->vocabulary->id}");
        } else {
            Log::warning("GenerateAudioJob: Failed to generate audio for vocab #{$this->vocabulary->id}");
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("GenerateAudioJob: Failed permanently for vocab #{$this->vocabulary->id}: " . $exception->getMessage());
        
        $this->vocabulary->update(['audio_status' => 'failed']);
    }
}
