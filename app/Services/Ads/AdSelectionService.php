<?php

namespace App\Services\Ads;

use App\Models\AdAsset;
use App\Models\BannerAd;
use Illuminate\Support\Collection;

class AdSelectionService
{
    public function approvedGlobalAssets(): \Illuminate\Database\Eloquent\Builder
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
            return $a->video_url || $a->vast_tag_url;
        });

        $selected = $this->weightedRandom($videoAds);
        if (! $selected) {
            return null;
        }

        return [
            'id' => $selected->id,
            'name' => $selected->name,
            'videoUrl' => $selected->video_url,
            'vastTagUrl' => $selected->vast_tag_url,
            'vmapTagUrl' => $selected->vmap_tag_url,
            'thumbnailUrl' => $selected->thumbnail_url,
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
            'assetUrl' => $selected->asset_url,
            'durationSec' => $selected->duration_sec,
            'skipAfterSec' => $selected->skip_after_sec ?? 5,
            'clickThroughUrl' => $selected->click_through_url,
            'type' => $selected->type,
            'format' => $selected->format,
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
        $banners = BannerAd::query()
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

        $selected = $this->weightedRandom($banners);
        if (! $selected) {
            return null;
        }

        return [
            'id' => $selected->id,
            'name' => $selected->name,
            'imageUrl' => $selected->image_url,
            'linkUrl' => $selected->link_url,
            'altText' => $selected->alt_text,
            'position' => $selected->position,
            'size' => $selected->size,
            'weight' => $selected->weight,
        ];
    }
}
