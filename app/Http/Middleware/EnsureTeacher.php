<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate for the teacher-facing API. Every account is a teacher unless
 * role='student', so this only blocks student logins from reaching the
 * generation / library / document endpoints.
 */
class EnsureTeacher
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->isTeacher(), 403, 'Teachers only.');

        return $next($request);
    }
}
