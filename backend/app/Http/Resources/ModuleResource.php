<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ModuleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'thumbnail_url' => $this->thumbnail_url,
            'difficulty' => $this->difficulty,
            'category' => $this->category,
            'lessons_count' => $this->lessons_count ?? 0,
            'progress_percent' => $this->progress_percent ?? 0,
            'completed_lessons_count' => $this->completed_lessons_count ?? 0,
        ];
    }
}
