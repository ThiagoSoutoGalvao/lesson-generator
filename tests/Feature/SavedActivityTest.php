<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SavedActivityTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_trilha_activity_is_saved_with_its_trilha_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/activities', [
            'name'          => 'LIGHTS L03 · Quiz · Present continuous & everyday verbs',
            'type'          => 'quiz',
            'content'       => ['type' => 'quiz', 'questions' => []],
            'trilha'        => 'Lights',
            'trilha_lesson' => 3,
            'built_by'      => 'Fernando',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('activities', [
            'user_id'       => $user->id,
            'trilha'        => 'Lights',
            'trilha_lesson' => 3,
            'built_by'      => 'Fernando',
        ]);
    }

    public function test_trilha_must_be_one_of_the_three_tracks(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/activities', [
            'name'    => 'x',
            'type'    => 'quiz',
            'content' => ['type' => 'quiz'],
            'trilha'  => 'Sparkle',
        ])->assertJsonValidationErrors('trilha');
    }

    public function test_a_freeform_activity_still_saves_without_trilha_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/activities', [
            'name'    => 'Random experiment',
            'type'    => 'flashcards',
            'content' => ['type' => 'flashcards', 'cards' => []],
            'folder'  => 'Scratch',
        ])->assertCreated();

        $this->assertDatabaseHas('activities', [
            'name'   => 'Random experiment',
            'folder' => 'Scratch',
            'trilha' => null,
        ]);
    }

    public function test_the_library_only_returns_the_current_users_activities(): void
    {
        $me    = User::factory()->create();
        $other = User::factory()->create();

        Activity::create(['user_id' => $me->id,    'name' => 'Mine',   'type' => 'quiz', 'content' => []]);
        Activity::create(['user_id' => $other->id, 'name' => 'Theirs', 'type' => 'quiz', 'content' => []]);

        $this->actingAs($me)->getJson('/api/activities')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment(['name' => 'Mine']);
    }
}
