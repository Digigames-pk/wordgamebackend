<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class ApiUser
{
    public static function fromBearer(Request $request): ?User
    {
        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }

        $access = PersonalAccessToken::findToken($token);
        $model = $access?->tokenable;

        return $model instanceof User ? $model : null;
    }
}
