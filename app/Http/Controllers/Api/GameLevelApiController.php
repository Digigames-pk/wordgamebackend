<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameLevel;
use App\Models\LevelBackgroundImage;
use App\Services\Game\GameLevelService;
use Illuminate\Http\JsonResponse;

class GameLevelApiController extends Controller
{
    public function __construct(
        protected GameLevelService $levels,
    ) {}

    public function show(int $level): JsonResponse
    {
        $model = GameLevel::query()->where('level_number', $level)->first();
        if (! $model) {
            abort_unless($level > 10, 404, 'Level not found. Run database seeders for static levels.');
            $model = $this->levels->resolveLevel($level);
        }

        return response()->json(['level' => $this->toClientPayload($model)]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function toClientPayload(GameLevel $level): array
    {
        $bg = LevelBackgroundImage::query()
            ->where('is_active', true)
            ->inRandomOrder()
            ->value('image_url');

        $backgroundImage = $bg ?: $level->background_image;

        return [
            'id' => $level->level_number,
            'name' => $level->name,
            'theme' => $level->theme,
            'difficulty' => $level->difficulty,
            'letters' => $level->letters,
            'words' => $level->words,
            'gridWords' => $level->grid_words,
            'gridLayout' => $level->grid_layout,
            'backgroundColor' => $level->background_color,
            'accentColor' => $level->accent_color,
            'backgroundImage' => $backgroundImage,
            'gridStyle' => $level->grid_style,
            'reward' => $level->reward,
        ];
    }
}
