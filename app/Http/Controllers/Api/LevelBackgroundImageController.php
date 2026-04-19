<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LevelBackgroundImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LevelBackgroundImageController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = LevelBackgroundImage::query()->orderBy('sort_order')->orderByDesc('id')->get();

        return response()->json(['images' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'image_url' => ['required', 'string'],
            'title' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $row = LevelBackgroundImage::query()->create($data);

        return response()->json(['image' => $row], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = LevelBackgroundImage::query()->findOrFail($id);
        $data = $request->validate([
            'image_url' => ['sometimes', 'string'],
            'title' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $row->update($data);

        return response()->json(['image' => $row->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        LevelBackgroundImage::query()->whereKey($id)->delete();

        return response()->json(['success' => true]);
    }
}
