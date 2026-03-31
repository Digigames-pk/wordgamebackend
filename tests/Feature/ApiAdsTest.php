<?php

namespace Tests\Feature;

use App\Models\AdAsset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiAdsTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_next_video_returns_json(): void
    {
        $response = $this->getJson('/api/ads/next-video');

        $response->assertOk()
            ->assertJsonStructure(['ad', 'adsDisabled']);
    }

    public function test_ad_event_validation(): void
    {
        $response = $this->postJson('/api/analytics/ad-event', []);

        $response->assertStatus(422);
    }

    public function test_admin_assets_requires_authentication(): void
    {
        $this->getJson('/api/ads/assets')->assertUnauthorized();
    }

    public function test_admin_assets_allows_admin(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/ads/assets')->assertOk();
    }

    public function test_player_cannot_access_admin_assets(): void
    {
        $player = User::factory()->create(['is_admin' => false]);

        Sanctum::actingAs($player);

        $this->getJson('/api/ads/assets')->assertForbidden();
    }

    public function test_subscription_plans_public(): void
    {
        $this->getJson('/api/subscription/plans')->assertOk()->assertJsonStructure(['plans']);
    }

    public function test_game_level_settings_public(): void
    {
        $this->getJson('/api/game/level-ad-settings')->assertOk()->assertJsonStructure(['rules']);
    }

    public function test_ad_free_user_gets_no_ad(): void
    {
        $plan = \App\Models\SubscriptionPlan::query()->create([
            'name' => 'Test',
            'description' => null,
            'interval' => 'month',
            'amount' => 100,
            'currency' => 'usd',
            'removes_ads' => true,
            'is_active' => true,
            'stripe_product_id' => null,
            'stripe_price_id' => null,
        ]);

        $user = User::factory()->create(['is_admin' => false]);
        \App\Models\Subscription::query()->create([
            'user_id' => $user->id,
            'subscription_plan_id' => $plan->id,
            'stripe_customer_id' => 'cus_test',
            'stripe_subscription_id' => 'sub_test',
            'status' => 'active',
            'current_period_end' => now()->addMonth(),
        ]);

        $token = $user->createToken('t')->plainTextToken;

        AdAsset::query()->create([
            'name' => 'Ad',
            'type' => 'video',
            'format' => 'video',
            'asset_url' => 'https://example.com/v.mp4',
            'video_url' => 'https://example.com/v.mp4',
            'duration_sec' => 10,
            'status' => 'approved',
            'owner_type' => 'global',
        ]);

        $response = $this->withToken($token)->getJson('/api/ads/next-video');

        $response->assertOk()
            ->assertJson(['adsDisabled' => true, 'ad' => null]);
    }
}
