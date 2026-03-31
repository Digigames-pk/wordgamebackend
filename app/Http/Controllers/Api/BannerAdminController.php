<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BannerAd;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BannerAdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['banners' => BannerAd::query()->orderByDesc('created_at')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'image_url' => ['required', 'string'],
            'link_url' => ['nullable', 'string'],
            'alt_text' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'position' => ['sometimes', 'string'],
            'size' => ['sometimes', 'string'],
            'weight' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'is_active' => ['boolean'],
            'is_platform_default' => ['boolean'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'max_impressions' => ['nullable', 'integer'],
            'max_clicks' => ['nullable', 'integer'],
            'cpm' => ['sometimes', 'integer'],
            'cpc' => ['sometimes', 'integer'],
        ]);
        $banner = BannerAd::query()->create($data);

        return response()->json(['banner' => $banner], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $banner = BannerAd::query()->findOrFail($id);
        $data = $request->validate([
            'image_url' => ['sometimes', 'string'],
            'link_url' => ['nullable', 'string'],
            'alt_text' => ['nullable', 'string'],
            'name' => ['nullable', 'string'],
            'position' => ['sometimes', 'string'],
            'size' => ['sometimes', 'string'],
            'weight' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'is_active' => ['boolean'],
            'is_platform_default' => ['boolean'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'max_impressions' => ['nullable', 'integer'],
            'max_clicks' => ['nullable', 'integer'],
            'cpm' => ['sometimes', 'integer'],
            'cpc' => ['sometimes', 'integer'],
        ]);
        $banner->update($data);

        return response()->json(['banner' => $banner->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        BannerAd::query()->whereKey($id)->delete();

        return response()->json(['success' => true]);
    }
}
