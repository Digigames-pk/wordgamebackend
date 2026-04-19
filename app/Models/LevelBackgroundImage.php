<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LevelBackgroundImage extends Model
{
    protected $fillable = [
        'image_url',
        'title',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
