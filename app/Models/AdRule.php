<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AdRule extends Model
{
    use HasUuids;

    protected $fillable = [
        'frequency_per_hour', 'allowed_hours', 'targeting', 'enabled',
    ];

    protected function casts(): array
    {
        return [
            'allowed_hours' => 'array',
            'targeting' => 'array',
            'enabled' => 'boolean',
        ];
    }
}
