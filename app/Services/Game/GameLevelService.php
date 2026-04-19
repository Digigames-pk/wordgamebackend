<?php

namespace App\Services\Game;

use App\Models\GameLevel;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class GameLevelService
{
    public function __construct(
        protected ProceduralLevelGenerator $generator,
    ) {}

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
