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
        $this->getJson('/api/game/level/1')
            ->assertOk()
            ->assertJsonPath('level.id', 1)
            ->assertJsonPath('level.words', ['CAT', 'ACT', 'SAT']);
    }

    public function test_level_eleven_generates_distinct_words_and_persists(): void
    {
        $this->assertNull(GameLevel::query()->where('level_number', 11)->first());

        $first = $this->getJson('/api/game/level/11')->assertOk()->json('level');
        $this->assertSame(11, $first['id']);
        $this->assertNotSame(['CAT', 'ACT', 'SAT'], $first['words']);

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
}
