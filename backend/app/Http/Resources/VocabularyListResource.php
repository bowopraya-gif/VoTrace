<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class VocabularyListResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid, // Public ID
            'english_word' => $this->english_word,
            'pronunciation' => $this->pronunciation,
            'translation' => $this->translation,
            'part_of_speech' => $this->part_of_speech,
            'learning_status' => $this->learning_status,
            'created_at' => $this->created_at,
            // Partial data for instant view
            'usage_note' => $this->usage_note, 
            'example_sentences' => $this->exampleSentences->take(1)->map(function($ex) {
                return [
                    'id' => $ex->id,
                    'sentence' => $ex->sentence,
                    'translation' => $ex->translation,
                ];
            }),
        ];
    }
}
