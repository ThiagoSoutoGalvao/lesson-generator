<?php

namespace App\Services;

use App\Models\AudioClip;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Spoken lines for listening activities (2026-11-26), with OpenAI's text-to-speech. Each line is saved once in
 * audio_clips; asking for the same text, voice and style again returns the saved clip and costs nothing.
 */
class Speech
{
    private const MODEL = 'gpt-4o-mini-tts';

    // Speaking style per course level: slower and clearer for beginners.
    private const STYLE = [
        'A1' => 'Speak clearly and slowly for beginner (A1) English learners. Friendly office tone.',
        'A2' => 'Speak clearly and naturally, at a slightly slow pace for elementary (A2) English learners. Friendly office tone.',
        'B1' => 'Speak naturally and clearly at a relaxed, normal pace for intermediate (B1) English learners. Friendly office tone.',
        'B2' => 'Speak naturally at a normal conversational pace, as colleagues at work do. Friendly, professional tone.',
    ];

    public static function style(string $level, ?string $extra = null): string
    {
        return trim((self::STYLE[$level] ?? self::STYLE['B1']) . ' ' . ($extra ?? ''));
    }

    /** The clip id for one line, made now or reused. */
    public function say(string $text, string $voice, string $style): int
    {
        $key = hash('sha256', self::MODEL . "|{$voice}|{$style}|{$text}");
        if ($id = AudioClip::where('key', $key)->value('id')) {
            return $id;
        }
        $res = Http::withToken((string) config('services.openai.key'))->timeout(90)->retry(2, 2000, throw: false)
            ->post('https://api.openai.com/v1/audio/speech', [
                'model' => self::MODEL, 'voice' => $voice, 'input' => $text, 'instructions' => $style, 'response_format' => 'mp3',
            ]);
        if ($res->failed()) {
            $msg = (string) $res->json('error.message');
            throw new RuntimeException(str_contains($msg, 'quota') || str_contains($msg, 'billing')
                ? 'The OpenAI credit has run out, so no audio can be made until it is topped up.'
                : 'The audio could not be made (' . $res->status() . ').');
        }
        $mp3 = $res->body();
        if (strlen($mp3) <= 5760) { // a silent clip is almost always exactly 5,760 bytes (Claude.md §8)
            throw new RuntimeException('The audio came back silent — try again.');
        }
        return AudioClip::create(['key' => $key, 'voice' => $voice, 'bytes' => strlen($mp3), 'data' => base64_encode($mp3)])->id;
    }
}
