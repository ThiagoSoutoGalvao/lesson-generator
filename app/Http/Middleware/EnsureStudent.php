<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate for the student content API (/api/student/*). Also blocks a student
 * whose account has been deactivated by their teacher.
 */
class EnsureStudent
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless($user?->isStudent(), 403, 'Students only.');
        abort_unless($user->is_active, 403, 'This account is paused.');

        return $next($request);
    }
}
