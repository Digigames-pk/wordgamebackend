<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Api\AppSettingsController;
use App\Http\Controllers\Api\PlatformAnalyticsController;
use App\Http\Controllers\Controller;
use App\Models\AdAsset;
use App\Models\AdRule;
use App\Models\Advertiser;
use App\Models\BannerAd;
use App\Models\GameLevelAdRule;
use App\Models\ContactMessage;
use App\Models\GameConfigEntry;
use App\Models\LevelBackgroundImage;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdsPageController extends Controller
{
    /**
     * @return array<int, array<string, mixed>>
     */
    protected function assetsList(): array
    {
        return AdAsset::query()->orderByDesc('created_at')->get()->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function advertisersList(): array
    {
        return Advertiser::query()->orderBy('name')->get()->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function adTypePageProps(): array
    {
        return [
            'assets' => $this->assetsList(),
            'advertisers' => $this->advertisersList(),
        ];
    }

    public function audio(): Response
    {
        return Inertia::render('admin/ads/audio', $this->adTypePageProps());
    }

    public function video(): Response
    {
        return Inertia::render('admin/ads/video', $this->adTypePageProps());
    }

    public function vast(): Response
    {
        return Inertia::render('admin/ads/vast', $this->adTypePageProps());
    }

    public function banner(): Response
    {
        return Inertia::render('admin/ads/banner', $this->adTypePageProps());
    }

    public function advertisers(): Response
    {
        return Inertia::render('admin/ads/advertisers', [
            'assets' => $this->assetsList(),
            'advertisers' => $this->advertisersList(),
        ]);
    }

    public function freeTier(): Response
    {
        return Inertia::render('admin/ads/free-tier');
    }

    public function rules(): Response
    {
        return Inertia::render('admin/ads/rules', [
            'rules' => AdRule::query()->orderBy('created_at')->get()->all(),
        ]);
    }

    public function analytics(): Response
    {
        $payload = app(PlatformAnalyticsController::class)->platform()->getData(true);

        return Inertia::render('admin/ads/analytics', [
            'analytics' => $payload['analytics'],
        ]);
    }

    public function platformBanners(): Response
    {
        return Inertia::render('admin/ads/platform-banners', [
            'banners' => BannerAd::query()->orderByDesc('created_at')->get()->all(),
        ]);
    }

    public function stripe(): Response
    {
        $stripeSettings = app(AppSettingsController::class)->stripeKeys()->getData(true);

        return Inertia::render('admin/ads/stripe', [
            'stripeSettings' => $stripeSettings,
        ]);
    }

    public function plans(): Response
    {
        return Inertia::render('admin/ads/plans', [
            'plans' => SubscriptionPlan::query()->orderBy('name')->get()->all(),
        ]);
    }

    public function levels(): Response
    {
        return Inertia::render('admin/ads/levels', [
            'levelRules' => GameLevelAdRule::query()->orderBy('sort_order')->orderBy('level_from')->get()->all(),
        ]);
    }

    public function levelBackgrounds(): Response
    {
        return Inertia::render('admin/ads/level-background-images', [
            'images' => LevelBackgroundImage::query()->orderBy('sort_order')->orderByDesc('id')->get()->all(),
        ]);
    }

    public function gameConfigs(): Response
    {
        return Inertia::render('admin/ads/game-config-entries', [
            'configs' => GameConfigEntry::query()->orderBy('entry_key')->get()->all(),
        ]);
    }

    public function users(): Response
    {
        return Inertia::render('admin/users', [
            'users' => User::query()
                ->with(['subscriptions.plan', 'deviceState'])
                ->orderBy('name')
                ->get()
                ->all(),
        ]);
    }

    public function contactMessages(): Response
    {
        return Inertia::render('admin/contact-messages', [
            'messages' => ContactMessage::query()
                ->with('user:id,name,email')
                ->orderByDesc('created_at')
                ->get()
                ->all(),
        ]);
    }
}
