<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private string $apiKey;
    private string $model;
    private string $endpoint;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->model = config('services.gemini.model');
        $this->endpoint = config('services.gemini.endpoint');

        if (empty($this->apiKey)) {
            throw new \Exception('Gemini API Key is not configured.');
        }
    }

    /**
     * Generate vocabulary data with automatic retry on failure
     */
    public function generateVocabulary(string $word): array
    {
        $prompt = $this->buildVocabularyPrompt($word);
        $schema = $this->getVocabularySchema();

        // Retry 3 times with 2 second delay between attempts
        $response = Http::retry(3, 2000)
            ->timeout(30)
            ->post(
                "{$this->endpoint}{$this->model}:generateContent?key={$this->apiKey}",
                [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'responseSchema' => $schema,
                        'temperature' => 0.2, // Low for factual accuracy
                        'maxOutputTokens' => 2048,
                    ],
                ]
            );

        if ($response->failed()) {
            Log::error('Gemini API Error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            throw new \Exception('Failed to generate vocabulary from AI.');
        }

        $data = $response->json();
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (!$text) {
            throw new \Exception('Empty response from AI.');
        }

        // Clean up markdown code blocks if present
        $text = preg_replace('/^```json\s*|\s*```$/', '', $text);

        $decoded = json_decode($text, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Gemini JSON Parse Error', ['error' => json_last_error_msg(), 'text' => $text]);
            throw new \Exception('Invalid JSON response from AI.');
        }

        return $decoded;
    }

    private function buildVocabularyPrompt(string $word): string
    {
        return <<<PROMPT
You are a professional English-Indonesian bilingual dictionary expert.

Analyze the English word: "{$word}"

TASK:
1. Determine if this word has multiple common meanings (polysemy).
2. If the word has ONLY ONE common meaning, return an array with 1 item.
3. If the word has 2-3 DISTINCTLY DIFFERENT meanings (different part-of-speech or semantic domain), return an array with 2-3 items.
4. Each item must be a COMPLETE vocabulary entry with all required fields.

RULES FOR POLYSEMY:
- Only include meanings that are commonly used (not obscure).
- Maximum 3 meanings per word.
- Each meaning should have a different translation OR different part_of_speech.
- Examples: "Watch" (verb=menonton, noun=jam tangan), "Date" (noun=tanggal, noun=kencan)

For EACH meaning, provide:
- english_word: The exact word
- part_of_speech: From list (noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, modal, verb phrase, phrasal verb, idiom, expression, slang, phrase, other)
- pronunciation: IPA format
- translation: Indonesian translation for THIS specific meaning
- usage_note: Context explanation in Indonesian
- example_sentences: 3 examples with Indonesian translations
   - Use the word naturally in context
   - Vary the complexity (simple, intermediate, advanced)

Be accurate, educational, and helpful. If the word has multiple meanings, focus on the most common usage.
PROMPT;
    }

    private function getVocabularySchema(): array
    {
        return [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'english_word' => [
                        'type' => 'string',
                        'description' => 'The English word (corrected if typo)'
                    ],
                    'pronunciation' => [
                        'type' => 'string',
                        'description' => 'IPA pronunciation'
                    ],
                    'part_of_speech' => [
                        'type' => 'string',
                        'enum' => [
                            'noun', 'verb', 'adjective', 'adverb', 'pronoun',
                            'preposition', 'conjunction', 'interjection', 'determiner',
                            'modal', 'verb phrase', 'phrasal verb', 'idiom',
                            'expression', 'slang', 'phrase', 'other'
                        ]
                    ],
                    'translation' => [
                        'type' => 'string',
                        'description' => 'Indonesian translation'
                    ],
                    'usage_note' => [
                        'type' => 'string',
                        'description' => 'Usage context and nuances'
                    ],
                    'example_sentences' => [
                        'type' => 'array',
                        'items' => [
                            'type' => 'object',
                            'properties' => [
                                'sentence' => ['type' => 'string'],
                                'translation' => ['type' => 'string']
                            ],
                            'required' => ['sentence', 'translation']
                        ],
                        'minItems' => 3,
                        'maxItems' => 3
                    ]
                ],
                'required' => [
                    'english_word', 'pronunciation', 'part_of_speech',
                    'translation', 'usage_note', 'example_sentences'
                ]
            ],
            'minItems' => 1,
            'maxItems' => 3
        ];
    }
}
