<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Advertiser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdvertiserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['advertisers' => Advertiser::query()->orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string'],
            'contact_name' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);
        $adv = Advertiser::query()->create($data);

        return response()->json(['advertiser' => $adv], 201);
    }

    public function show(string $id): JsonResponse
    {
        $adv = Advertiser::query()->with('adAssets')->findOrFail($id);

        return response()->json(['advertiser' => $adv]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $adv = Advertiser::query()->findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'company_name' => ['nullable', 'string'],
            'contact_name' => ['nullable', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);
        $adv->update($data);

        return response()->json(['advertiser' => $adv->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        Advertiser::query()->whereKey($id)->delete();

        return response()->json(['success' => true]);
    }

    public function report(Request $request, string $id): JsonResponse
    {
        $adv = Advertiser::query()->findOrFail($id);
        $assets = $adv->adAssets;
        $totals = [
            'impressions' => $assets->sum('impression_count'),
            'clicks' => $assets->sum('click_count'),
            'completions' => $assets->sum('completion_count'),
        ];

        return response()->json([
            'advertiser' => $adv,
            'assets' => $assets,
            'totals' => $totals,
        ]);
    }

    public function export(Request $request, string $id): StreamedResponse
    {
        $adv = Advertiser::query()->with('adAssets')->findOrFail($id);

        $filename = 'advertiser-report-'.preg_replace('/[^a-z0-9-]/i', '-', $adv->name).'.csv';

        return response()->streamDownload(function () use ($adv) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Advertiser Report', $adv->name]);
            fputcsv($out, ['Ad Name', 'Impressions', 'Clicks', 'Completions']);
            foreach ($adv->adAssets as $a) {
                fputcsv($out, [$a->name, $a->impression_count, $a->click_count, $a->completion_count]);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }
}
