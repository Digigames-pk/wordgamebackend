<?php

namespace Tests\Feature\Api;

use App\Models\DeviceState;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionIapTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_confirm_iap_purchase_without_account(): void
    {
        $plan = SubscriptionPlan::query()->create([
            'name' => 'Pro',
            'description' => null,
            'interval' => 'month',
            'amount' => 999,
            'currency' => 'usd',
            'removes_ads' => true,
            'is_active' => true,
            'coins' => 1000,
            'apple_product_id' => 'com.wordgridarena.app.pro.monthly',
            'stripe_product_id' => null,
            'stripe_price_id' => null,
        ]);

        $this->postJson('/api/subscription/iap/confirm', [
            'device_id' => 'guest-device-1',
            'product_id' => $plan->apple_product_id,
            'transaction_id' => 'txn-guest-1',
            'platform' => 'ios',
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('removes_ads', true)
            ->assertJsonPath('plan_id', $plan->id)
            ->assertJsonPath('source', 'device');

        $this->assertDatabaseHas('device_states', [
            'device_id' => 'guest-device-1',
            'iap_transaction_id' => 'txn-guest-1',
            'subscription_plan_id' => $plan->id,
        ]);
    }

    public function test_guest_can_read_subscription_status_by_device_id(): void
    {
        $plan = SubscriptionPlan::query()->create([
            'name' => 'Pro',
            'description' => null,
            'interval' => 'month',
            'amount' => 999,
            'currency' => 'usd',
            'removes_ads' => true,
            'is_active' => true,
            'coins' => 1000,
            'apple_product_id' => 'com.wordgridarena.app.pro.monthly',
            'stripe_product_id' => null,
            'stripe_price_id' => null,
        ]);

        DeviceState::query()->create([
            'device_id' => 'guest-device-2',
            'last_level' => 1,
            'coins' => 0,
            'subscription_plan_id' => $plan->id,
            'iap_product_id' => $plan->apple_product_id,
            'iap_transaction_id' => 'txn-guest-2',
            'iap_platform' => 'ios',
            'iap_purchased_at' => now(),
        ]);

        $this->getJson('/api/subscription/status?device_id=guest-device-2')
            ->assertOk()
            ->assertJsonPath('active', true)
            ->assertJsonPath('ads_disabled', true)
            ->assertJsonPath('plan_id', $plan->id);
    }

    public function test_guest_can_restore_iap_purchases_without_account(): void
    {
        $plan = SubscriptionPlan::query()->create([
            'name' => 'Pro',
            'description' => null,
            'interval' => 'month',
            'amount' => 999,
            'currency' => 'usd',
            'removes_ads' => true,
            'is_active' => true,
            'coins' => 1000,
            'apple_product_id' => 'com.wordgridarena.app.pro.monthly',
            'stripe_product_id' => null,
            'stripe_price_id' => null,
        ]);

        $this->postJson('/api/subscription/iap/restore', [
            'device_id' => 'guest-device-3',
            'platform' => 'ios',
            'purchases' => [
                [
                    'product_id' => $plan->apple_product_id,
                    'transaction_id' => 'txn-restore-1',
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('restored', true)
            ->assertJsonPath('removes_ads', true);

        $this->assertDatabaseHas('device_states', [
            'device_id' => 'guest-device-3',
            'iap_transaction_id' => 'txn-restore-1',
        ]);
    }

    public function test_authenticated_user_confirm_also_creates_user_subscription(): void
    {
        $plan = SubscriptionPlan::query()->create([
            'name' => 'Pro',
            'description' => null,
            'interval' => 'month',
            'amount' => 999,
            'currency' => 'usd',
            'removes_ads' => true,
            'is_active' => true,
            'coins' => 1000,
            'apple_product_id' => 'com.wordgridarena.app.pro.monthly',
            'stripe_product_id' => null,
            'stripe_price_id' => null,
        ]);

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/subscription/iap/confirm', [
            'device_id' => 'auth-device-1',
            'product_id' => $plan->apple_product_id,
            'transaction_id' => 'txn-auth-1',
            'platform' => 'ios',
        ])
            ->assertOk()
            ->assertJsonPath('source', 'device');

        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $user->id,
            'iap_transaction_id' => 'txn-auth-1',
            'status' => 'active',
        ]);
    }
}
