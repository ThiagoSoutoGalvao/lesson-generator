<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class ClaudeService
{
    public function generate(string $documentText, string $prompt): string
    {
        $response = Http::withHeaders([
            'x-api-key'         => config('services.anthropic.key'),
            'anthropic-version' => '2023-06-01',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 2048,
            'messages'   => [
                [
                    'role'    => 'user',
                    'content' => "Here is the course book text:\n\n{$documentText}\n\n{$prompt}",
                ],
            ],
        ]);

        if ($response->failed()) {
            throw new RuntimeException('Claude API error: ' . $response->body());
        }

        return $response->json('content.0.text');
    }
}
