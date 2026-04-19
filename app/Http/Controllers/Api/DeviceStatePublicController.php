<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceState;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceStatePublicController extends Controller
{
    /**
     * Public endpoint: upsert progress row keyed by device_id.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id' => ['required', 'string', 'max:255'],
            'last_level' => ['required', 'integer', 'min:1'],
            'coins' => ['required', 'integer', 'min:0'],
        ]);

        $row = DeviceState::query()->updateOrCreate(
            ['device_id' => $data['device_id']],
            [
                'last_level' => $data['last_level'],
                'coins' => $data['coins'],
            ],
        );

        return response()->json(['device_state' => $row], 201);
    }
}
