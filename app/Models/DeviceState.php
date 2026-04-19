<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeviceState extends Model
{
    protected $fillable = [
        'device_id',
        'last_level',
        'coins',
    ];

    protected function casts(): array
    {
        return [
            'last_level' => 'integer',
            'coins' => 'integer',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'device_id_key');
    }
}
