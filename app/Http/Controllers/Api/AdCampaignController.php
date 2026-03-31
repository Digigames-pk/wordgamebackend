<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdCampaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdCampaignController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['campaigns' => AdCampaign::query()->orderByDesc('created_at')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'budget' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'string'],
            'target_languages' => ['nullable', 'array'],
        ]);
        $campaign = AdCampaign::query()->create($data);

        return response()->json(['campaign' => $campaign], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $campaign = AdCampaign::query()->findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date'],
            'budget' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', 'string'],
            'target_languages' => ['nullable', 'array'],
        ]);
        $campaign->update($data);

        return response()->json(['campaign' => $campaign->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        AdCampaign::query()->whereKey($id)->delete();

        return response()->json(['success' => true]);
    }
}
