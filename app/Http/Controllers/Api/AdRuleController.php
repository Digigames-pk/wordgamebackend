<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdRuleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['rules' => AdRule::query()->orderBy('created_at')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'frequency_per_hour' => ['required', 'integer', 'min:0'],
            'allowed_hours' => ['nullable', 'array'],
            'targeting' => ['nullable', 'array'],
            'enabled' => ['boolean'],
        ]);
        $rule = AdRule::query()->create($data);

        return response()->json(['rule' => $rule], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $rule = AdRule::query()->findOrFail($id);
        $data = $request->validate([
            'frequency_per_hour' => ['sometimes', 'integer', 'min:0'],
            'allowed_hours' => ['nullable', 'array'],
            'targeting' => ['nullable', 'array'],
            'enabled' => ['boolean'],
        ]);
        $rule->update($data);

        return response()->json(['rule' => $rule->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        AdRule::query()->whereKey($id)->delete();

        return response()->json(['success' => true]);
    }
}
