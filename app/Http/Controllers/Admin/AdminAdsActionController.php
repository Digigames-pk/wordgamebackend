<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Api\AdAssetController;
use App\Http\Controllers\Api\AdvertiserController;
use App\Http\Controllers\Api\AppSettingsController;
use App\Http\Controllers\Api\GameLevelAdRuleController;
use App\Http\Controllers\Api\SubscriptionPlanController;
use App\Http\Controllers\Controller;
use App\Services\Stripe\SubscriptionPlanStripeSync;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminAdsActionController extends Controller
{
    public function storeAdAsset(Request $request): RedirectResponse
    {
        app(AdAssetController::class)->storeMultipart($request);

        return redirect()->back();
    }

    public function storeAdAssetJson(Request $request): RedirectResponse
    {
        app(AdAssetController::class)->storeJson($request);

        return redirect()->back();
    }

    public function toggleAdAsset(string $id): RedirectResponse
    {
        app(AdAssetController::class)->toggle($id);

        return redirect()->back();
    }

    public function destroyAdAsset(string $id): RedirectResponse
    {
        app(AdAssetController::class)->destroy($id);

        return redirect()->back();
    }

    public function storeAdvertiser(Request $request): RedirectResponse
    {
        app(AdvertiserController::class)->store($request);

        return redirect()->back();
    }

    public function updateStripeKeys(Request $request): RedirectResponse
    {
        app(AppSettingsController::class)->updateStripeKeys($request);

        return redirect()->back();
    }

    public function storeSubscriptionPlan(Request $request, SubscriptionPlanStripeSync $sync): RedirectResponse
    {
        $response = app(SubscriptionPlanController::class)->store($request, $sync);
        if ($response->getStatusCode() === 422) {
            $body = json_decode($response->getContent(), true);
            throw ValidationException::withMessages([
                'stripe' => [$body['message'] ?? 'Stripe sync failed'],
            ]);
        }

        return redirect()->back();
    }

    public function storeGameLevelRule(Request $request): RedirectResponse
    {
        app(GameLevelAdRuleController::class)->store($request);

        return redirect()->back();
    }
}
