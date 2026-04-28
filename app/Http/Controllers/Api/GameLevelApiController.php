<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameLevel;
use App\Models\LevelBackgroundImage;
use App\Services\Game\GameLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

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

        $words = $this->normalizeWords($level->words);
        $gridWords = $this->normalizeWords($level->grid_words);
        $gridLayout = $this->normalizeGridLayout($level->grid_layout);

        return [
            'id' => $level->level_number,
            'name' => $level->name,
            'theme' => $level->theme,
            'difficulty' => $level->difficulty,
            'letters' => $level->letters,
            'words' => $words,
            'gridWords' => $gridWords,
            'gridLayout' => $gridLayout,
            'backgroundColor' => $level->background_color,
            'accentColor' => $level->accent_color,
            'backgroundImage' => $backgroundImage,
            'gridStyle' => $level->grid_style,
            'reward' => $level->reward,
        ];
    }

    /**
     * @param  mixed  $words
     * @return array<int, string>
     */
    protected function normalizeWords(mixed $words): array
    {
        $rows = is_array($words) ? $words : [];

        return array_values(array_map(function (mixed $word): string {
            $base = strtoupper((string) $word);

            return strtoupper(Str::singular($base));
        }, $rows));
    }

    /**
     * @param  mixed  $gridLayout
     * @return array<int, array<string, mixed>>
     */
    protected function normalizeGridLayout(mixed $gridLayout): array
    {
        $rows = is_array($gridLayout) ? $gridLayout : [];

        return array_map(function (mixed $row): array {
            $item = is_array($row) ? $row : [];
            if (isset($item['word'])) {
                $item['word'] = strtoupper(Str::singular((string) $item['word']));
            }

            return $item;
        }, $rows);
    }
}
