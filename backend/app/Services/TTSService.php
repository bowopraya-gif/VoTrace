<?php

namespace App\Services;

use App\Models\Vocabulary;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Google\Cloud\TextToSpeech\V1\Client\TextToSpeechClient;
use Google\Cloud\TextToSpeech\V1\SynthesisInput;
use Google\Cloud\TextToSpeech\V1\VoiceSelectionParams;
use Google\Cloud\TextToSpeech\V1\AudioConfig;
use Google\Cloud\TextToSpeech\V1\AudioEncoding;
use Google\Cloud\TextToSpeech\V1\SynthesizeSpeechRequest;

class TTSService
{
    private string $secret;
    private bool $enabled;

    public function __construct()
    {
        $this->secret = config('services.google_tts.hash_secret', 'default-dev-secret');
        $this->enabled = !empty(config('services.google_tts.credentials_path'));
    }

    /**
     * Generate audio for a vocabulary word (or return cached URL)
     */
    public function generateAudio(Vocabulary $vocab): ?string
    {
        // Check if audio already exists and is ready
        if ($vocab->audio_status === 'ready' && $vocab->audio_url) {
            $path = $this->getPathFromHash($vocab->audio_hash);
            if (Storage::disk('public')->exists($path)) {
                return $vocab->audio_url;
            }
        }

        // Skip if TTS not configured
        if (!$this->enabled) {
            Log::info("TTS not configured, skipping audio generation for vocab #{$vocab->id}");
            return null;
        }

        try {
            // Mark as generating
            $vocab->update(['audio_status' => 'generating']);

            // Generate secure hash for filename
            $hash = $this->generateSecureHash($vocab);

            // Call Google TTS API
            $audioContent = $this->callGoogleTTS($vocab->english_word);

            // Save to disk
            $this->saveToDisk($hash, $audioContent);

            // Update database
            $vocab->update([
                'audio_url' => $this->getPublicUrl($hash),
                'audio_hash' => $hash,
                'audio_status' => 'ready'
            ]);

            return $vocab->audio_url;

        } catch (\Exception $e) {
            Log::error("TTS generation failed for vocab #{$vocab->id}: " . $e->getMessage());
            $vocab->update(['audio_status' => 'failed']);
            return null;
        }
    }

    /**
     * Generate HMAC-based hash that is:
     * - Deterministic (same input = same output)
     * - Unpredictable (cannot guess without secret)
     * - Collision-resistant
     */
    private function generateSecureHash(Vocabulary $vocab): string
    {
        $payload = sprintf('%d:%s:%d', 
            $vocab->id, 
            strtolower($vocab->english_word),
            $vocab->user_id
        );
        
        return hash_hmac('sha256', $payload, $this->secret);
    }

    /**
     * Save audio content to disk with hashed filename
     */
    private function saveToDisk(string $hash, string $content): string
    {
        $filename = "tts/{$hash}.mp3";
        Storage::disk('public')->put($filename, $content);
        return $filename;
    }

    /**
     * Get file path from hash
     */
    private function getPathFromHash(string $hash): string
    {
        return "tts/{$hash}.mp3";
    }

    /**
     * Get public URL (will use ASSET_URL for CDN in production)
     */
    private function getPublicUrl(string $hash): string
    {
        return asset("storage/tts/{$hash}.mp3");
    }

    /**
     * Call Google Cloud Text-to-Speech API
     */
    private function callGoogleTTS(string $text): string
    {
        $credentialsPath = config('services.google_tts.credentials_path');
        
        $client = new TextToSpeechClient([
            'credentials' => $credentialsPath
        ]);

        try {
            $input = new SynthesisInput();
            $input->setText($text);

            $voice = new VoiceSelectionParams();
            $voice->setLanguageCode('en-US');
            $voice->setName(config('services.google_tts.default_voice', 'en-US-Standard-C'));

            $audioConfig = new AudioConfig();
            $audioConfig->setAudioEncoding(AudioEncoding::MP3);

            // V2 Signature: Use Request Object
            $request = new SynthesizeSpeechRequest();
            $request->setInput($input);
            $request->setVoice($voice);
            $request->setAudioConfig($audioConfig);

            $response = $client->synthesizeSpeech($request);

            return $response->getAudioContent();
        } finally {
            $client->close();
        }
    }

    /**
     * Check if TTS is configured and enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled;
    }
}
