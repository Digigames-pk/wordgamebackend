<?php

namespace App\Services\Subscription;

use App\Models\DeviceState;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Support\Carbon;

class IapSubscriptionService
{
    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function confirm(?User $user, string $deviceId, array $data): array
    {
        $plan = $this->resolvePlan(
            $data['product_id'] ?? null,
            isset($data['subscription_plan_id']) ? (int) $data['subscription_plan_id'] : null,
        );

        $transactionId = (string) $data['transaction_id'];
        $platform = (string) ($data['platform'] ?? 'ios');
        $productId = (string) ($data['product_id'] ?? $plan->apple_product_id ?? '');

        $device = DeviceState::query()->firstOrCreate(
            ['device_id' => $deviceId],
            ['last_level' => 1, 'coins' => 0],
        );

        if ($device->iap_transaction_id === $transactionId) {
            return $this->formatStatusFromDevice($device->fresh('subscriptionPlan'), 'device');
        }

        $device->fill([
            'subscription_plan_id' => $plan->id,
            'iap_product_id' => $productId,
            'iap_transaction_id' => $transactionId,
            'iap_platform' => $platform,
            'iap_purchased_at' => now(),
        ])->save();

        if ($user) {
            $this->upsertUserSubscription($user, $plan, $transactionId, $productId, $platform);
            $this->linkDeviceToUser($user, $device);
        }

        return $this->formatStatusFromPlan($plan, 'device', $device->fresh());
    }

    /**
     * @param  array<int, array<string, mixed>>  $purchases
     * @return array<string, mixed>
     */
    public function restore(?User $user, string $deviceId, array $purchases, string $platform = 'ios'): array
    {
        if ($purchases === []) {
            return $this->inactiveStatus();
        }

        $latest = null;
        foreach ($purchases as $purchase) {
            $transactionId = (string) ($purchase['transaction_id'] ?? $purchase['transactionId'] ?? '');
            $productId = (string) ($purchase['product_id'] ?? $purchase['productId'] ?? $purchase['sku'] ?? '');
            if ($transactionId === '' || $productId === '') {
                continue;
            }

            $latest = $this->confirm($user, $deviceId, [
                'transaction_id' => $transactionId,
                'product_id' => $productId,
                'platform' => $platform,
            ]);
        }

        return $latest ?? $this->inactiveStatus();
    }

    public function status(?User $user, ?string $deviceId): array
    {
        if ($user) {
            $sub = $user->subscriptions()
                ->where('status', 'active')
                ->with('plan')
                ->latest()
                ->first();

            if ($sub?->plan?->removes_ads) {
                return $this->formatStatusFromPlan($sub->plan, 'user', null, $sub);
            }
        }

        if ($deviceId) {
            $device = DeviceState::query()
                ->with('subscriptionPlan')
                ->where('device_id', $deviceId)
                ->first();

            if ($device?->subscriptionPlan?->removes_ads) {
                return $this->formatStatusFromDevice($device, 'device');
            }
        }

        if ($user?->deviceState?->subscriptionPlan?->removes_ads) {
            return $this->formatStatusFromDevice($user->deviceState->loadMissing('subscriptionPlan'), 'device');
        }

        return $this->inactiveStatus();
    }

    public function attachDeviceEntitlementToUser(User $user, DeviceState $device): void
    {
        if (! $device->subscription_plan_id || ! $device->iap_transaction_id) {
            $this->linkDeviceToUser($user, $device);

            return;
        }

        $plan = $device->subscriptionPlan;
        if (! $plan) {
            $this->linkDeviceToUser($user, $device);

            return;
        }

        $this->upsertUserSubscription(
            $user,
            $plan,
            (string) $device->iap_transaction_id,
            (string) ($device->iap_product_id ?? $plan->apple_product_id ?? ''),
            (string) ($device->iap_platform ?? 'ios'),
            $device->iap_purchased_at,
        );
        $this->linkDeviceToUser($user, $device);
    }

    protected function resolvePlan(?string $productId, ?int $subscriptionPlanId): SubscriptionPlan
    {
        if ($subscriptionPlanId) {
            $byId = SubscriptionPlan::query()
                ->whereKey($subscriptionPlanId)
                ->where('is_active', true)
                ->first();
            if ($byId) {
                return $byId;
            }
        }

        if ($productId) {
            $byProduct = SubscriptionPlan::query()
                ->where('apple_product_id', $productId)
                ->where('is_active', true)
                ->first();
            if ($byProduct) {
                return $byProduct;
            }
        }

        abort(422, 'Unknown subscription product.');
    }

    protected function upsertUserSubscription(
        User $user,
        SubscriptionPlan $plan,
        string $transactionId,
        string $productId,
        string $platform,
        ?Carbon $purchasedAt = null,
    ): Subscription {
        $existing = Subscription::query()
            ->where('iap_transaction_id', $transactionId)
            ->first();

        if ($existing) {
            return $existing;
        }

        return Subscription::query()->updateOrCreate(
            ['iap_transaction_id' => $transactionId],
            [
                'user_id' => $user->id,
                'subscription_plan_id' => $plan->id,
                'iap_product_id' => $productId,
                'platform' => $platform,
                'status' => 'active',
                'current_period_end' => null,
            ],
        );
    }

    protected function linkDeviceToUser(User $user, DeviceState $device): void
    {
        if ($user->device_id_key !== $device->id) {
            $user->device_id_key = $device->id;
            $user->save();
        }
    }

  /**
     * @return array<string, mixed>
     */
    protected function formatStatusFromPlan(
        SubscriptionPlan $plan,
        string $source,
        ?DeviceState $device = null,
        ?Subscription $subscription = null,
    ): array {
        return [
            'active' => true,
            'status' => 'active',
            'removes_ads' => (bool) $plan->removes_ads,
            'ads_disabled' => (bool) $plan->removes_ads,
            'plan_id' => $plan->id,
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'coins' => $plan->coins ?? 0,
                'removes_ads' => (bool) $plan->removes_ads,
                'apple_product_id' => $plan->apple_product_id,
            ],
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'plan_id' => $subscription->subscription_plan_id,
                'status' => $subscription->status,
            ] : null,
            'coins' => $plan->coins ?? 0,
            'source' => $source,
            'device_id' => $device?->device_id,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function formatStatusFromDevice(DeviceState $device, string $source): array
    {
        $plan = $device->subscriptionPlan;
        if (! $plan) {
            return $this->inactiveStatus();
        }

        return $this->formatStatusFromPlan($plan, $source, $device);
    }

    /**
     * @return array<string, mixed>
     */
    protected function inactiveStatus(): array
    {
        return [
            'active' => false,
            'status' => 'inactive',
            'removes_ads' => false,
            'ads_disabled' => false,
            'plan_id' => null,
            'plan' => null,
            'subscription' => null,
            'coins' => 0,
            'source' => null,
        ];
    }
}
