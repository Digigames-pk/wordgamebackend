<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceState;
use App\Models\GameConfigEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LevelCompleteController extends Controller
{
    /**
     * Awards coins (admin "level_coins" config when set, otherwise request body)
     * and updates device + optional authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id' => ['required', 'string', 'max:255'],
            'level_cleared' => ['required', 'integer', 'min:1'],
            'coins_earned' => ['nullable', 'integer', 'min:0'],
        ]);

        $configured = GameConfigEntry::query()->where('entry_key', 'level_coins')->value('entry_value');
        $fromConfig = is_numeric($configured) ? (int) $configured : null;
        $coins = ($fromConfig !== null && $fromConfig > 0)
            ? $fromConfig
            : (int) ($data['coins_earned'] ?? 0);

        $device = DeviceState::query()->firstOrCreate(
            ['device_id' => $data['device_id']],
            ['last_level' => 1, 'coins' => 0],
        );

        $device->coins = max(0, $device->coins + $coins);
        $device->last_level = max($device->last_level, $data['level_cleared']);
        $device->save();

        $user = $request->user();
        if ($user) {
            $user->coins_earned = max(0, $user->coins_earned + $coins);
            $user->save();
        }

        return response()->json([
            'coins_awarded' => $coins,
            'device_state' => $device->fresh(),
            'user' => $user?->fresh(),
        ]);
    }
}
