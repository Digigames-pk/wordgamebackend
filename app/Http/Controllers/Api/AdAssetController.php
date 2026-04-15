<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdAnalyticsEvent;
use App\Models\AdAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdAssetController extends Controller
{
    /** Max ~200 MiB for direct multipart uploads (also raise PHP upload_max_filesize / post_max_size on the server). */
    public const MULTIPART_MAX_KB = 204800;

    public function index(): JsonResponse
    {
        $assets = AdAsset::query()->orderByDesc('created_at')->get();

        return response()->json(['assets' => $assets]);
    }

    public function withAnalytics(): JsonResponse
    {
        $assets = AdAsset::query()->orderByDesc('created_at')->get()->map(function (AdAsset $asset) {
            $impressions = $asset->impression_count ?? 0;
            $clicks = $asset->click_count ?? 0;
            $completions = $asset->completion_count ?? 0;

            return [
                ...$asset->toArray(),
                'ctr' => $impressions > 0 ? round(($clicks / $impressions) * 100, 2) : 0,
                'completionRate' => $impressions > 0 ? round(($completions / $impressions) * 100, 2) : 0,
            ];
        });

        return response()->json(['assets' => $assets]);
    }

    public function storeJson(Request $request): JsonResponse
    {
        $data = $this->validatedAsset($request, creating: true);
        $data = $this->normalizeBannerAssetUrls($data, creating: true);
        $data['owner_type'] = 'global';
        if (($data['status'] ?? 'pending') !== 'rejected') {
            $data['status'] = 'approved';
        }

        $asset = AdAsset::query()->create($data);

        return response()->json(['asset' => $asset], 201);
    }

    public function storeMultipart(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:'.self::MULTIPART_MAX_KB],
        ]);

        $data = $this->validatedAsset($request, creating: true);
        $data['owner_type'] = 'global';

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $folder = str_starts_with((string) $file->getMimeType(), 'video/') ? 'ad-videos' : 'ad-audio';
            $disk = $this->adStorageDisk();
            $path = Storage::disk($disk)->putFile("{$folder}/global", $file, 'public');
            $url = $this->storagePublicUrl($disk, $path);
            if (str_starts_with((string) $file->getMimeType(), 'video/')) {
                $data['video_url'] = $url;
                $data['asset_url'] = $url;
            } else {
                $data['asset_url'] = $url;
            }
        }

        $data['status'] = 'approved';
        $asset = AdAsset::query()->create($data);

        return response()->json(['asset' => $asset], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $asset = AdAsset::query()->findOrFail($id);
        $data = $this->validatedAsset($request, creating: false);
        $data = $this->normalizeBannerAssetUrls($data, creating: false);
        unset($data['owner_type']);

        if ($request->hasFile('file')) {
            $request->validate([
                'file' => ['required', 'file', 'max:'.self::MULTIPART_MAX_KB],
            ]);
            $file = $request->file('file');
            $folder = str_starts_with((string) $file->getMimeType(), 'video/') ? 'ad-videos' : 'ad-audio';
            $disk = $this->adStorageDisk();
            $path = Storage::disk($disk)->putFile("{$folder}/global", $file, 'public');
            $url = $this->storagePublicUrl($disk, $path);
            if (str_starts_with((string) $file->getMimeType(), 'video/')) {
                $data['video_url'] = $url;
                $data['asset_url'] = $url;
            } else {
                $data['asset_url'] = $url;
            }
        }

        $asset->update($data);

        return response()->json(['asset' => $asset->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        AdAsset::query()->whereKey($id)->delete();

        return response()->json(['success' => true]);
    }

    public function toggle(string $id): JsonResponse
    {
        $asset = AdAsset::query()->findOrFail($id);
        $asset->status = $asset->status === 'approved' ? 'paused' : 'approved';
        $asset->save();

        return response()->json(['asset' => $asset->fresh()]);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
        ]);
        $asset = AdAsset::query()->findOrFail($id);
        $asset->update(['status' => $data['status']]);

        return response()->json(['asset' => $asset->fresh()]);
    }

    public function analytics(string $id): JsonResponse
    {
        $asset = AdAsset::query()->findOrFail($id);
        $events = $asset->analyticsEvents()
            ->orderByDesc('recorded_at')
            ->limit(500)
            ->get();

        return response()->json(['analytics' => $events]);
    }

    public function locations(Request $request, string $id): JsonResponse
    {
        AdAsset::query()->findOrFail($id);
        $eventType = $request->query('eventType');

        $q = AdAnalyticsEvent::query()->where('ad_asset_id', $id);
        if ($eventType) {
            $q->where('event_type', $eventType);
        }

        $rows = $q->selectRaw('country, country_code, region, city, COUNT(*) as c')
            ->groupBy('country', 'country_code', 'region', 'city')
            ->get();

        return response()->json(['locations' => $rows]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatedAsset(Request $request, bool $creating): array
    {
        $rules = [
            'advertiser_id' => ['nullable', 'uuid', 'exists:advertisers,id'],
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:500'],
            'type' => [$creating ? 'required' : 'sometimes', 'string', 'max:50'],
            'format' => ['sometimes', 'string', 'max:50'],
            'placement_type' => ['sometimes', 'string', 'max:50'],
            'asset_url' => ['sometimes', 'nullable', 'string'],
            'video_url' => ['sometimes', 'nullable', 'string'],
            'thumbnail_url' => ['sometimes', 'nullable', 'string'],
            'aspect_ratio' => ['sometimes', 'nullable', 'string'],
            'duration_sec' => ['sometimes', 'integer', 'min:0'],
            'skip_after_sec' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_skippable' => ['sometimes', 'boolean'],
            'click_through_url' => ['sometimes', 'nullable', 'string'],
            'metadata' => ['sometimes', 'nullable', 'array'],
            'status' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'frequency_per_hour' => ['sometimes', 'nullable', 'integer'],
            'frequency_per_listener' => ['sometimes', 'nullable', 'integer'],
            'frequency_per_show' => ['sometimes', 'nullable', 'integer'],
            'duration_limit' => ['sometimes', 'nullable', 'integer'],
            'time_slots' => ['sometimes', 'nullable', 'array'],
            'banner_position' => ['sometimes', 'nullable', 'string'],
            'banner_size' => ['sometimes', 'nullable', 'string'],
            'external_ad_code' => ['sometimes', 'nullable', 'string'],
            'display_timing' => ['sometimes', 'nullable', 'array'],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'end_date' => ['sometimes', 'nullable', 'date'],
            'max_impressions' => ['sometimes', 'nullable', 'integer'],
            'max_clicks' => ['sometimes', 'nullable', 'integer'],
            'vast_tag_url' => ['sometimes', 'nullable', 'string'],
            'vmap_tag_url' => ['sometimes', 'nullable', 'string'],
            'weight' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'geo_countries' => ['sometimes', 'nullable', 'array'],
            'geo_states' => ['sometimes', 'nullable', 'array'],
            'geo_cities' => ['sometimes', 'nullable', 'array'],
            'geo_exclude_countries' => ['sometimes', 'nullable', 'array'],
            'geo_exclude_states' => ['sometimes', 'nullable', 'array'],
            'geo_exclude_cities' => ['sometimes', 'nullable', 'array'],
            'cpm' => ['sometimes', 'integer', 'min:0'],
            'cpc' => ['sometimes', 'integer', 'min:0'],
        ];

        $payload = $request->validate($rules);

        if ($creating) {
            if (! empty($payload['vast_tag_url']) || ! empty($payload['vmap_tag_url'])) {
                $payload['asset_url'] = $payload['asset_url'] ?? 'programmatic://vast-vmap-ad';
            }
        }

        return $payload;
    }

    /**
     * Use Wasabi when configured so uploads and public URLs from Storage are consistent.
     */
    protected function adStorageDisk(): string
    {
        if ($this->wasabiConfigured()) {
            return 'wasabi';
        }

        return config('filesystems.default') === 'local' ? 'public' : (string) config('filesystems.default');
    }

    protected function wasabiConfigured(): bool
    {
        $w = config('filesystems.disks.wasabi');

        return is_array($w)
            && filled($w['bucket'] ?? null)
            && filled($w['key'] ?? null)
            && filled($w['secret'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function normalizeBannerAssetUrls(array $data, bool $creating): array
    {
        $isBanner = in_array($data['format'] ?? null, ['banner'], true)
            || in_array($data['type'] ?? null, ['display', 'banner'], true);

        if (! $isBanner || ! filled($data['asset_url'] ?? null)) {
            return $data;
        }

        $original = (string) $data['asset_url'];
        if (! preg_match('#^https?://#i', $original)) {
            return $data;
        }

        $stored = $this->storeRemoteBannerImage($original);
        if ($stored !== null) {
            $data['asset_url'] = $stored;

            return $data;
        }

        // If the provided URL is not an image, treat it as click-through link.
        if (! filled($data['click_through_url'] ?? null)) {
            $data['click_through_url'] = $original;
        }

        if ($creating) {
            unset($data['asset_url']);
        }

        return $data;
    }

    protected function storeRemoteBannerImage(string $url): ?string
    {
        try {
            $response = Http::timeout(15)->withHeaders([
                'User-Agent' => 'GameAppBackend/1.0',
            ])->get($url);
        } catch (\Throwable) {
            return null;
        }

        if (! $response->ok()) {
            return null;
        }

        $contentType = strtolower((string) $response->header('Content-Type', ''));
        if (! str_starts_with($contentType, 'image/')) {
            return null;
        }

        $body = $response->body();
        if ($body === '') {
            return null;
        }

        $extension = $this->extensionFromContentType($contentType) ?? pathinfo(parse_url($url, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION);
        $extension = $extension !== '' ? strtolower($extension) : 'bin';
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = 'ad-banners/global/'.$filename;

        $disk = $this->adStorageDisk();
        $stored = Storage::disk($disk)->put($path, $body, 'public');
        if (! $stored) {
            return null;
        }

        return $this->storagePublicUrl($disk, $path);
    }

    protected function extensionFromContentType(string $contentType): ?string
    {
        return match (true) {
            str_contains($contentType, 'image/jpeg') => 'jpg',
            str_contains($contentType, 'image/png') => 'png',
            str_contains($contentType, 'image/webp') => 'webp',
            str_contains($contentType, 'image/gif') => 'gif',
            str_contains($contentType, 'image/svg+xml') => 'svg',
            str_contains($contentType, 'image/bmp') => 'bmp',
            default => null,
        };
    }

    protected function storagePublicUrl(string $disk, string $path): string
    {
        /** @var \Illuminate\Filesystem\FilesystemAdapter $filesystem */
        $filesystem = Storage::disk($disk);

        return $filesystem->url($path);
    }
}
