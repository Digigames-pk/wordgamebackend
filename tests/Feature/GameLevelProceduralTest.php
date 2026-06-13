<?php

namespace Tests\Feature;

use App\Models\GameLevel;
use Database\Seeders\DefaultGameLevelsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameLevelProceduralTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DefaultGameLevelsSeeder::class);
    }

    public function test_level_one_is_seeded_static_content(): void
    {
        $expectedWords = config('game_level_blueprints.0.words');

        $this->getJson('/api/game/level/1')
            ->assertOk()
            ->assertJsonPath('level.id', 1)
            ->assertJsonPath('level.words', $expectedWords);
    }

    public function test_level_eleven_generates_distinct_words_and_persists(): void
    {
        $levelOneWords = config('game_level_blueprints.0.words');

        $this->assertNull(GameLevel::query()->where('level_number', 11)->first());

        $first = $this->getJson('/api/game/level/11')->assertOk()->json('level');
        $this->assertSame(11, $first['id']);
        $this->assertNotSame($levelOneWords, $first['words']);

        $row = GameLevel::query()->where('level_number', 11)->first();
        $this->assertNotNull($row);
        $this->assertTrue($row->is_procedurally_generated);
        $this->assertSame(1, $row->procedural_tier);

        $second = $this->getJson('/api/game/level/11')->assertOk()->json('level');
        $this->assertSame($first['words'], $second['words']);
    }

    public function test_level_twelve_differs_from_eleven(): void
    {
        $a = $this->getJson('/api/game/level/11')->json('level.words');
        $b = $this->getJson('/api/game/level/12')->json('level.words');
        $this->assertNotEquals($a, $b);
    }

    public function test_levels_paginated_returns_ten_per_page(): void
    {
        $response = $this->getJson('/api/game/levels?page=1')
            ->assertOk()
            ->assertJsonStructure([
                'levels',
                'pagination' => ['page', 'per_page', 'from_level', 'to_level', 'count', 'has_more'],
            ]);

        $this->assertCount(10, $response->json('levels'));
        $this->assertSame(1, $response->json('pagination.page'));
        $this->assertSame(10, $response->json('pagination.per_page'));
        $this->assertSame(1, $response->json('pagination.from_level'));
        $this->assertSame(10, $response->json('pagination.to_level'));
        $this->assertSame(1, $response->json('levels.0.id'));
        $this->assertSame(10, $response->json('levels.9.id'));
    }

    public function test_levels_page_two_generates_procedural_levels(): void
    {
        $this->assertNull(GameLevel::query()->where('level_number', 11)->first());

        $response = $this->getJson('/api/game/levels?page=2')->assertOk();

        $this->assertCount(10, $response->json('levels'));
        $this->assertSame(11, $response->json('pagination.from_level'));
        $this->assertSame(20, $response->json('pagination.to_level'));
        $this->assertSame(11, $response->json('levels.0.id'));
        $this->assertNotNull(GameLevel::query()->where('level_number', 11)->first());
        $this->assertNotNull(GameLevel::query()->where('level_number', 20)->first());
    }

    public function test_levels_bulk_by_range(): void
    {
        $response = $this->getJson('/api/game/levels?from=9&to=12')->assertOk();

        $this->assertCount(4, $response->json('levels'));
        $this->assertSame(9, $response->json('bulk.from'));
        $this->assertSame(12, $response->json('bulk.to'));
        $this->assertSame([9, 10, 11, 12], array_column($response->json('levels'), 'id'));
    }

    public function test_levels_bulk_by_list(): void
    {
        $response = $this->getJson('/api/game/levels?levels=1,11,12')->assertOk();

        $this->assertCount(3, $response->json('levels'));
        $this->assertSame([1, 11, 12], $response->json('bulk.level_numbers'));
    }
}
