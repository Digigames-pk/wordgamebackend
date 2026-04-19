<?php

namespace Database\Seeders;

use App\Models\GameConfigEntry;
use Illuminate\Database\Seeder;

class DefaultGameConfigSeeder extends Seeder
{
    public function run(): void
    {
        GameConfigEntry::query()->updateOrCreate(
            ['entry_key' => 'level_coins'],
            ['entry_value' => '0'],
        );
    }
}
