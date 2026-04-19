<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameConfigEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GameConfigAdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'configs' => GameConfigEntry::query()->orderBy('entry_key')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'entry_key' => ['required', 'string', 'max:255', 'unique:game_config_entries,entry_key'],
            'entry_value' => ['nullable', 'string'],
        ]);
        $row = GameConfigEntry::query()->create($data);

        return response()->json(['config' => $row], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = GameConfigEntry::query()->findOrFail($id);
        $data = $request->validate([
            'entry_key' => ['sometimes', 'string', 'max:255', Rule::unique('game_config_entries', 'entry_key')->ignore($id)],
            'entry_value' => ['nullable', 'string'],
        ]);
        $row->update($data);

        return response()->json(['config' => $row->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        GameConfigEntry::query()->whereKey($id)->delete();

        return response()->json(['success' => true]);
    }
}
