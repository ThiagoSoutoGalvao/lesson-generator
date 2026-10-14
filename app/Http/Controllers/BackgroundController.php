<?php

namespace App\Http\Controllers;

use App\Models\ImageCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class BackgroundController extends Controller
{
    private const RANKED_SEARCH_SINCE = '2026-10-09 00:00:00';

    public function fetch(Request $request)
    {
        $topic = $request->query('topic', 'education');

        // Rows cached before the ranked search (2026-10-09) hold /photos/random's loose matches,
        // and a keyword is cached forever — so those are looked up again instead of reused.
        $cached = ImageCache::where('keyword', $topic)->first();
        if ($cached && $cached->updated_at?->gte(self::RANKED_SEARCH_SINCE)) {
            return response()->json(['url' => $cached->url]);
        }

        $url = $this->fetchFromUnsplash($topic);

        // updated_at set by hand: a re-fetch that lands on the same photo must still count as fresh.
        $row = ImageCache::firstOrNew(['keyword' => $topic]);
        $row->url        = $url;
        $row->updated_at = now();
        $row->save();

        return response()->json(['url' => $url]);
    }

    private function fetchFromUnsplash(string $topic): string
    {
        $key = config('services.unsplash.key');

        if ($key) {
            // /photos/random matched loosely — one word of "employees working together open plan
            // office Tokyo" was enough, and a Picture Prompt got a Tokyo street with cyclists.
            // Ranked search, then the closest description, keeps the photo on the phrase.
            [$url, $score] = $this->searchUnsplash($topic, $key);

            // A long phrase can return nothing, or only photos that miss most of it; retry with
            // its first three words and keep whichever photo's description is closer.
            $short = implode(' ', array_slice(preg_split('/\s+/', trim($topic)), 0, 3));
            if ($short !== trim($topic) && (! $url || $score * 2 < count($this->words($topic)))) {
                [$shortUrl, $shortScore] = $this->searchUnsplash($short, $key, $topic);
                if ($shortUrl && (! $url || $shortScore > $score)) {
                    $url = $shortUrl;
                }
            }

            if ($url) {
                return $url;
            }
        }

        return 'https://picsum.photos/seed/' . rawurlencode($topic) . '/1920/1080';
    }

    /**
     * Of the top 10 results, the one whose description shares the most words with the query.
     * Returns [url|null, words shared with the topic].
     */
    private function searchUnsplash(string $query, string $key, ?string $scoreAgainst = null): array
    {
        $response = Http::get('https://api.unsplash.com/search/photos', [
            'query'          => $query,
            'client_id'      => $key,
            'orientation'    => 'landscape',
            'content_filter' => 'high',
            'per_page'       => 10,
        ]);

        $results = $response->failed() ? [] : (array) $response->json('results', []);
        $words   = $this->words($scoreAgainst ?? $query);

        $best      = null;
        $bestScore = -1;
        foreach ($results as $photo) {
            $described = $this->words(($photo['alt_description'] ?? '') . ' ' . ($photo['description'] ?? ''));
            $score     = count(array_intersect($words, $described));
            if ($score > $bestScore && ! empty($photo['urls']['regular'])) {
                $best      = $photo['urls']['regular'];
                $bestScore = $score; // ties keep Unsplash's own ranking
            }
        }

        return [$best, max($bestScore, 0)];
    }

    /** Lower-case words of 3+ letters, with a plural "s" dropped, so "offices" meets "office". */
    private function words(string $text): array
    {
        preg_match_all('/[a-z]{3,}/', strtolower($text), $m);

        return array_values(array_unique(array_map(fn ($w) => preg_replace('/(?<=[a-z]{3})s$/', '', $w), $m[0])));
    }
}
