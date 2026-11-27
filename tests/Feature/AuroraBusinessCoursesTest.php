<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\Trilhas;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Aurora Business (AuroraBusiness.md): the three modules are courses like Lights / Glow / Radiant —
 * activities can be saved into all 16 units, students can be put on them and see their activities.
 */
class AuroraBusinessCoursesTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_activity_can_be_saved_into_any_unit_of_a_business_module(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        foreach (['FirstSteps', 'EverydayBusiness', 'TakeTheLead'] as $course) {
            $this->actingAs($teacher)->postJson('/api/activities', [
                'name' => 'X L16C · Quiz · y', 'type' => 'quiz', 'content' => ['type' => 'quiz', 'questions' => []],
                'trilha' => $course, 'trilha_lesson' => 16, 'trilha_part' => 'C',
            ])->assertCreated()->assertJsonPath('trilha', $course);
        }

        $this->actingAs($teacher)->postJson('/api/activities', [
            'name' => 'x', 'type' => 'quiz', 'content' => ['type' => 'quiz', 'questions' => []], 'trilha' => 'Business',
        ])->assertStatus(422);
    }

    public function test_a_student_on_first_steps_sees_its_activities(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $studentId = $this->actingAs($teacher)->postJson('/api/students', [
            'name' => 'QA Group Student', 'email' => 'qa-fs@example.test', 'trilha' => 'FirstSteps', 'password' => 'first-steps-1',
        ])->assertSuccessful()->json('id');
        $student = User::findOrFail($studentId);
        $this->assertSame('FirstSteps', $student->trilha);

        $id = $this->actingAs($teacher)->postJson('/api/activities', [
            'name' => "FIRST STEPS L01B · Quiz · Hello, I'm", 'type' => 'quiz', 'content' => ['type' => 'quiz', 'questions' => []],
            'trilha' => 'FirstSteps', 'trilha_lesson' => 1, 'trilha_part' => 'B',
        ])->assertCreated()->json('id');

        // 1B opens once the teacher marks it as taught (TaughtUpTo, 2026-11-28); a new student has 1A only.
        $this->actingAs($student)->getJson("/api/student/activities/{$id}")->assertNotFound();
        $this->actingAs($teacher)->postJson('/api/students/taught', ['trilha' => 'FirstSteps', 'lesson' => 1, 'part' => 'B', 'student_ids' => [$studentId]])->assertOk();
        $this->actingAs($student->fresh())->getJson("/api/student/activities/{$id}")->assertOk();
    }

    public function test_typed_names_match_the_stored_course_name(): void
    {
        $this->assertSame('FirstSteps', Trilhas::match('first steps'));
        $this->assertSame('TakeTheLead', Trilhas::match('take-the-lead'));
        $this->assertSame('Radiant', Trilhas::match('radiant'));
        $this->assertNull(Trilhas::match('Business'));
    }
}
