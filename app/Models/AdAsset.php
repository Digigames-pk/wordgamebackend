<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdAsset extends Model
{
    use HasUuids;

    protected static function booted(): void
    {
        static::creating(function (AdAsset $adAsset): void {
            if (filled($adAsset->asset_url)) {
                return;
            }

            if (filled($adAsset->vast_tag_url) || filled($adAsset->vmap_tag_url)) {
                $adAsset->asset_url = 'programmatic://vast-vmap-ad';

                return;
            }

            $type = (string) ($adAsset->type ?? '');

            $adAsset->asset_url = match ($type) {
                'display' => 'placeholder://banner-ad',
                'vast' => 'programmatic://vast-vmap-ad',
                default => 'placeholder://ad-asset',
            };
        });
    }

    protected $fillable = [
        'owner_type', 'advertiser_id', 'name', 'type', 'format', 'placement_type',
        'asset_url', 'video_url', 'thumbnail_url', 'aspect_ratio', 'duration_sec',
        'max_file_size', 'skip_after_sec', 'is_skippable', 'click_through_url',
        'metadata', 'status', 'is_active', 'impression_count', 'click_count',
        'completion_count', 'frequency_per_hour', 'frequency_per_listener',
        'frequency_per_show', 'duration_limit', 'time_slots', 'banner_position',
        'banner_size', 'external_ad_code', 'display_timing', 'start_date', 'end_date',
        'max_impressions', 'max_clicks', 'vast_tag_url', 'vmap_tag_url', 'weight',
        'geo_countries', 'geo_states', 'geo_cities', 'geo_exclude_countries',
        'geo_exclude_states', 'geo_exclude_cities', 'cpm', 'cpc', 'total_revenue',
        'plays_in_current_hour', 'last_hour_reset', 'plays_in_current_show',
        'current_show_id',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'time_slots' => 'array',
            'display_timing' => 'array',
            'geo_countries' => 'array',
            'geo_states' => 'array',
            'geo_cities' => 'array',
            'geo_exclude_countries' => 'array',
            'geo_exclude_states' => 'array',
            'geo_exclude_cities' => 'array',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'last_hour_reset' => 'datetime',
            'is_skippable' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function advertiser(): BelongsTo
    {
        return $this->belongsTo(Advertiser::class);
    }

    public function analyticsEvents(): HasMany
    {
        return $this->hasMany(AdAnalyticsEvent::class, 'ad_asset_id');
    }
}
