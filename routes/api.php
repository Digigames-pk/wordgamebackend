<?php

use App\Http\Controllers\Api\AdAssetController;
use App\Http\Controllers\Api\AdCampaignController;
use App\Http\Controllers\Api\AdRuleController;
use App\Http\Controllers\Api\AdUploadController;
use App\Http\Controllers\Api\AdvertiserController;
use App\Http\Controllers\Api\AppSettingsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BannerAdminController;
use App\Http\Controllers\Api\DeviceStatePublicController;
use App\Http\Controllers\Api\GameConfigAdminController;
use App\Http\Controllers\Api\GameLevelAdRuleController;
use App\Http\Controllers\Api\GameLevelApiController;
use App\Http\Controllers\Api\GamePublicController;
use App\Http\Controllers\Api\LevelBackgroundImageController;
use App\Http\Controllers\Api\LevelBackgroundPresignController;
use App\Http\Controllers\Api\LevelCompleteController;
use App\Http\Controllers\Api\PlatformAnalyticsController;
use App\Http\Controllers\Api\ProfileApiController;
use App\Http\Controllers\Api\PublicAdController;
use App\Http\Controllers\Api\PublicBannerController;
use App\Http\Controllers\Api\StripeWebhookController;
use App\Http\Controllers\Api\SubscriptionCheckoutController;
use App\Http\Controllers\Api\SubscriptionPlanController;
use App\Http\Controllers\Api\UserAdminController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/profile', [ProfileApiController::class, 'show']);
    Route::put('/profile', [ProfileApiController::class, 'update']);
});

Route::get('/subscription/plans', [SubscriptionPlanController::class, 'publicPlans']);

Route::post('/stripe/webhook', StripeWebhookController::class)->middleware('throttle:120,1');

Route::get('/game/level-ad-settings', [GamePublicController::class, 'levelAdSettings']);
Route::get('/game/config', [GamePublicController::class, 'config']);
Route::get('/game/mobile-configs', [GamePublicController::class, 'mobileConfigs']);
Route::get('/game/levels', [GameLevelApiController::class, 'index']);
Route::get('/game/level/{level}', [GameLevelApiController::class, 'show'])->whereNumber('level');

Route::post('/public/device-state', [DeviceStatePublicController::class, 'store'])->middleware('throttle:120,1');

Route::post('/game/level-complete', [LevelCompleteController::class, 'store'])
    ->middleware(['optional.sanctum', 'throttle:120,1']);

Route::middleware(['throttle:120,1'])->group(function () {
    Route::get('/game/next-ad', [PublicAdController::class, 'nextInterstitial']);
    Route::get('/ads/next-random', [PublicAdController::class, 'nextInterstitial']);
    Route::get('/ads/next-video', [PublicAdController::class, 'nextVideo']);
    Route::get('/ads/next-audio', [PublicAdController::class, 'nextAudio']);
    Route::post('/analytics/ad-event', [PublicAdController::class, 'trackAdEvent']);
    Route::get('/banners/public', [PublicBannerController::class, 'publicBanner']);
    Route::get('/ads/banner', [PublicBannerController::class, 'publicBanner']);
    Route::post('/banners/{id}/click', [PublicBannerController::class, 'click']);
    Route::post('/banners/{id}/impression', [PublicBannerController::class, 'impression']);
    Route::post('/device-id', [AuthController::class, 'deviceId']);
});

Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::post('/subscription/checkout', [SubscriptionCheckoutController::class, 'checkout']);
    Route::get('/subscription/status', [SubscriptionCheckoutController::class, 'status']);
    Route::post('/subscription/portal', [SubscriptionCheckoutController::class, 'portal']);
});
// 'throttle:120,1'
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/ads/upload-url', [AdUploadController::class, 'presigned']);
    Route::post('/ads/assets/json', [AdAssetController::class, 'storeJson']);
    Route::post('/ads/assets', [AdAssetController::class, 'storeMultipart']);
    Route::get('/ads/assets', [AdAssetController::class, 'index']);
    Route::get('/ads/assets/with-analytics', [AdAssetController::class, 'withAnalytics']);
    Route::patch('/ads/assets/{id}', [AdAssetController::class, 'update']);
    Route::delete('/ads/assets/{id}', [AdAssetController::class, 'destroy']);
    Route::patch('/ads/assets/{id}/approve', [AdAssetController::class, 'approve']);
    Route::patch('/ads/assets/{id}/toggle', [AdAssetController::class, 'toggle']);
    Route::get('/ads/assets/{id}/analytics', [AdAssetController::class, 'analytics']);
    Route::get('/ads/assets/{id}/locations', [AdAssetController::class, 'locations']);

    Route::get('/ads/rules', [AdRuleController::class, 'index']);
    Route::post('/ads/rules', [AdRuleController::class, 'store']);
    Route::patch('/ads/rules/{id}', [AdRuleController::class, 'update']);
    Route::delete('/ads/rules/{id}', [AdRuleController::class, 'destroy']);

    Route::get('/ads/campaigns', [AdCampaignController::class, 'index']);
    Route::post('/ads/campaigns', [AdCampaignController::class, 'store']);
    Route::patch('/ads/campaigns/{id}', [AdCampaignController::class, 'update']);
    Route::delete('/ads/campaigns/{id}', [AdCampaignController::class, 'destroy']);

    Route::get('/ads/platform-analytics', [PlatformAnalyticsController::class, 'platform']);
    Route::get('/ads/top-performing', [PlatformAnalyticsController::class, 'topPerforming']);
    Route::get('/ads/analytics', [PlatformAnalyticsController::class, 'platform']);

    Route::get('/advertisers', [AdvertiserController::class, 'index']);
    Route::post('/advertisers', [AdvertiserController::class, 'store']);
    Route::get('/advertisers/{id}', [AdvertiserController::class, 'show']);
    Route::put('/advertisers/{id}', [AdvertiserController::class, 'update']);
    Route::delete('/advertisers/{id}', [AdvertiserController::class, 'destroy']);
    Route::get('/advertisers/{id}/report', [AdvertiserController::class, 'report']);
    Route::get('/advertisers/{id}/export', [AdvertiserController::class, 'export']);

    Route::get('/admin/banners', [BannerAdminController::class, 'index']);
    Route::post('/admin/banners', [BannerAdminController::class, 'store']);
    Route::patch('/admin/banners/{id}', [BannerAdminController::class, 'update']);
    Route::delete('/admin/banners/{id}', [BannerAdminController::class, 'destroy']);

    Route::get('/admin/game-level-ad-rules', [GameLevelAdRuleController::class, 'index']);
    Route::post('/admin/game-level-ad-rules', [GameLevelAdRuleController::class, 'store']);
    Route::patch('/admin/game-level-ad-rules/{id}', [GameLevelAdRuleController::class, 'update']);
    Route::delete('/admin/game-level-ad-rules/{id}', [GameLevelAdRuleController::class, 'destroy']);

    Route::get('/admin/subscription/plans', [SubscriptionPlanController::class, 'adminIndex']);
    Route::post('/admin/subscription/plans', [SubscriptionPlanController::class, 'store']);
    Route::patch('/admin/subscription/plans/{id}', [SubscriptionPlanController::class, 'update']);
    Route::delete('/admin/subscription/plans/{id}', [SubscriptionPlanController::class, 'destroy']);

    Route::get('/admin/settings/stripe', [AppSettingsController::class, 'stripeKeys']);
    Route::put('/admin/settings/stripe', [AppSettingsController::class, 'updateStripeKeys']);

    Route::post('/level-backgrounds/presign', [LevelBackgroundPresignController::class, 'presign']);
    Route::get('/admin/level-background-images', [LevelBackgroundImageController::class, 'index']);
    Route::post('/admin/level-background-images', [LevelBackgroundImageController::class, 'store']);
    Route::patch('/admin/level-background-images/{id}', [LevelBackgroundImageController::class, 'update']);
    Route::delete('/admin/level-background-images/{id}', [LevelBackgroundImageController::class, 'destroy']);

    Route::get('/admin/game-config-entries', [GameConfigAdminController::class, 'index']);
    Route::post('/admin/game-config-entries', [GameConfigAdminController::class, 'store']);
    Route::patch('/admin/game-config-entries/{id}', [GameConfigAdminController::class, 'update']);
    Route::delete('/admin/game-config-entries/{id}', [GameConfigAdminController::class, 'destroy']);

    Route::get('/admin/users', [UserAdminController::class, 'index']);
    Route::post('/admin/users', [UserAdminController::class, 'store']);
    Route::get('/admin/users/{id}', [UserAdminController::class, 'show']);
    Route::patch('/admin/users/{id}', [UserAdminController::class, 'update']);
    Route::delete('/admin/users/{id}', [UserAdminController::class, 'destroy']);
});
