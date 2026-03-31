<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\Stripe\StripeSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\StripeClient;

class SubscriptionCheckoutController extends Controller
{
    public function checkout(Request $request, StripeSettings $settings): JsonResponse
    {
        if (! $settings->configured()) {
            return response()->json(['message' => 'Stripe is not configured.'], 503);
        }

        $data = $request->validate([
            'subscription_plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
            'success_url' => ['required', 'url'],
            'cancel_url' => ['required', 'url'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $plan = SubscriptionPlan::query()->whereKey($data['subscription_plan_id'])->where('is_active', true)->firstOrFail();

        if (! $plan->stripe_price_id) {
            return response()->json(['message' => 'Plan is not synced with Stripe.'], 422);
        }

        $stripe = new StripeClient($settings->secretKey());

        if (! $user->stripe_customer_id) {
            $customer = $stripe->customers->create([
                'email' => $user->email,
                'name' => $user->name,
                'metadata' => ['user_id' => (string) $user->id],
            ]);
            $user->stripe_customer_id = $customer->id;
            $user->save();
        }

        $session = $stripe->checkout->sessions->create([
            'mode' => 'subscription',
            'customer' => $user->stripe_customer_id,
            'line_items' => [
                [
                    'price' => $plan->stripe_price_id,
                    'quantity' => 1,
                ],
            ],
            'success_url' => $data['success_url'].'?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $data['cancel_url'],
            'metadata' => [
                'user_id' => (string) $user->id,
                'subscription_plan_id' => (string) $plan->id,
            ],
            'subscription_data' => [
                'metadata' => [
                    'user_id' => (string) $user->id,
                    'subscription_plan_id' => (string) $plan->id,
                ],
            ],
        ]);

        return response()->json([
            'session_id' => $session->id,
            'url' => $session->url,
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $sub = $user->subscriptions()->where('status', 'active')->with('plan')->latest()->first();

        if (! $sub) {
            return response()->json([
                'active' => false,
                'removes_ads' => false,
            ]);
        }

        $plan = $sub->plan;

        return response()->json([
            'active' => true,
            'status' => $sub->status,
            'renews_at' => $sub->current_period_end,
            'removes_ads' => $plan?->removes_ads ?? false,
            'plan' => $plan,
        ]);
    }

    public function portal(Request $request, StripeSettings $settings): JsonResponse
    {
        if (! $settings->configured()) {
            return response()->json(['message' => 'Stripe is not configured.'], 503);
        }

        $data = $request->validate([
            'return_url' => ['required', 'url'],
        ]);

        /** @var User $user */
        $user = $request->user();
        if (! $user->stripe_customer_id) {
            return response()->json(['message' => 'No billing account.'], 422);
        }

        $stripe = new StripeClient($settings->secretKey());
        $session = $stripe->billingPortal->sessions->create([
            'customer' => $user->stripe_customer_id,
            'return_url' => $data['return_url'],
        ]);

        return response()->json(['url' => $session->url]);
    }
}
