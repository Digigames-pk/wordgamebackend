<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AdCampaign extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'start_date', 'end_date', 'budget', 'impressions', 'clicks',
        'status', 'target_languages',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'target_languages' => 'array',
        ];
    }
}
