<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Services\Stripe\SubscriptionPlanStripeSync;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionPlanController extends Controller
{
    public function publicPlans(): JsonResponse
    {
        $plans = SubscriptionPlan::query()
            ->where('is_active', true)
            ->orderBy('amount')
            ->get()
            ->map(fn (SubscriptionPlan $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'description' => $p->description,
                'interval' => $p->interval,
                'amount' => $p->amount,
                'currency' => $p->currency,
                'removes_ads' => $p->removes_ads,
                'coins' => $p->coins ?? 0,
                'apple_product_id' => $p->apple_product_id,
            ]);

        return response()->json(['plans' => $plans]);
    }

    public function adminIndex(): JsonResponse
    {
        return response()->json(['plans' => SubscriptionPlan::query()->orderBy('name')->get()]);
    }

    public function store(Request $request, SubscriptionPlanStripeSync $sync): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'interval' => ['required', 'string', 'in:month,year'],
            'amount' => ['required', 'integer', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'removes_ads' => ['boolean'],
            'coins' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'apple_product_id' => ['nullable', 'string', 'max:255'],
        ]);

        $data['coins'] = (int) ($data['coins'] ?? 0);
        $plan = SubscriptionPlan::query()->create($data);

        try {
            $sync->syncPlan($plan->fresh());
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage(), 'plan' => $plan], 422);
        }

        return response()->json(['plan' => $plan->fresh()], 201);
    }

    public function update(Request $request, string $id, SubscriptionPlanStripeSync $sync): JsonResponse
    {
        $plan = SubscriptionPlan::query()->findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'interval' => ['sometimes', 'string', 'in:month,year'],
            'amount' => ['sometimes', 'integer', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'removes_ads' => ['boolean'],
            'coins' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'apple_product_id' => ['nullable', 'string', 'max:255'],
        ]);
        $plan->update($data);

        try {
            $sync->syncPlan($plan->fresh());
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage(), 'plan' => $plan], 422);
        }

        return response()->json(['plan' => $plan->fresh()]);
    }

    public function destroy(string $id): JsonResponse
    {
        SubscriptionPlan::query()->whereKey($id)->delete();

        return response()->json(['success' => true]);
    }
}
