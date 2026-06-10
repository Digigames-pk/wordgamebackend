<?php

namespace App\Services\Game;

use App\Models\GameLevel;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class GameLevelService
{
    public const PER_PAGE = 10;

    public const MAX_BULK_COUNT = 100;

    public function __construct(
        protected ProceduralLevelGenerator $generator,
    ) {}

    public function getOrCreate(int $levelNumber): GameLevel
    {
        $existing = GameLevel::query()->where('level_number', $levelNumber)->first();
        if ($existing) {
            return $existing;
        }

        if ($levelNumber <= 10) {
            abort(404, 'Level not found. Run database seeders.');
        }

        return $this->resolveLevel($levelNumber);
    }

    /**
     * @return array<int, GameLevel>
     */
    public function getOrCreateRange(int $from, int $to): array
    {
        $from = max(1, $from);
        $to = max($from, $to);
        if ($to - $from + 1 > self::MAX_BULK_COUNT) {
            abort(422, 'Too many levels requested. Maximum is '.self::MAX_BULK_COUNT.'.');
        }

        $existing = GameLevel::query()
            ->whereBetween('level_number', [$from, $to])
            ->orderBy('level_number')
            ->get()
            ->keyBy('level_number');

        $levels = [];
        for ($n = $from; $n <= $to; $n++) {
            $levels[] = $existing->get($n) ?? $this->getOrCreate($n);
        }

        return $levels;
    }

    /**
     * @param  array<int, int>  $levelNumbers
     * @return array<int, GameLevel>
     */
    public function getOrCreateMany(array $levelNumbers): array
    {
        $numbers = array_values(array_unique(array_map('intval', $levelNumbers)));
        sort($numbers, SORT_NUMERIC);
        $numbers = array_values(array_filter($numbers, fn (int $n): bool => $n >= 1));

        if ($numbers === []) {
            abort(422, 'No valid level numbers provided.');
        }

        if (count($numbers) > self::MAX_BULK_COUNT) {
            abort(422, 'Too many levels requested. Maximum is '.self::MAX_BULK_COUNT.'.');
        }

        $existing = GameLevel::query()
            ->whereIn('level_number', $numbers)
            ->get()
            ->keyBy('level_number');

        $levels = [];
        foreach ($numbers as $n) {
            $levels[] = $existing->get($n) ?? $this->getOrCreate($n);
        }

        return $levels;
    }

    public function resolveLevel(int $levelNumber): GameLevel
    {
        if ($levelNumber < 1) {
            abort(422, 'Invalid level.');
        }

        $existing = GameLevel::query()->where('level_number', $levelNumber)->first();
        if ($existing) {
            return $existing;
        }

        if ($levelNumber <= 10) {
            abort(404, 'Level not found. Run database seeders.');
        }

        return DB::transaction(function () use ($levelNumber) {
            $again = GameLevel::query()->where('level_number', $levelNumber)->first();
            if ($again) {
                return $again;
            }

            $attrs = $this->generator->build($levelNumber);

            try {
                return GameLevel::query()->create($attrs);
            } catch (UniqueConstraintViolationException) {
                return GameLevel::query()->where('level_number', $levelNumber)->firstOrFail();
            }
        });
    }
}
