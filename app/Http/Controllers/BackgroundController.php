<?php

namespace App\Http\Controllers;

use App\Models\ImageCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class BackgroundController extends Controller
{
    public function fetch(Request $request)
    {
        $topic = $request->query('topic', 'education');

        $cached = ImageCache::where('keyword', $topic)->first();
        if ($cached) {
            return response()->json(['url' => $cached->url]);
        }

        $url = $this->fetchFromUnsplash($topic);

        ImageCache::firstOrCreate(
            ['keyword' => $topic],
            ['url'     => $url]
        );

        return response()->json(['url' => $url]);
    }

    private function fetchFromUnsplash(string $topic): string
    {
        $key = config('services.unsplash.key');

        if ($key) {
            $response = Http::get('https://api.unsplash.com/photos/random', [
                'query'       => $topic,
                'client_id'   => $key,
                'orientation' => 'landscape',
            ]);

            $url = $response->json('urls.regular');
            if (! $response->failed() && $url) {
                return $url;
            }
        }

        return 'https://picsum.photos/seed/' . rawurlencode($topic) . '/1920/1080';
    }
}
