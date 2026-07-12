<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeviceState extends Model
{
    protected $fillable = [
        'device_id',
        'last_level',
        'coins',
        'subscription_plan_id',
        'iap_product_id',
        'iap_transaction_id',
        'iap_platform',
        'iap_purchased_at',
    ];

    protected function casts(): array
    {
        return [
            'last_level' => 'integer',
            'coins' => 'integer',
            'iap_purchased_at' => 'datetime',
        ];
    }

    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'device_id_key');
    }
}
