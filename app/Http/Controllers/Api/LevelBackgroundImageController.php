<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LevelBackgroundImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LevelBackgroundImageController extends Controller
{
    /** Max ~20 MiB for background image uploads. */
    public const MULTIPART_MAX_KB = 20480;

    public function index(): JsonResponse
    {
        $rows = LevelBackgroundImage::query()->orderBy('sort_order')->orderByDesc('id')->get();

        return response()->json(['images' => $rows]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['sometimes', 'file', 'image', 'max:'.self::MULTIPART_MAX_KB],
        ]);

        $data = $request->validate([
            'image_url' => ['nullable', 'string'],
            'title' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $disk = $this->storageDisk();
            $path = Storage::disk($disk)->putFile('level-backgrounds/global', $file, 'public');
            $data['image_url'] = Storage::disk($disk)->url($path);
        }

        if (! filled($data['image_url'] ?? null)) {
            return response()->json(['message' => 'image_url or file is required'], 422);
        }

        $row = LevelBackgroundImage::query()->create($data);

        return response()->json(['image' => $row], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $row = LevelBackgroundImage::query()->findOrFail($id);
        $request->validate([
            'file' => ['sometimes', 'file', 'image', 'max:'.self::MULTIPART_MAX_KB],
        ]);
        $data = $request->validate([
            'image_url' => ['sometimes', 'string'],
            'title' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $disk = $this->storageDisk();
            $path = Storage::disk($disk)->putFile('level-backgrounds/global', $file, 'public');
            $data['image_url'] = Storage::disk($disk)->url($path);
        }

        $row->update($data);

        return response()->json(['image' => $row->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        LevelBackgroundImage::query()->whereKey($id)->delete();

        return response()->json(['success' => true]);
    }

    protected function storageDisk(): string
    {
        $wasabi = config('filesystems.disks.wasabi');
        $hasWasabi = is_array($wasabi)
            && filled($wasabi['bucket'] ?? null)
            && filled($wasabi['key'] ?? null)
            && filled($wasabi['secret'] ?? null);

        if ($hasWasabi) {
            return 'wasabi';
        }

        return config('filesystems.default') === 'local' ? 'public' : (string) config('filesystems.default');
    }
}
