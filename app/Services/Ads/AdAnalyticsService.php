<?php

namespace App\Services\Ads;

use App\Models\AdAnalyticsEvent;
use App\Models\AdAsset;
use App\Models\AdCampaign;
use Illuminate\Http\Request;

class AdAnalyticsService
{
    public function trackAdEvent(Request $request, string $adAssetId, string $eventType, ?string $sessionId = null): void
    {
        $asset = AdAsset::query()->find($adAssetId);
        if (! $asset) {
            return;
        }

        $ua = $request->userAgent() ?? '';
        $deviceType = preg_match('/Mobile|Android|iPhone/i', $ua) ? 'mobile'
            : (preg_match('/Tablet|iPad/i', $ua) ? 'tablet' : 'desktop');

        AdAnalyticsEvent::query()->create([
            'ad_asset_id' => $adAssetId,
            'event_type' => $eventType,
            'country' => null,
            'country_code' => null,
            'region' => null,
            'city' => null,
            'device_type' => $deviceType,
            'browser' => $this->simpleBrowser($ua),
            'session_id' => $sessionId,
            'client_ip' => $request->ip(),
            'recorded_at' => now(),
        ]);

        match ($eventType) {
            'impression' => $asset->increment('impression_count'),
            'click' => $asset->increment('click_count'),
            'completion' => $asset->increment('completion_count'),
            default => null,
        };

        $campaign = AdCampaign::query()
            ->where('status', 'active')
            ->orderBy('start_date')
            ->first();

        if ($campaign) {
            if ($eventType === 'impression') {
                $campaign->increment('impressions');
            } elseif ($eventType === 'click') {
                $campaign->increment('clicks');
            }
        }
    }

    protected function simpleBrowser(string $ua): ?string
    {
        if (str_contains($ua, 'Edg')) {
            return 'Edge';
        }
        if (str_contains($ua, 'Chrome')) {
            return 'Chrome';
        }
        if (str_contains($ua, 'Firefox')) {
            return 'Firefox';
        }
        if (str_contains($ua, 'Safari')) {
            return 'Safari';
        }

        return null;
    }
}
