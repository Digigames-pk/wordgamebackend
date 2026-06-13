<?php

namespace Tests\Unit;

use App\Services\Game\LevelNameResolver;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LevelNameResolverTest extends TestCase
{
    private LevelNameResolver $resolver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resolver = new LevelNameResolver;
    }

    public function test_level_one_is_christmas_eve(): void
    {
        $this->assertSame('Christmas Eve', $this->resolver->forLevel(1));
    }

    public function test_level_ten_is_jingle_bells(): void
    {
        $this->assertSame('Jingle Bells', $this->resolver->forLevel(10));
    }

    public function test_level_fifty_is_christmas_kingdom(): void
    {
        $this->assertSame('Christmas Kingdom', $this->resolver->forLevel(50));
    }

    public function test_level_one_hundred_has_no_suffix(): void
    {
        $this->assertSame('The North Pole Throne', $this->resolver->forLevel(100));
    }

    public function test_level_one_hundred_one_restarts_cycle_with_roman_one(): void
    {
        $this->assertSame('Christmas Eve I', $this->resolver->forLevel(101));
    }

    public function test_level_two_hundred_one_restarts_cycle_with_roman_two(): void
    {
        $this->assertSame('Christmas Eve II', $this->resolver->forLevel(201));
    }

    #[DataProvider('romanNumeralProvider')]
    public function test_to_roman(int $number, string $expected): void
    {
        $this->assertSame($expected, $this->resolver->toRoman($number));
    }

    public static function romanNumeralProvider(): array
    {
        return [
            [1, 'I'],
            [2, 'II'],
            [4, 'IV'],
            [9, 'IX'],
            [10, 'X'],
            [40, 'XL'],
            [90, 'XC'],
        ];
    }
}
