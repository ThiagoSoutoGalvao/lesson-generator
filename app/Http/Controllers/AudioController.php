<?php

namespace App\Http\Controllers;

use App\Models\AudioClip;

/**
 * GET /api/audio/{clip}: one spoken line of a listening activity, for teachers and students alike (it carries no
 * user data). Clips never change once made (a new text gets a new clip), so browsers may cache them for a year.
 */
class AudioController extends Controller
{
    public function show(AudioClip $clip)
    {
        return response(base64_decode($clip->data), 200, [
            'Content-Type'   => $clip->mime,
            'Content-Length' => (string) $clip->bytes,
            'Cache-Control'  => 'private, max-age=31536000, immutable',
            'Accept-Ranges'  => 'none',
        ]);
    }
}
