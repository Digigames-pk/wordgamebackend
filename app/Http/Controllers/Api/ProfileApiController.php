<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceState;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileApiController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('deviceState');

        return response()->json(['user' => $this->formatUser($user)]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'device_id' => ['nullable', 'string', 'max:255'],
        ]);

        if (isset($data['name'])) {
            $user->name = $data['name'];
        }
        if (isset($data['email'])) {
            $user->email = $data['email'];
        }

        if (array_key_exists('device_id', $data)) {
            $this->linkDevice($user, $data['device_id']);
        }

        $user->save();

        return response()->json(['user' => $this->formatUser($user->fresh()->load('deviceState'))]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid password.'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Account deleted.']);
    }

    /**
     * @return array<string, mixed>
     */
    protected function formatUser(User $user): array
    {
        $row = $user->toArray();
        $row['device'] = $user->deviceState;

        return $row;
    }

    protected function linkDevice(User $user, ?string $deviceId): void
    {
        if ($deviceId === null || $deviceId === '') {
            $user->device_id_key = null;

            return;
        }

        $state = DeviceState::query()->firstOrCreate(
            ['device_id' => $deviceId],
            ['last_level' => 1, 'coins' => 0],
        );

        $user->device_id_key = $state->id;
    }
}
