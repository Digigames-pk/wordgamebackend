<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdAsset;
use Illuminate\Http\JsonResponse;

class PlatformAnalyticsController extends Controller
{
    public function platform(): JsonResponse
    {
        $totals = [
            'total_impressions' => (int) AdAsset::query()->sum('impression_count'),
            'total_clicks' => (int) AdAsset::query()->sum('click_count'),
            'total_completions' => (int) AdAsset::query()->sum('completion_count'),
            'asset_count' => AdAsset::query()->count(),
        ];

        return response()->json(['analytics' => $totals]);
    }

    public function topPerforming(Request $request): JsonResponse
    {
        $limit = min(50, max(1, (int) $request->query('limit', 10)));
        $ads = AdAsset::query()
            ->orderByDesc('impression_count')
            ->limit($limit)
            ->get()
            ->map(function (AdAsset $a) {
                $impressions = $a->impression_count ?: 1;

                return [
                    ...$a->only(['id', 'name', 'type', 'format']),
                    'impression_count' => $a->impression_count,
                    'click_count' => $a->click_count,
                    'ctr' => round(($a->click_count / $impressions) * 100, 2),
                ];
            });

        return response()->json(['ads' => $ads]);
    }
}
