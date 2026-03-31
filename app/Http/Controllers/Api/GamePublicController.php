<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameLevelAdRule;
use Illuminate\Http\JsonResponse;

class GamePublicController extends Controller
{
    public function levelAdSettings(): JsonResponse
    {
        $rules = GameLevelAdRule::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('level_from')
            ->get();

        return response()->json(['rules' => $rules]);
    }

    public function config(): JsonResponse
    {
        return response()->json([
            'level_ad_rules' => GameLevelAdRule::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('level_from')
                ->get(),
        ]);
    }
}
