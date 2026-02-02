<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TranslationController extends Controller
{
    /**
     * Proxy translation request to MyMemory API.
     */
    public function translate(Request $request)
    {
        $request->validate([
            'text' => 'required|string|max:500',
            'source_lang' => 'required|string|size:2',
            'target_lang' => 'required|string|size:2',
        ]);

        $text = $request->input('text');
        $source = $request->input('source_lang');
        $target = $request->input('target_lang');
        $langPair = "$source|$target";

        // MyMemory API Endpoint
        // Added 'de' parameter with a generic email to increase limit to 50k chars/day if needed
        // For production, use a configured email from .env
        $email = 'votrack_user@example.com'; 
        
        $response = Http::get('https://api.mymemory.translated.net/get', [
            'q' => $text,
            'langpair' => $langPair,
            'de' => $email
        ]);

        if ($response->successful()) {
            $data = $response->json();
            
            if ($data['responseStatus'] === 200) {
                return response()->json([
                    'translatedText' => $data['responseData']['translatedText'],
                    'match' => $data['responseData']['match']
                ]);
            } else {
                // API returned error (e.g. limit exceeded, invalid pair)
                return response()->json([
                    'error' => $data['responseDetails'] ?? 'Translation failed'
                ], 422);
            }
        }

        return response()->json(['error' => 'Translation service unavailable'], 503);
    }
}
