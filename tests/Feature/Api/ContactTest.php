<?php

namespace Tests\Feature\Api;

use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_submit_contact_form(): void
    {
        $response = $this->postJson('/api/contact', [
            'name' => 'Jane Player',
            'email' => 'jane@example.com',
            'subject' => 'Help',
            'message' => 'I need help with level 5.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('contact_message.name', 'Jane Player');

        $this->assertDatabaseHas('contact_messages', [
            'email' => 'jane@example.com',
            'status' => 'new',
            'user_id' => null,
        ]);
    }

    public function test_authenticated_user_contact_links_user_id(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/contact', [
            'name' => $user->name,
            'email' => $user->email,
            'message' => 'Account question.',
        ])->assertCreated();

        $this->assertDatabaseHas('contact_messages', [
            'user_id' => $user->id,
            'message' => 'Account question.',
        ]);
    }

    public function test_contact_requires_name_email_and_message(): void
    {
        $this->postJson('/api/contact', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'message']);

        $this->assertSame(0, ContactMessage::query()->count());
    }
}
