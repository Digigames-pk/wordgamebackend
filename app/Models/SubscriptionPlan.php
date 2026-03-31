<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'description',
        'interval',
        'amount',
        'currency',
        'removes_ads',
        'is_active',
        'stripe_product_id',
        'stripe_price_id',
    ];

    protected function casts(): array
    {
        return [
            'removes_ads' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
