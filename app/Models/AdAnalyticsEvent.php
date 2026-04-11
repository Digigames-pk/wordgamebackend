<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdAnalyticsEvent extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'ad_asset_id', 'event_type', 'country', 'country_code', 'region', 'city',
        'device_type', 'browser', 'session_id', 'watched_duration_ms', 'placement',
        'client_ip', 'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'recorded_at' => 'datetime',
        ];
    }

    public function adAsset(): BelongsTo
    {
        return $this->belongsTo(AdAsset::class, 'ad_asset_id');
    }
}
