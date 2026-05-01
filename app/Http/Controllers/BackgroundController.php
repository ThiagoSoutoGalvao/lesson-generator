<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class BackgroundController extends Controller
{
    public function fetch(Request $request)
    {
        $topic = $request->query('topic', 'education');
        $key = config('services.unsplash.key');

        if (! $key) {
            return response()->json(['url' => "https://picsum.photos/seed/{$topic}/1920/1080"]);
        }

        $response = Http::get('https://api.unsplash.com/photos/random', [
            'query'       => $topic,
            'client_id'   => $key,
            'orientation' => 'landscape',
        ]);

        if ($response->failed()) {
            return response()->json(['url' => null]);
        }

        return response()->json(['url' => $response->json('urls.regular')]);
    }
}
