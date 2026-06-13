<?php

namespace Tests\Feature;

use App\Models\AdAsset;
use App\Models\GameLevelAdRule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameLevelAdIntervalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        AdAsset::query()->create([
            'name' => 'Test Interstitial',
            'type' => 'video',
            'format' => 'progressive',
            'asset_url' => 'https://example.com/ad.mp4',
            'duration_sec' => 15,
            'status' => 'approved',
            'is_active' => true,
            'owner_type' => 'global',
            'weight' => 5,
        ]);
    }

    public function test_level_ad_settings_includes_interval(): void
    {
        GameLevelAdRule::query()->create([
            'sort_order' => 0,
            'level_from' => 1,
            'level_to' => null,
            'level_interval' => 10,
            'ads_after_level_complete' => 1,
            'is_active' => true,
        ]);

        $this->getJson('/api/game/level-ad-settings')
            ->assertOk()
            ->assertJsonPath('rules.0.level_interval', 10);
    }

    public function test_every_level_is_eligible_when_interval_is_one(): void
    {
        GameLevelAdRule::query()->create([
            'sort_order' => 0,
            'level_from' => 1,
            'level_to' => null,
            'level_interval' => 1,
            'ads_after_level_complete' => 1,
            'is_active' => true,
        ]);

        $this->getJson('/api/game/next-ad?level=3')
            ->assertOk()
            ->assertJsonPath('eligible', true)
            ->assertJsonPath('interval_match', true);
    }

    public function test_interval_ten_only_eligible_on_multiples_of_ten(): void
    {
        GameLevelAdRule::query()->create([
            'sort_order' => 0,
            'level_from' => 1,
            'level_to' => null,
            'level_interval' => 10,
            'ads_after_level_complete' => 1,
            'is_active' => true,
        ]);

        $this->getJson('/api/game/next-ad?level=5')
            ->assertOk()
            ->assertJsonPath('eligible', false)
            ->assertJsonPath('in_range', true)
            ->assertJsonPath('interval_match', false)
            ->assertJsonPath('rule.level_interval', 10);

        $this->getJson('/api/game/next-ad?level=10')
            ->assertOk()
            ->assertJsonPath('eligible', true)
            ->assertJsonPath('interval_match', true);
    }

    public function test_interval_two_eligible_on_even_levels(): void
    {
        GameLevelAdRule::query()->create([
            'sort_order' => 0,
            'level_from' => 1,
            'level_to' => null,
            'level_interval' => 2,
            'ads_after_level_complete' => 1,
            'is_active' => true,
        ]);

        $this->getJson('/api/game/next-ad?level=3')
            ->assertOk()
            ->assertJsonPath('eligible', false)
            ->assertJsonPath('interval_match', false);

        $this->getJson('/api/game/next-ad?level=4')
            ->assertOk()
            ->assertJsonPath('eligible', true)
            ->assertJsonPath('interval_match', true);
    }

    public function test_zero_ads_after_level_is_never_eligible(): void
    {
        GameLevelAdRule::query()->create([
            'sort_order' => 0,
            'level_from' => 1,
            'level_to' => null,
            'level_interval' => 1,
            'ads_after_level_complete' => 0,
            'is_active' => true,
        ]);

        $this->getJson('/api/game/next-ad?level=1')
            ->assertOk()
            ->assertJsonPath('eligible', false)
            ->assertJsonPath('interval_match', true);
    }

    public function test_level_outside_range_is_not_eligible(): void
    {
        GameLevelAdRule::query()->create([
            'sort_order' => 0,
            'level_from' => 10,
            'level_to' => 20,
            'level_interval' => 1,
            'ads_after_level_complete' => 1,
            'is_active' => true,
        ]);

        $this->getJson('/api/game/next-ad?level=5')
            ->assertOk()
            ->assertJsonPath('eligible', false)
            ->assertJsonPath('in_range', false)
            ->assertJsonPath('rule', null);
    }
}
