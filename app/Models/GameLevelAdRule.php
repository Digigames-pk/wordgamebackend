<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameLevelAdRule extends Model
{
    protected $fillable = [
        'sort_order', 'level_from', 'level_to', 'ads_after_level_complete', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
