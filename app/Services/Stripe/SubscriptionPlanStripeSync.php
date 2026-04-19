<?php

namespace App\Services\Stripe;

use App\Models\SubscriptionPlan;
use Stripe\Exception\ApiErrorException;
use Stripe\StripeClient;

class SubscriptionPlanStripeSync
{
    public function __construct(
        protected StripeSettings $settings
    ) {}

    public function client(): StripeClient
    {
        $secret = $this->settings->secretKey();
        if (! $secret) {
            throw new \RuntimeException('Stripe is not configured.');
        }

        return new StripeClient($secret);
    }

    /**
     * @throws ApiErrorException
     */
    public function syncPlan(SubscriptionPlan $plan): void
    {
        $stripe = $this->client();

        if (! $plan->stripe_product_id) {
            $product = $stripe->products->create([
                'name' => $plan->name,
                'description' => $plan->description,
                'metadata' => [
                    'subscription_plan_id' => (string) $plan->id,
                    'coins' => (string) ($plan->coins ?? 0),
                ],
            ]);
            $plan->stripe_product_id = $product->id;
            $plan->save();
        } else {
            $stripe->products->update($plan->stripe_product_id, [
                'name' => $plan->name,
                'description' => $plan->description,
                'metadata' => [
                    'subscription_plan_id' => (string) $plan->id,
                    'coins' => (string) ($plan->coins ?? 0),
                ],
            ]);
        }

        $interval = $plan->interval === 'year' ? 'year' : 'month';

        if ($plan->stripe_price_id) {
            $stripe->prices->update($plan->stripe_price_id, ['active' => false]);
        }

        $price = $stripe->prices->create([
            'product' => $plan->stripe_product_id,
            'unit_amount' => $plan->amount,
            'currency' => strtolower($plan->currency),
            'recurring' => ['interval' => $interval],
            'metadata' => ['subscription_plan_id' => (string) $plan->id],
        ]);

        $plan->stripe_price_id = $price->id;
        $plan->save();
    }
}
