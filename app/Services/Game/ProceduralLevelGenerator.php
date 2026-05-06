<?php

namespace App\Services\Game;

use Illuminate\Support\Str;

/**
 * Builds levels 11+ from blueprint geometry (levels 1–10) filled with unique
 * dictionary words. Higher tiers bias toward later (harder) pool entries and
 * higher rank labels. Rows are persisted by GameLevelService on first request.
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
        $templateIndex = $this->stableIndex($levelNumber + 17, count($blueprints));
        $bp = $blueprints[$templateIndex];

        $excluded = $this->blueprintWordSetUpper();
        $templateWords = array_map(static fn (mixed $w): string => strtoupper((string) $w), $bp['words'] ?? []);

        $chosen = [];
        foreach ($templateWords as $slot => $templateWord) {
            $length = strlen($templateWord);
            $chosen[] = $this->pickWord(
                $length,
                $levelNumber,
                $slot,
                $tier,
                $chosen,
                $excluded,
            );
        }

        $words = array_map(fn (string $w): string => $this->normalizeSingularUpper($w), $chosen);
        $gridWords = $words;

        $gridLayout = $this->remapGridLayout($bp['grid_layout'] ?? [], $words);

        $letters = $this->lettersFromWords($words);

        $difficulty = $this->difficultyForTier($tier);
        $reward = (int) ($bp['reward'] ?? 50) + (int) round($tier * 42 + sqrt($tier) * 10);

        $themes = ['christmas_eve', 'winter', 'santa', 'aurora', 'candy'];
        $theme = $themes[$this->stableIndex($levelNumber + 3, count($themes))];

        return [
            'level_number' => $levelNumber,
            'name' => $bp['name'].' — '.$this->rankLabel($tier),
            'theme' => $theme,
            'difficulty' => $difficulty,
            'letters' => $letters,
            'words' => $words,
            'grid_words' => $gridWords,
            'grid_layout' => $gridLayout,
            'background_color' => $bp['background_color'] ?? '#0B1A0D',
            'accent_color' => $bp['accent_color'] ?? '#2E7D32',
            'background_image' => $bp['background_image'] ?? null,
            'grid_style' => $bp['grid_style'] ?? 'circle',
            'reward' => $reward,
            'is_procedurally_generated' => true,
            'procedural_tier' => $tier,
        ];
    }

    /**
     * @param  array<int, string>  $alreadyChosen
     * @param  array<string, true>  $excluded
     */
    protected function pickWord(
        int $length,
        int $levelNumber,
        int $slot,
        int $tier,
        array $alreadyChosen,
        array $excluded,
    ): string {
        $pools = config('procedural_word_pools', []);
        $raw = $pools[$length] ?? [];
        $pool = [];
        foreach ($raw as $word) {
            $u = strtoupper((string) $word);
            if (strlen($u) !== $length) {
                continue;
            }
            $norm = $this->normalizeSingularUpper($u);
            if (strlen($norm) !== $length) {
                continue;
            }
            if (isset($excluded[$norm])) {
                continue;
            }
            $pool[] = $norm;
        }

        $pool = array_values(array_unique($pool));
        if ($pool === []) {
            throw new \RuntimeException("Procedural word pool empty for length {$length} after exclusions.");
        }

        $usedUpper = array_map(fn (string $w): string => $this->normalizeSingularUpper($w), $alreadyChosen);

        $bias = $this->poolBiasStart($tier, count($pool));
        $rotated = array_merge(array_slice($pool, $bias), array_slice($pool, 0, $bias));

        $start = $this->stableHash($levelNumber, $slot, $tier, $length) % count($rotated);

        for ($t = 0, $n = count($rotated); $t < $n; $t++) {
            $candidate = $rotated[($start + $t) % $n];
            if (! in_array($candidate, $usedUpper, true)) {
                return $candidate;
            }
        }

        return $rotated[$start % count($rotated)];
    }

    /**
     * @param  array<int, mixed>  $gridLayout
     * @param  array<int, string>  $wordsInOrder
     * @return array<int, array<string, mixed>>
     */
    protected function remapGridLayout(array $gridLayout, array $wordsInOrder): array
    {
        $i = 0;

        return array_map(function (mixed $row) use (&$i, $wordsInOrder): array {
            $item = is_array($row) ? $row : [];
            if (isset($item['word'], $wordsInOrder[$i])) {
                $item['word'] = $wordsInOrder[$i];
                $i++;
            }

            return $item;
        }, $gridLayout);
    }

    /**
     * @param  array<int, string>  $words
     * @return array<int, string>
     */
    protected function lettersFromWords(array $words): array
    {
        $maxPerLetter = [];
        foreach ($words as $word) {
            $counts = array_count_values(str_split($word));
            foreach ($counts as $letter => $cnt) {
                $maxPerLetter[$letter] = max($maxPerLetter[$letter] ?? 0, $cnt);
            }
        }
        ksort($maxPerLetter);
        $letters = [];
        foreach ($maxPerLetter as $letter => $cnt) {
            for ($j = 0; $j < $cnt; $j++) {
                $letters[] = $letter;
            }
        }

        return $letters;
    }

    /**
     * @return array<string, true>
     */
    protected function blueprintWordSetUpper(): array
    {
        $blueprints = config('game_level_blueprints', []);
        $out = [];
        foreach ($blueprints as $bp) {
            foreach (['words', 'grid_words'] as $key) {
                $list = $bp[$key] ?? [];
                if (! is_array($list)) {
                    continue;
                }
                foreach ($list as $w) {
                    $norm = $this->normalizeSingularUpper(strtoupper((string) $w));
                    $out[$norm] = true;
                }
            }
        }

        return $out;
    }

    protected function normalizeSingularUpper(string $word): string
    {
        return strtoupper(Str::singular($word));
    }

    protected function poolBiasStart(int $tier, int $poolCount): int
    {
        if ($poolCount <= 2) {
            return 0;
        }

        $ratio = min(0.78, $tier / ($tier + 14));

        return (int) floor($poolCount * $ratio);
    }

    protected function stableHash(int|string ...$parts): int
    {
        return crc32(implode('|', array_map(static fn (int|string $p): string => (string) $p, $parts))) & 0x7FFFFFFF;
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
        if ($tier <= 30) {
            return 'Grandmaster';
        }
        if ($tier <= 50) {
            return 'Grandmaster II';
        }

        return 'Grandmaster III';
    }
}
