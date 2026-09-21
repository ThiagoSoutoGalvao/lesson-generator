<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** A teacher moving a student to another trilha must change what the student's server-side lists return at once. */
class ChangeStudentTrilhaTest extends TestCase
{
    use RefreshDatabase;

    public function test_changing_the_trilha_changes_the_students_lessons_and_me(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student', 'trilha' => 'Lights', 'teacher_id' => $teacher->id, 'is_active' => true]);

        Activity::create(['user_id' => $teacher->id, 'name' => 'Lights one', 'type' => 'quiz', 'content' => ['questions' => []], 'trilha' => 'Lights', 'trilha_lesson' => 1]);
        Activity::create(['user_id' => $teacher->id, 'name' => 'Glow one', 'type' => 'quiz', 'content' => ['questions' => []], 'trilha' => 'Glow', 'trilha_lesson' => 1]);

        $names = fn () => collect($this->actingAs($student->fresh())->getJson('/api/student/lessons')->assertOk()->json('lessons'))->flatten(1)->pluck('name')->all();

        $this->assertSame(['Lights one'], $names());
        $this->actingAs($student)->getJson('/api/me')->assertJson(['trilha' => 'Lights']);

        $this->actingAs($teacher)->patchJson("/api/students/{$student->id}", ['trilha' => 'Glow'])->assertOk()->assertJson(['trilha' => 'Glow']);

        $this->assertSame(['Glow one'], $names());
        $this->actingAs($student->fresh())->getJson('/api/me')->assertJson(['trilha' => 'Glow']);
    }
}
