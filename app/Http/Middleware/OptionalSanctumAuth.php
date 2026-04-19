<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hydrates the request user from a Bearer token when present, without rejecting guests.
 */
class OptionalSanctumAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()) {
            return $next($request);
        }

        $token = $request->bearerToken();
        if (! $token) {
            return $next($request);
        }

        $accessToken = PersonalAccessToken::findToken($token);
        if ($accessToken?->tokenable) {
            $request->setUserResolver(fn () => $accessToken->tokenable);
        }

        return $next($request);
    }
}
