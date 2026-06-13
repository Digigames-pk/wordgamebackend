<?php

namespace App\Services\Game;

class LevelNameResolver
{
    public const CYCLE_SIZE = 100;

    public function forLevel(int $levelNumber): string
    {
        if ($levelNumber < 1) {
            return config('level_names.0', 'Level');
        }

        $names = config('level_names', []);
        if ($names === []) {
            return 'Level '.$levelNumber;
        }

        $index = ($levelNumber - 1) % self::CYCLE_SIZE;
        $baseName = (string) ($names[$index] ?? 'Level '.$levelNumber);

        $cycle = intdiv($levelNumber - 1, self::CYCLE_SIZE);
        if ($cycle < 1) {
            return $baseName;
        }

        return $baseName.' '.$this->toRoman($cycle);
    }

    public function toRoman(int $number): string
    {
        if ($number < 1) {
            return '';
        }

        $map = [
            1000 => 'M', 900 => 'CM', 500 => 'D', 400 => 'CD',
            100 => 'C', 90 => 'XC', 50 => 'L', 40 => 'XL',
            10 => 'X', 9 => 'IX', 5 => 'V', 4 => 'IV', 1 => 'I',
        ];

        $result = '';
        foreach ($map as $value => $numeral) {
            while ($number >= $value) {
                $result .= $numeral;
                $number -= $value;
            }
        }

        return $result;
    }
}
