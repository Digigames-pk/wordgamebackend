<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameLevel;
use App\Models\LevelBackgroundImage;
use App\Services\Game\GameLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GameLevelApiController extends Controller
{
    public function __construct(
        protected GameLevelService $levels,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1'],
            'from' => ['sometimes', 'integer', 'min:1'],
            'to' => ['sometimes', 'integer', 'min:1'],
            'levels' => ['sometimes', 'string', 'max:2000'],
        ]);

        $perPage = GameLevelService::PER_PAGE;

        if (isset($data['levels'])) {
            $numbers = $this->parseLevelList($data['levels']);
            $models = $this->levels->getOrCreateMany($numbers);

            return response()->json([
                'levels' => $this->toClientPayloadMany($models),
                'bulk' => [
                    'level_numbers' => array_map(fn (GameLevel $l) => $l->level_number, $models),
                    'count' => count($models),
                ],
            ]);
        }

        if (isset($data['from']) || isset($data['to'])) {
            $from = (int) ($data['from'] ?? $data['to']);
            $to = (int) ($data['to'] ?? $data['from']);
            if ($to < $from) {
                [$from, $to] = [$to, $from];
            }
            $models = $this->levels->getOrCreateRange($from, $to);

            return response()->json([
                'levels' => $this->toClientPayloadMany($models),
                'bulk' => [
                    'from' => $from,
                    'to' => $to,
                    'count' => count($models),
                ],
            ]);
        }

        $page = (int) ($data['page'] ?? 1);
        $from = ($page - 1) * $perPage + 1;
        $to = $page * $perPage;
        $models = $this->levels->getOrCreateRange($from, $to);

        return response()->json([
            'levels' => $this->toClientPayloadMany($models),
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'from_level' => $from,
                'to_level' => $to,
                'count' => count($models),
                'has_more' => true,
            ],
        ]);
    }

    public function show(int $level): JsonResponse
    {
        $model = $this->levels->getOrCreate($level);

        return response()->json(['level' => $this->toClientPayload($model)]);
    }

    /**
     * @return array<int, int>
     */
    protected function parseLevelList(string $levels): array
    {
        $parts = preg_split('/[\s,]+/', $levels, -1, PREG_SPLIT_NO_EMPTY);
        if ($parts === false || $parts === []) {
            abort(422, 'Invalid levels list.');
        }

        $numbers = [];
        foreach ($parts as $part) {
            if (! ctype_digit($part)) {
                abort(422, 'Levels must be comma-separated positive integers.');
            }
            $numbers[] = (int) $part;
        }

        return $numbers;
    }

    /**
     * @param  array<int, GameLevel>  $levels
     * @return array<int, array<string, mixed>>
     */
    protected function toClientPayloadMany(array $levels): array
    {
        return array_map(fn (GameLevel $level): array => $this->toClientPayload($level), $levels);
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
