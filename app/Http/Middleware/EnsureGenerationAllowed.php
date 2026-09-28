<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Rations Claude API credit. When GENERATION_ONLY_FOR is set (comma-separated
 * emails), only those logins can call the endpoints that spend credit; everyone
 * else gets a friendly message. Unset or empty = everyone can generate.
 * Saved activities, the Library and the student app are unaffected.
 */
class EnsureGenerationAllowed
{
    public function handle(Request $request, Closure $next): Response
    {
        $allowed = collect(explode(',', (string) config('services.anthropic.only_for')))
            ->map(fn ($email) => strtolower(trim($email)))
            ->filter();

        if ($allowed->isNotEmpty() && ! $allowed->contains(strtolower((string) $request->user()?->email))) {
            return response()->json([
                'message' => 'Generating new activities is paused until the credits are topped up. Saved activities in the Library still work.',
            ], 403);
        }

        return $next($request);
    }
}
