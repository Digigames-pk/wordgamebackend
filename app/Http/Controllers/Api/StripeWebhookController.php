<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\Stripe\StripeSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function __invoke(Request $request, StripeSettings $settings): Response
    {
        $secret = $settings->webhookSecret();
        if (! $secret) {
            return response('Webhook not configured', 503);
        }

        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        if (! $sigHeader) {
            return response('No signature', 400);
        }

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $secret);
        } catch (\Throwable $e) {
            return response('Invalid payload', 400);
        }

        try {
            match ($event->type) {
                'checkout.session.completed' => $this->handleCheckoutCompleted($event->data->object, $settings),
                'customer.subscription.updated', 'customer.subscription.deleted' => $this->handleSubscriptionChange($event->data->object, $settings),
                default => null,
            };
        } catch (\Throwable $e) {
            report($e);

            return response('Handler error', 500);
        }

        return response('ok', 200);
    }

    protected function handleCheckoutCompleted(object $session, StripeSettings $settings): void
    {
        if (($session->mode ?? null) !== 'subscription') {
            return;
        }

        $meta = $session->metadata ? $session->metadata->toArray() : [];
        $userId = $meta['user_id'] ?? null;
        $planId = $meta['subscription_plan_id'] ?? null;
        if (! $userId || ! $planId) {
            return;
        }

        $user = User::query()->find($userId);
        $plan = SubscriptionPlan::query()->find($planId);
        if (! $user || ! $plan) {
            return;
        }

        $subId = $session->subscription ?? null;
        if (! $subId) {
            return;
        }

        $stripe = new StripeClient($settings->secretKey());
        $stripeSub = $stripe->subscriptions->retrieve($subId);

        Subscription::query()->updateOrCreate(
            ['stripe_subscription_id' => $stripeSub->id],
            [
                'user_id' => $user->id,
                'subscription_plan_id' => $plan->id,
                'stripe_customer_id' => $stripeSub->customer,
                'status' => $this->mapStripeStatus($stripeSub->status),
                'current_period_end' => $stripeSub->current_period_end
                    ? \Carbon\Carbon::createFromTimestamp($stripeSub->current_period_end)
                    : null,
            ]
        );
    }

    protected function handleSubscriptionChange(object $stripeSub, StripeSettings $settings): void
    {
        $local = Subscription::query()->where('stripe_subscription_id', $stripeSub->id)->first();
        if (! $local) {
            $subMeta = $stripeSub->metadata ? $stripeSub->metadata->toArray() : [];
            $userId = $subMeta['user_id'] ?? null;
            $planId = $subMeta['subscription_plan_id'] ?? null;
            if (! $userId || ! $planId) {
                return;
            }
            $local = new Subscription([
                'user_id' => $userId,
                'subscription_plan_id' => $planId,
                'stripe_customer_id' => $stripeSub->customer,
                'stripe_subscription_id' => $stripeSub->id,
            ]);
        }

        $local->status = $this->mapStripeStatus($stripeSub->status);
        $local->stripe_customer_id = $stripeSub->customer;
        $local->current_period_end = $stripeSub->current_period_end
            ? \Carbon\Carbon::createFromTimestamp($stripeSub->current_period_end)
            : null;
        $local->save();
    }

    protected function mapStripeStatus(string $status): string
    {
        return match ($status) {
            'active', 'trialing' => 'active',
            'canceled', 'unpaid' => 'canceled',
            'past_due' => 'past_due',
            default => $status,
        };
    }
}
