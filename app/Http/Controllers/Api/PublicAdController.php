<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Ads\AdAnalyticsService;
use App\Services\Ads\AdSelectionService;
use App\Support\ApiUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicAdController extends Controller
{
    public function __construct(
        protected AdSelectionService $selection,
        protected AdAnalyticsService $analytics
    ) {}

    public function nextVideo(Request $request): JsonResponse
    {
        $user = ApiUser::fromBearer($request);
        if ($user && $user->hasActiveAdFreeSubscription()) {
            return response()->json(['ad' => null, 'adsDisabled' => true]);
        }

        $ad = $this->selection->nextVideoPayload();

        return response()->json([
            'ad' => $ad,
            'adsDisabled' => false,
        ]);
    }

    public function nextAudio(Request $request): JsonResponse
    {
        $user = ApiUser::fromBearer($request);
        if ($user && $user->hasActiveAdFreeSubscription()) {
            return response()->json(['ad' => null, 'adsDisabled' => true]);
        }

        $ad = $this->selection->nextAudioPayload();

        return response()->json([
            'ad' => $ad,
            'adsDisabled' => false,
        ]);
    }

    public function trackAdEvent(Request $request): JsonResponse
    {
        $user = ApiUser::fromBearer($request);
        if ($user && $user->hasActiveAdFreeSubscription()) {
            return response()->json(['success' => true, 'skipped' => true]);
        }

        $data = $request->validate([
            'adAssetId' => ['required', 'uuid', 'exists:ad_assets,id'],
            'eventType' => ['required', 'string', 'in:impression,completion,skip,click,quartile_25,quartile_50,quartile_75'],
            'sessionId' => ['nullable', 'string', 'max:255'],
            'watchedDuration' => ['nullable', 'numeric'],
        ]);

        $this->analytics->trackAdEvent(
            $request,
            $data['adAssetId'],
            $data['eventType'],
            $data['sessionId'] ?? null
        );

        return response()->json(['success' => true]);
    }
}
