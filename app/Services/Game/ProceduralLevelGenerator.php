<?php

namespace App\Services\Game;

/**
 * Generates levels with id > 10 from deterministic blueprints so the first
 * request persists a row and later requests reuse the stored puzzle.
 *
 * Difficulty escalates past the static tier-10 "Expert" cap using ranked labels.
 */
class ProceduralLevelGenerator
{
    /**
     * @return array<string, mixed> GameLevel fillable attributes (includes level_number)
     */
    public function build(int $levelNumber): array
    {
        if ($levelNumber <= 10) {
            throw new \InvalidArgumentException('Use seeded rows for levels 1–10.');
        }

        $blueprints = config('game_level_blueprints', []);
        if ($blueprints === []) {
            throw new \RuntimeException('game_level_blueprints config is empty.');
        }

        $tier = $levelNumber - 10;
        $index = $this->stableIndex($levelNumber, count($blueprints));
        $bp = $blueprints[$index];

        $difficulty = $this->difficultyForTier($tier);
        $reward = (int) ($bp['reward'] ?? 50) + (int) round($tier * 42 + sqrt($tier) * 10);

        $themes = ['christmas_eve', 'winter', 'santa', 'aurora', 'candy'];
        $theme = $themes[$this->stableIndex($levelNumber + 3, count($themes))];

        return [
            'level_number' => $levelNumber,
            'name' => $bp['name'].' — '.$this->rankLabel($tier),
            'theme' => $theme,
            'difficulty' => $difficulty,
            'letters' => $bp['letters'],
            'words' => $bp['words'],
            'grid_words' => $bp['grid_words'],
            'grid_layout' => $bp['grid_layout'],
            'background_color' => $bp['background_color'] ?? '#0B1A0D',
            'accent_color' => $bp['accent_color'] ?? '#2E7D32',
            'background_image' => $bp['background_image'] ?? null,
            'grid_style' => $bp['grid_style'] ?? 'circle',
            'reward' => $reward,
            'is_procedurally_generated' => true,
            'procedural_tier' => $tier,
        ];
    }

    protected function stableIndex(int $seed, int $modulus): int
    {
        if ($modulus <= 0) {
            return 0;
        }

        return (int) (($seed * 1_103_515_245 + 12_345) % $modulus);
    }

    protected function rankLabel(int $tier): string
    {
        return match (true) {
            $tier <= 3 => 'Rank I',
            $tier <= 8 => 'Rank II',
            $tier <= 15 => 'Rank III',
            default => 'Rank '.(int) ceil($tier / 5),
        };
    }

    protected function difficultyForTier(int $tier): string
    {
        if ($tier <= 1) {
            return 'Expert';
        }
        if ($tier <= 4) {
            return 'Expert II';
        }
        if ($tier <= 9) {
            return 'Expert III';
        }
        if ($tier <= 16) {
            return 'Master';
        }

        return 'Grandmaster';
    }
}
