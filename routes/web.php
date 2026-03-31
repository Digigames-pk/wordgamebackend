<?php

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

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('admin', fn () => redirect()->route('admin.ads.audio'))->name('admin.dashboard');

    Route::prefix('admin/ads')->name('admin.ads.')->group(function () {
        Route::get('audio', fn () => Inertia::render('admin/ads/audio'))->name('audio');
        Route::get('video', fn () => Inertia::render('admin/ads/video'))->name('video');
        Route::get('vast', fn () => Inertia::render('admin/ads/vast'))->name('vast');
        Route::get('banner', fn () => Inertia::render('admin/ads/banner'))->name('banner');
        Route::get('advertisers', fn () => Inertia::render('admin/ads/advertisers'))->name('advertisers');
        Route::get('free-tier', fn () => Inertia::render('admin/ads/free-tier'))->name('free-tier');
        Route::get('rules', fn () => Inertia::render('admin/ads/rules'))->name('rules');
        Route::get('analytics', fn () => Inertia::render('admin/ads/analytics'))->name('analytics');
        Route::get('platform-banners', fn () => Inertia::render('admin/ads/platform-banners'))->name('platform-banners');
        Route::get('stripe', fn () => Inertia::render('admin/ads/stripe'))->name('stripe');
        Route::get('plans', fn () => Inertia::render('admin/ads/plans'))->name('plans');
        Route::get('levels', fn () => Inertia::render('admin/ads/levels'))->name('levels');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
