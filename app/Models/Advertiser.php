<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Advertiser extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'company_name', 'contact_name', 'email', 'phone',
        'address', 'notes', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function adAssets(): HasMany
    {
        return $this->hasMany(AdAsset::class);
    }
}
