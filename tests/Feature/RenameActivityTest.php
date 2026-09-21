<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RenameActivityTest extends TestCase
{
    use RefreshDatabase;

    private function activityOf(User $owner, array $extra = []): Activity
    {
        return Activity::create($extra + [
            'user_id' => $owner->id, 'name' => 'IrregularVerbsA1', 'type' => 'quiz',
            'content' => ['type' => 'quiz', 'questions' => [['question' => 'Q ']]],
            'trilha' => 'Lights', 'trilha_lesson' => 3, 'built_by' => 'Fernando',
        ]);
    }

    public function test_a_teacher_can_rename_their_own_activity(): void
    {
        $teacher  = User::factory()->create(['role' => 'teacher']);
        $activity = $this->activityOf($teacher);

        $this->actingAs($teacher)->patchJson("/api/activities/{$activity->id}", ['name' => 'LIGHTS L03 · Quiz · Irregular verbs'])
            ->assertOk()->assertJson(['name' => 'LIGHTS L03 · Quiz · Irregular verbs']);

        $this->assertSame('LIGHTS L03 · Quiz · Irregular verbs', $activity->fresh()->name);
    }

    public function test_only_the_name_changes(): void
    {
        $teacher  = User::factory()->create(['role' => 'teacher']);
        $activity = $this->activityOf($teacher);
        $before   = $activity->only(['type', 'content', 'trilha', 'trilha_lesson', 'built_by', 'user_id']);

        $this->actingAs($teacher)->patchJson("/api/activities/{$activity->id}", [
            'name' => 'New name', 'trilha' => 'Glow', 'trilha_lesson' => 8, 'type' => 'flashcards', 'user_id' => 999, 'content' => ['x' => 1],
        ])->assertOk();

        $this->assertEquals($before, $activity->fresh()->only(array_keys($before)));   // Q's trailing space kept, nothing else moved
    }

    public function test_whitespace_and_invisible_characters_are_tidied(): void
    {
        $teacher  = User::factory()->create(['role' => 'teacher']);
        $activity = $this->activityOf($teacher);

        $this->actingAs($teacher)->patchJson("/api/activities/{$activity->id}", ['name' => "  Past\u{00A0}\u{00A0}simple \u{200B}  vs   present  "])->assertOk();

        $this->assertSame('Past simple vs present', $activity->fresh()->name);
    }

    public function test_a_teacher_cannot_rename_someone_elses_activity(): void
    {
        $owner    = User::factory()->create(['role' => 'teacher']);
        $activity = $this->activityOf($owner);

        $this->actingAs(User::factory()->create(['role' => 'teacher']))->patchJson("/api/activities/{$activity->id}", ['name' => 'Mine now'])->assertForbidden();

        $this->assertSame('IrregularVerbsA1', $activity->fresh()->name);
    }

    public function test_a_student_cannot_rename(): void
    {
        $teacher  = User::factory()->create(['role' => 'teacher']);
        $activity = $this->activityOf($teacher);
        $student  = User::factory()->create(['role' => 'student', 'trilha' => 'Lights', 'is_active' => true, 'teacher_id' => $teacher->id]);

        $this->actingAs($student)->patchJson("/api/activities/{$activity->id}", ['name' => 'Hacked'])->assertForbidden();

        $this->assertSame('IrregularVerbsA1', $activity->fresh()->name);
    }

    public function test_an_empty_or_missing_name_is_refused(): void
    {
        $teacher  = User::factory()->create(['role' => 'teacher']);
        $activity = $this->activityOf($teacher);

        $this->actingAs($teacher)->patchJson("/api/activities/{$activity->id}", [])->assertStatus(422);
        $this->actingAs($teacher)->patchJson("/api/activities/{$activity->id}", ['name' => '   '])->assertStatus(422);
        $this->actingAs($teacher)->patchJson("/api/activities/{$activity->id}", ['name' => "\u{200B}"])->assertStatus(422);
        $this->actingAs($teacher)->patchJson("/api/activities/{$activity->id}", ['name' => str_repeat('x', 256)])->assertStatus(422);

        $this->assertSame('IrregularVerbsA1', $activity->fresh()->name);
    }
}
