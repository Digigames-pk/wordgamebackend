<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdAsset;
use App\Models\BannerAd;
use App\Services\Ads\AdSelectionService;
use App\Support\ApiUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicBannerController extends Controller
{
    public function __construct(
        protected AdSelectionService $selection
    ) {}

    public function publicBanner(Request $request): JsonResponse
    {
        $user = ApiUser::fromBearer($request);
        if ($user && $user->hasActiveAdFreeSubscription()) {
            return response()->json(['banner' => null, 'showBanner' => false, 'adsDisabled' => true]);
        }

        $banner = $this->selection->nextBannerPayload();

        return response()->json([
            'banner' => $banner,
            'showBanner' => $banner !== null,
            'adsDisabled' => false,
        ]);
    }

    public function click(string $id): JsonResponse
    {
        $updated = AdAsset::query()->whereKey($id)->increment('click_count');
        if ($updated === 0) {
            BannerAd::query()->whereKey($id)->increment('click_count');
        }

        return response()->json(['success' => true]);
    }

    public function impression(string $id): JsonResponse
    {
        $updated = AdAsset::query()->whereKey($id)->increment('impression_count');
        if ($updated === 0) {
            BannerAd::query()->whereKey($id)->increment('impression_count');
        }

        return response()->json(['success' => true]);
    }
}
