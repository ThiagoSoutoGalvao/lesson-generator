<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Aurora Lessons Phase 1, step 7: "Suggest one with Claude" saves an activity into a lesson-pack stage with
 * student_visible = false — unreviewed AI content must not reach a student until the teacher approves it.
 */
class SuggestedActivityTest extends TestCase
{
    use RefreshDatabase;

    private function suggest(User $teacher, array $extra = [])
    {
        return $this->actingAs($teacher)->postJson('/api/activities', $extra + [
            'name' => 'RADIANT L01 · Debate · Languages at school', 'type' => 'debate',
            'content' => ['type' => 'debate', 'statements' => [['statement' => 's', 'for' => ['f'], 'against' => ['a']]]],
            'trilha' => 'Radiant', 'trilha_lesson' => 1, 'stage' => 'production', 'student_visible' => false,
        ]);
    }

    public function test_a_suggestion_is_saved_hidden_and_students_cannot_see_it_until_approved(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student', 'trilha' => 'Radiant', 'teacher_id' => $teacher->id, 'is_active' => true]);

        $id = $this->suggest($teacher)->assertCreated()->assertJsonPath('student_visible', false)->json('id');

        $this->actingAs($student)->getJson('/api/student/lessons')->assertOk()->assertJsonMissing(['id' => $id]);
        $this->actingAs($student)->getJson("/api/student/activities/{$id}")->assertNotFound();

        $this->actingAs($teacher)->patchJson("/api/activities/{$id}", ['student_visible' => true])
            ->assertOk()->assertJsonPath('student_visible', true);

        $this->actingAs($student)->getJson("/api/student/activities/{$id}")->assertOk();
    }

    public function test_a_normal_save_stays_visible_by_default(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $this->suggest($teacher, ['student_visible' => null])->assertStatus(422);   // never null — true or false

        $id = $this->actingAs($teacher)->postJson('/api/activities', [
            'name' => 'RADIANT L01 · Quiz · x', 'type' => 'quiz', 'content' => ['type' => 'quiz', 'questions' => []],
            'trilha' => 'Radiant', 'trilha_lesson' => 1,
        ])->assertCreated()->json('id');
        $this->assertTrue((bool) \App\Models\Activity::find($id)->student_visible);
    }

    public function test_only_the_owner_can_approve(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $id = $this->suggest($teacher)->json('id');
        $this->actingAs(User::factory()->create(['role' => 'teacher']))
            ->patchJson("/api/activities/{$id}", ['student_visible' => true])->assertForbidden();
    }
}
