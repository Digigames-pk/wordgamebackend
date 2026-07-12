<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Subscription\IapSubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionIapController extends Controller
{
    public function confirm(Request $request, IapSubscriptionService $iap): JsonResponse
    {
        $data = $request->validate([
            'device_id' => ['required', 'string', 'max:255'],
            'subscription_plan_id' => ['nullable', 'integer', 'exists:subscription_plans,id'],
            'product_id' => ['nullable', 'string', 'max:255'],
            'transaction_id' => ['required', 'string', 'max:255'],
            'receipt' => ['nullable', 'string'],
            'platform' => ['nullable', 'string', 'in:ios,android'],
        ]);

        if (empty($data['subscription_plan_id']) && empty($data['product_id'])) {
            return response()->json([
                'message' => 'Either subscription_plan_id or product_id is required.',
            ], 422);
        }

        $status = $iap->confirm($request->user(), $data['device_id'], $data);

        return response()->json([
            'success' => true,
            'message' => 'Purchase recorded.',
            ...$status,
        ]);
    }

    public function restore(Request $request, IapSubscriptionService $iap): JsonResponse
    {
        $data = $request->validate([
            'device_id' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', 'in:ios,android'],
            'purchases' => ['required', 'array', 'min:1'],
            'purchases.*.transaction_id' => ['nullable', 'string', 'max:255'],
            'purchases.*.transactionId' => ['nullable', 'string', 'max:255'],
            'purchases.*.product_id' => ['nullable', 'string', 'max:255'],
            'purchases.*.productId' => ['nullable', 'string', 'max:255'],
            'purchases.*.sku' => ['nullable', 'string', 'max:255'],
        ]);

        $status = $iap->restore(
            $request->user(),
            $data['device_id'],
            $data['purchases'],
            $data['platform'] ?? 'ios',
        );

        return response()->json([
            'success' => (bool) ($status['active'] ?? false),
            'restored' => (bool) ($status['active'] ?? false),
            ...$status,
        ]);
    }

    public function status(Request $request, IapSubscriptionService $iap): JsonResponse
    {
        $data = $request->validate([
            'device_id' => ['nullable', 'string', 'max:255'],
        ]);

        return response()->json(
            $iap->status($request->user(), $data['device_id'] ?? null),
        );
    }
}
