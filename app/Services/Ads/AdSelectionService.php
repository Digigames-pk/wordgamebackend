<?php

namespace App\Services\Ads;

use App\Models\AdAsset;
use App\Models\BannerAd;
use App\Models\GameLevelAdRule;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AdSelectionService
{
    public function approvedGlobalAssets(): Builder
    {
        return AdAsset::query()
            ->where('owner_type', 'global')
            ->where('status', 'approved')
            ->where('is_active', true);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function nextVideoPayload(): ?array
    {
        $assets = $this->approvedGlobalAssets()
            ->where(function ($q) {
                $q->where('format', 'video')
                    ->orWhere('type', 'vast');
            })
            ->get()
            ->filter(fn (AdAsset $a) => $this->isValidForSchedule($a));

        $videoAds = $assets->filter(function (AdAsset $a) {
            return $a->video_url || $a->vast_tag_url || $a->vmap_tag_url;
        });

        $selected = $this->weightedRandom($videoAds);
        if (! $selected) {
            return null;
        }

        return [
            'id' => $selected->id,
            'name' => $selected->name,
            'videoUrl' => $this->absolutePublicAssetUrl($selected->video_url),
            'vastTagUrl' => $this->absolutePublicAssetUrl($selected->vast_tag_url),
            'vmapTagUrl' => $this->absolutePublicAssetUrl($selected->vmap_tag_url),
            'thumbnailUrl' => $this->absolutePublicAssetUrl($selected->thumbnail_url),
            'aspectRatio' => $selected->aspect_ratio ?? '16:9',
            'durationSec' => $selected->duration_sec,
            'skipAfterSec' => $selected->skip_after_sec ?? 5,
            'clickThroughUrl' => $selected->click_through_url,
            'type' => $selected->type,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function nextAudioPayload(): ?array
    {
        $audioAds = $this->approvedGlobalAssets()
            ->where('format', 'audio')
            ->get()
            ->filter(fn (AdAsset $a) => $this->isValidForSchedule($a) && $a->asset_url);

        $selected = $this->weightedRandom($audioAds);
        if (! $selected) {
            return null;
        }

        return [
            'id' => $selected->id,
            'name' => $selected->name,
            'assetUrl' => $this->absolutePublicAssetUrl($selected->asset_url),
            'durationSec' => $selected->duration_sec,
            'skipAfterSec' => $selected->skip_after_sec ?? 5,
            'clickThroughUrl' => $selected->click_through_url,
            'type' => $selected->type,
            'format' => $selected->format,
        ];
    }

    /**
     * Weighted random across audio + video + VAST/VMAP interstitial candidates.
     *
     * @return array<string, mixed>|null
     */
    public function nextRandomInterstitialPayload(): ?array
    {
        $candidates = $this->interstitialCandidateAssets();
        $selected = $this->weightedRandom($candidates);
        if (! $selected instanceof AdAsset) {
            return null;
        }

        return $this->normalizeInterstitialPayload($selected);
    }

    /**
     * @return Collection<int, AdAsset>
     */
    public function interstitialCandidateAssets(): Collection
    {
        $videoAssets = $this->approvedGlobalAssets()
            ->where(function ($q) {
                $q->where('format', 'video')
                    ->orWhere('type', 'vast');
            })
            ->get()
            ->filter(fn (AdAsset $a) => $this->isValidForSchedule($a))
            ->filter(function (AdAsset $a) {
                return $a->video_url || $a->vast_tag_url || $a->vmap_tag_url;
            });

        $audioAds = $this->approvedGlobalAssets()
            ->where('format', 'audio')
            ->get()
            ->filter(fn (AdAsset $a) => $this->isValidForSchedule($a) && filled($a->asset_url));

        return $videoAssets->merge($audioAds)->values();
    }

    /**
     * @return array<string, mixed>
     */
    public function normalizeInterstitialPayload(AdAsset $selected): array
    {
        $deliveryType = $this->deliveryTypeFor($selected);

        return [
            'id' => $selected->id,
            'name' => $selected->name,
            'deliveryType' => $deliveryType,
            'assetUrl' => $this->absolutePublicAssetUrl($selected->asset_url),
            'videoUrl' => $this->absolutePublicAssetUrl($selected->video_url),
            'vastTagUrl' => $this->absolutePublicAssetUrl($selected->vast_tag_url),
            'vmapTagUrl' => $this->absolutePublicAssetUrl($selected->vmap_tag_url),
            'thumbnailUrl' => $this->absolutePublicAssetUrl($selected->thumbnail_url),
            'aspectRatio' => $selected->aspect_ratio ?? '16:9',
            'durationSec' => $selected->duration_sec,
            'skipAfterSec' => $selected->skip_after_sec ?? 5,
            'clickThroughUrl' => $selected->click_through_url,
            'type' => $selected->type,
            'format' => $selected->format,
        ];
    }

    public function deliveryTypeFor(AdAsset $a): string
    {
        if ($a->format === 'audio') {
            return 'audio';
        }
        if (filled($a->vmap_tag_url)) {
            return 'vmap';
        }
        if (filled($a->vast_tag_url) && ! filled($a->video_url)) {
            return 'vast';
        }
        if (filled($a->video_url)) {
            return 'video';
        }
        if (filled($a->vast_tag_url)) {
            return 'vast';
        }

        return 'video';
    }

    /**
     * First matching active rule whose level range contains the given level (sort order wins).
     */
    public function resolveRuleForLevel(int $level): ?GameLevelAdRule
    {
        return GameLevelAdRule::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('level_from')
            ->get()
            ->first(fn (GameLevelAdRule $r): bool => $this->isLevelInRuleRange($level, $r));
    }

    public function isLevelInRuleRange(int $level, GameLevelAdRule $rule): bool
    {
        if ($level < $rule->level_from) {
            return false;
        }

        if ($rule->level_to !== null && $level > $rule->level_to) {
            return false;
        }

        return true;
    }

    /**
     * Whether the level number falls on this rule's ad interval (e.g. interval 10 → 10, 20, 30…).
     */
    public function isLevelOnAdInterval(int $level, GameLevelAdRule $rule): bool
    {
        $interval = max(1, (int) ($rule->level_interval ?? 1));

        if ($interval <= 1) {
            return true;
        }

        return $level % $interval === 0;
    }

    /**
     * Full eligibility: active rule range, positive ad count, and interval match.
     */
    public function isLevelEligibleForAd(int $level, GameLevelAdRule $rule): bool
    {
        if (! $rule->is_active) {
            return false;
        }

        if (! $this->isLevelInRuleRange($level, $rule)) {
            return false;
        }

        if ((int) $rule->ads_after_level_complete <= 0) {
            return false;
        }

        return $this->isLevelOnAdInterval($level, $rule);
    }

    /**
     * @return array{
     *     eligible: bool,
     *     rule: GameLevelAdRule|null,
     *     in_range: bool,
     *     interval_match: bool,
     * }
     */
    public function evaluateLevelAd(int $level): array
    {
        $rule = $this->resolveRuleForLevel($level);

        if ($rule === null) {
            return [
                'eligible' => false,
                'rule' => null,
                'in_range' => false,
                'interval_match' => false,
            ];
        }

        $inRange = $this->isLevelInRuleRange($level, $rule);
        $intervalMatch = $this->isLevelOnAdInterval($level, $rule);

        return [
            'eligible' => $this->isLevelEligibleForAd($level, $rule),
            'rule' => $rule,
            'in_range' => $inRange,
            'interval_match' => $intervalMatch,
        ];
    }

    public function isValidForSchedule(AdAsset $ad): bool
    {
        $now = now();
        if ($ad->start_date && $ad->start_date->isFuture()) {
            return false;
        }
        if ($ad->end_date && $ad->end_date->isPast()) {
            return false;
        }
        if ($ad->max_impressions && $ad->impression_count >= $ad->max_impressions) {
            return false;
        }
        if ($ad->time_slots && is_array($ad->time_slots) && count($ad->time_slots) > 0) {
            $hour = (int) $now->format('G');

            return in_array($hour, $ad->time_slots, true);
        }

        return true;
    }

    /**
     * @param  Collection<int, AdAsset>|Collection<int, BannerAd>  $items
     */
    protected function weightedRandom(Collection $items): AdAsset|BannerAd|null
    {
        if ($items->isEmpty()) {
            return null;
        }

        $totalWeight = (int) $items->sum(fn ($ad) => max(1, (int) ($ad->weight ?? 5)));
        if ($totalWeight < 1) {
            return $items->first();
        }

        $r = random_int(1, $totalWeight);
        foreach ($items as $ad) {
            $w = max(1, (int) ($ad->weight ?? 5));
            $r -= $w;
            if ($r <= 0) {
                return $ad;
            }
        }

        return $items->last();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function nextBannerPayload(): ?array
    {
        $assetBanners = $this->approvedGlobalAssets()
            ->where(function ($q) {
                $q->where('format', 'banner')
                    ->orWhere('type', 'banner')
                    ->orWhere('type', 'display');
            })
            ->get()
            ->filter(fn (AdAsset $a) => $this->isValidForSchedule($a))
            ->filter(function (AdAsset $a) {
                return $this->resolveBannerImageUrl($a) !== null;
            });

        if ($assetBanners->isNotEmpty()) {
            $selectedAsset = $this->weightedRandom($assetBanners);
            if (! $selectedAsset instanceof AdAsset) {
                return null;
            }

            return [
                'id' => $selectedAsset->id,
                'name' => $selectedAsset->name,
                'imageUrl' => $this->resolveBannerImageUrl($selectedAsset),
                'linkUrl' => $selectedAsset->click_through_url ?: $this->fallbackLinkUrlFromAsset($selectedAsset->asset_url),
                'altText' => null,
                'position' => $selectedAsset->banner_position ?? 'bottom',
                'size' => $selectedAsset->banner_size ?? 'medium',
                'weight' => $selectedAsset->weight,
            ];
        }

        $legacyBanners = BannerAd::query()
            ->where('is_active', true)
            ->get()
            ->filter(function (BannerAd $b) {
                $now = now();
                if ($b->start_date && $b->start_date->isFuture()) {
                    return false;
                }
                if ($b->end_date && $b->end_date->isPast()) {
                    return false;
                }
                if ($b->max_impressions && $b->impression_count >= $b->max_impressions) {
                    return false;
                }

                return true;
            });

        $selectedLegacy = $this->weightedRandom($legacyBanners);
        if (! $selectedLegacy instanceof BannerAd) {
            return null;
        }

        return [
            'id' => $selectedLegacy->id,
            'name' => $selectedLegacy->name,
            'imageUrl' => $this->absolutePublicAssetUrl($selectedLegacy->image_url),
            'linkUrl' => $selectedLegacy->link_url,
            'altText' => $selectedLegacy->alt_text,
            'position' => $selectedLegacy->position,
            'size' => $selectedLegacy->size,
            'weight' => $selectedLegacy->weight,
        ];
    }

    /**
     * Ensure clients always get a fetchable URL (Wasabi/S3 or absolute HTTP).
     */
    protected function absolutePublicAssetUrl(?string $url): ?string
    {
        if ($url === null || $url === '') {
            return $url;
        }
        if (preg_match('#^https?://#i', $url)) {
            return $url;
        }
        if (str_contains($url, '://')) {
            return $url;
        }
        if (str_starts_with($url, '//')) {
            return 'https:'.$url;
        }

        $base = config('filesystems.disks.wasabi.url');
        if (is_string($base) && $base !== '') {
            return rtrim($base, '/').'/'.ltrim($url, '/');
        }

        $aws = config('filesystems.disks.s3.url');
        if (is_string($aws) && $aws !== '') {
            return rtrim($aws, '/').'/'.ltrim($url, '/');
        }

        return $url;
    }

    protected function resolveBannerImageUrl(AdAsset $asset): ?string
    {
        $url = $asset->asset_url ?: $asset->video_url;
        if (! filled($url)) {
            return null;
        }
        if (str_starts_with((string) $url, 'placeholder://')) {
            return null;
        }
        if ($this->looksLikeImageUrl((string) $url)) {
            return $this->absolutePublicAssetUrl((string) $url);
        }

        return null;
    }

    protected function fallbackLinkUrlFromAsset(?string $assetUrl): ?string
    {
        if (! filled($assetUrl)) {
            return null;
        }

        $url = (string) $assetUrl;
        if ($this->looksLikeImageUrl($url)) {
            return null;
        }
        if (preg_match('#^https?://#i', $url)) {
            return $url;
        }

        return null;
    }

    protected function looksLikeImageUrl(string $url): bool
    {
        if (str_starts_with($url, 'data:image/')) {
            return true;
        }

        $path = parse_url($url, PHP_URL_PATH);
        if (! is_string($path) || $path === '') {
            return false;
        }

        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'], true);
    }
}
