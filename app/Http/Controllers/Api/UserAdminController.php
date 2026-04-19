<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserAdminController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
            ->with(['subscriptions.plan', 'deviceState'])
            ->orderBy('name')
            ->get();

        return response()->json(['users' => $users]);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::query()
            ->with(['subscriptions.plan', 'deviceState'])
            ->findOrFail($id);

        return response()->json(['user' => $user]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'is_admin' => ['boolean'],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'is_admin' => (bool) ($data['is_admin'] ?? false),
        ]);

        return response()->json([
            'user' => $user->fresh()->load(['subscriptions.plan', 'deviceState']),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);
        $auth = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'is_admin' => ['boolean'],
        ]);

        if (array_key_exists('name', $data)) {
            $user->name = $data['name'];
        }
        if (array_key_exists('email', $data)) {
            $user->email = $data['email'];
        }
        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }

        if (array_key_exists('is_admin', $data)) {
            $next = (bool) $data['is_admin'];
            if ($user->id === $auth->id && ! $next && $auth->is_admin) {
                $otherAdmins = User::query()->where('is_admin', true)->where('id', '!=', $user->id)->exists();
                if (! $otherAdmins) {
                    return response()->json(['message' => 'Cannot remove the last admin.'], 422);
                }
            }
            $user->is_admin = $next;
        }

        $user->save();

        return response()->json([
            'user' => $user->fresh()->load(['subscriptions.plan', 'deviceState']),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = User::query()->findOrFail($id);
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        if ($user->is_admin) {
            $otherAdmins = User::query()->where('is_admin', true)->where('id', '!=', $user->id)->exists();
            if (! $otherAdmins) {
                return response()->json(['message' => 'Cannot delete the last admin user.'], 422);
            }
        }

        $user->delete();

        return response()->json(['success' => true]);
    }
}
