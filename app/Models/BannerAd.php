<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BannerAd extends Model
{
    use HasUuids;

    protected $fillable = [
        'image_url', 'link_url', 'alt_text', 'name', 'position', 'size', 'weight',
        'is_active', 'is_platform_default', 'click_count', 'impression_count',
        'start_date', 'end_date', 'max_impressions', 'max_clicks', 'cpm', 'cpc',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'is_active' => 'boolean',
            'is_platform_default' => 'boolean',
        ];
    }
}
