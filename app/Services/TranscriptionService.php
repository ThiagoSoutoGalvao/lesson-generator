<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

class TranscriptionService
{
    public function transcribe(string $filePath): string
    {
        $response = Http::withToken(config('services.openai.key'))
            ->timeout(120)
            ->attach('file', file_get_contents($filePath), basename($filePath))
            ->post('https://api.openai.com/v1/audio/transcriptions', [
                'model' => 'whisper-1',
            ]);

        if ($response->failed()) {
            throw new \RuntimeException(
                'Whisper API error: ' . ($response->json('error.message') ?? $response->status())
            );
        }

        return $response->json('text') ?? '';
    }
}
