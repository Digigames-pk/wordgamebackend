<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameLevelAdRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameLevelAdRuleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'rules' => GameLevelAdRule::query()->orderBy('sort_order')->orderBy('level_from')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'level_from' => ['required', 'integer', 'min:1'],
            'level_to' => ['nullable', 'integer', 'min:1'],
            'ads_after_level_complete' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);
        $rule = GameLevelAdRule::query()->create($data);

        return response()->json(['rule' => $rule], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $rule = GameLevelAdRule::query()->findOrFail($id);
        $data = $request->validate([
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'level_from' => ['sometimes', 'integer', 'min:1'],
            'level_to' => ['nullable', 'integer', 'min:1'],
            'ads_after_level_complete' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);
        $rule->update($data);

        return response()->json(['rule' => $rule->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        GameLevelAdRule::query()->whereKey($id)->delete();

        return response()->json(['success' => true]);
    }
}
