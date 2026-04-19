<?php

namespace Database\Seeders;

use App\Models\GameLevel;
use Illuminate\Database\Seeder;

class DefaultGameLevelsSeeder extends Seeder
{
    public function run(): void
    {
        $blueprints = config('game_level_blueprints', []);
        $n = 1;
        foreach ($blueprints as $bp) {
            GameLevel::query()->updateOrCreate(
                ['level_number' => $n],
                [
                    'name' => $bp['name'],
                    'theme' => $bp['theme'],
                    'difficulty' => $bp['difficulty'],
                    'letters' => $bp['letters'],
                    'words' => $bp['words'],
                    'grid_words' => $bp['grid_words'],
                    'grid_layout' => $bp['grid_layout'],
                    'background_color' => $bp['background_color'] ?? null,
                    'accent_color' => $bp['accent_color'] ?? null,
                    'background_image' => $bp['background_image'] ?? null,
                    'grid_style' => $bp['grid_style'] ?? 'circle',
                    'reward' => $bp['reward'] ?? 0,
                    'is_procedurally_generated' => false,
                    'procedural_tier' => null,
                ],
            );
            $n++;
        }
    }
}
