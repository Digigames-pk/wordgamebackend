<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_delete_account_with_valid_password(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->deleteJson('/api/profile', [
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Account deleted.');

        $this->assertNull($user->fresh());
    }

    public function test_delete_account_requires_correct_password(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->deleteJson('/api/profile', [
            'password' => 'wrong-password',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Invalid password.');

        $this->assertNotNull($user->fresh());
    }

    public function test_delete_account_requires_authentication(): void
    {
        $this->deleteJson('/api/profile', [
            'password' => 'password',
        ])->assertUnauthorized();
    }
}
