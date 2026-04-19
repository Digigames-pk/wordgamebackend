<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameLevel extends Model
{
    protected $fillable = [
        'level_number',
        'name',
        'theme',
        'difficulty',
        'letters',
        'words',
        'grid_words',
        'grid_layout',
        'background_color',
        'accent_color',
        'background_image',
        'grid_style',
        'reward',
        'is_procedurally_generated',
        'procedural_tier',
    ];

    protected function casts(): array
    {
        return [
            'letters' => 'array',
            'words' => 'array',
            'grid_words' => 'array',
            'grid_layout' => 'array',
            'is_procedurally_generated' => 'boolean',
            'procedural_tier' => 'integer',
            'reward' => 'integer',
            'level_number' => 'integer',
        ];
    }
}
