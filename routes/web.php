<?php

use App\Http\Controllers\Admin\AdminAdsActionController;
use App\Http\Controllers\Admin\AdsPageController;
use App\Http\Controllers\Api\AdAssetController;
use App\Http\Controllers\Api\AdRuleController;
use App\Http\Controllers\Api\AdvertiserController;
use App\Http\Controllers\Api\BannerAdminController;
use App\Http\Controllers\Api\GameConfigAdminController;
use App\Http\Controllers\Api\SubscriptionPlanController;
use App\Http\Controllers\Api\UserAdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn() => redirect()->route('admin.ads.audio'))->name('dashboard');

    Route::get('users', [AdsPageController::class, 'users'])->name('users');
    Route::get('users/data', [UserAdminController::class, 'index'])->name('users.data');
    Route::post('users', [UserAdminController::class, 'store'])->name('users.store');
    Route::patch('users/{id}', [UserAdminController::class, 'update'])->name('users.update');
    Route::delete('users/{id}', [UserAdminController::class, 'destroy'])->name('users.destroy');

    Route::prefix('ads')->name('ads.')->group(function () {
        Route::post('assets', [AdminAdsActionController::class, 'storeAdAsset'])->name('assets.store');
        Route::post('assets/json', [AdminAdsActionController::class, 'storeAdAssetJson'])->name('assets.store-json');
        Route::patch('assets/{id}', [AdAssetController::class, 'update'])->name('assets.update');
        Route::patch('assets/{id}/toggle', [AdminAdsActionController::class, 'toggleAdAsset'])->name('assets.toggle');
        Route::delete('assets/{id}', [AdminAdsActionController::class, 'destroyAdAsset'])->name('assets.destroy');
        Route::post('advertisers', [AdminAdsActionController::class, 'storeAdvertiser'])->name('advertisers.store');
        Route::put('advertisers/{id}', [AdvertiserController::class, 'update'])->name('advertisers.update');
        Route::put('settings/stripe', [AdminAdsActionController::class, 'updateStripeKeys'])->name('settings.stripe');
        Route::post('subscription/plans', [AdminAdsActionController::class, 'storeSubscriptionPlan'])->name('subscription.plans.store');
        Route::get('subscription/plans/data', [SubscriptionPlanController::class, 'adminIndex'])->name('subscription.plans.data');
        Route::patch('subscription/plans/{id}', [SubscriptionPlanController::class, 'update'])->name('subscription.plans.update');
        Route::delete('subscription/plans/{id}', [SubscriptionPlanController::class, 'destroy'])->name('subscription.plans.destroy');
        Route::post('game-level-ad-rules', [AdminAdsActionController::class, 'storeGameLevelRule'])->name('game-level-ad-rules.store');
        Route::patch('game-level-ad-rules/{id}', [AdminAdsActionController::class, 'updateGameLevelRule'])->name('game-level-ad-rules.update');
        Route::delete('game-level-ad-rules/{id}', [AdminAdsActionController::class, 'destroyGameLevelRule'])->name('game-level-ad-rules.destroy');
        Route::get('rules/data', [AdRuleController::class, 'index'])->name('rules.data');
        Route::post('rules', [AdRuleController::class, 'store'])->name('rules.store');
        Route::patch('rules/{id}', [AdRuleController::class, 'update'])->name('rules.update');
        Route::delete('rules/{id}', [AdRuleController::class, 'destroy'])->name('rules.destroy');
        Route::get('platform-banners/data', [BannerAdminController::class, 'index'])->name('platform-banners.data');
        Route::post('platform-banners', [BannerAdminController::class, 'store'])->name('platform-banners.store');
        Route::patch('platform-banners/{id}', [BannerAdminController::class, 'update'])->name('platform-banners.update');
        Route::delete('platform-banners/{id}', [BannerAdminController::class, 'destroy'])->name('platform-banners.destroy');

        Route::post('level-backgrounds/presign', [AdminAdsActionController::class, 'levelBackgroundPresignJson'])->name('level-backgrounds.presign');
        Route::post('level-background-images', [AdminAdsActionController::class, 'storeLevelBackgroundImage'])->name('level-background-images.store');
        Route::patch('level-background-images/{id}', [AdminAdsActionController::class, 'updateLevelBackgroundImage'])->name('level-background-images.update');
        Route::delete('level-background-images/{id}', [AdminAdsActionController::class, 'destroyLevelBackgroundImage'])->name('level-background-images.destroy');
        Route::get('game-config-entries/data', [GameConfigAdminController::class, 'index'])->name('game-config-entries.data');
        Route::post('game-config-entries', [GameConfigAdminController::class, 'store'])->name('game-config-entries.store');
        Route::patch('game-config-entries/{id}', [GameConfigAdminController::class, 'update'])->name('game-config-entries.update');
        Route::delete('game-config-entries/{id}', [GameConfigAdminController::class, 'destroy'])->name('game-config-entries.destroy');

        Route::get('audio', [AdsPageController::class, 'audio'])->name('audio');
        Route::get('video', [AdsPageController::class, 'video'])->name('video');
        Route::get('vast', [AdsPageController::class, 'vast'])->name('vast');
        Route::get('banner', [AdsPageController::class, 'banner'])->name('banner');
        Route::get('advertisers', [AdsPageController::class, 'advertisers'])->name('advertisers');
        Route::get('free-tier', [AdsPageController::class, 'freeTier'])->name('free-tier');
        Route::get('rules', [AdsPageController::class, 'rules'])->name('rules');
        Route::get('analytics', [AdsPageController::class, 'analytics'])->name('analytics');
        Route::get('platform-banners', [AdsPageController::class, 'platformBanners'])->name('platform-banners');
        Route::get('stripe', [AdsPageController::class, 'stripe'])->name('stripe');
        Route::get('plans', [AdsPageController::class, 'plans'])->name('plans');
        Route::get('levels', [AdsPageController::class, 'levels'])->name('levels');
        Route::get('level-backgrounds', [AdsPageController::class, 'levelBackgrounds'])->name('level-backgrounds');
        Route::get('game-configs', [AdsPageController::class, 'gameConfigs'])->name('game-configs');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
