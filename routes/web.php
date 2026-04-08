<?php

use App\Http\Controllers\Admin\AdminAdsActionController;
use App\Http\Controllers\Admin\AdsPageController;
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
    Route::get('/', fn () => redirect()->route('admin.ads.audio'))->name('dashboard');

    Route::prefix('ads')->name('ads.')->group(function () {
        Route::post('assets', [AdminAdsActionController::class, 'storeAdAsset'])->name('assets.store');
        Route::post('assets/json', [AdminAdsActionController::class, 'storeAdAssetJson'])->name('assets.store-json');
        Route::patch('assets/{id}/toggle', [AdminAdsActionController::class, 'toggleAdAsset'])->name('assets.toggle');
        Route::delete('assets/{id}', [AdminAdsActionController::class, 'destroyAdAsset'])->name('assets.destroy');
        Route::post('advertisers', [AdminAdsActionController::class, 'storeAdvertiser'])->name('advertisers.store');
        Route::put('settings/stripe', [AdminAdsActionController::class, 'updateStripeKeys'])->name('settings.stripe');
        Route::post('subscription/plans', [AdminAdsActionController::class, 'storeSubscriptionPlan'])->name('subscription.plans.store');
        Route::post('game-level-ad-rules', [AdminAdsActionController::class, 'storeGameLevelRule'])->name('game-level-ad-rules.store');

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
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
