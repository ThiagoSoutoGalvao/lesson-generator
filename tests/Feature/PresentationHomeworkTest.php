<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\StudentAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A teacher can hand a student a Presentation as a take-home reference via Homework (2026-09-24),
 * even though presentations stay out of the automatic trilha list and every other teacher-only
 * type stays blocked on every path.
 */
class PresentationHomeworkTest extends TestCase
{
    use RefreshDatabase;

    private function presentation(User $owner, array $extra = []): Activity
    {
        return Activity::create($extra + [
            'user_id' => $owner->id, 'name' => 'Past Simple', 'type' => 'presentation',
            'content' => ['type' => 'presentation', 'topic' => 'Past simple', 'slides' => [
                ['title' => 'Form', 'rule' => 'Verb + -ed', 'examples' => ['I walked.']],
            ]],
        ]);
    }

    private function student(User $teacher, array $extra = []): User
    {
        return User::factory()->create($extra + ['role' => 'student', 'trilha' => 'Lights', 'teacher_id' => $teacher->id, 'is_active' => true]);
    }

    public function test_a_homework_assigned_presentation_is_visible_to_the_student(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = $this->student($teacher);
        $activity = $this->presentation($teacher);
        StudentAssignment::create(['student_id' => $student->id, 'activity_id' => $activity->id]);

        $this->actingAs($student)->getJson("/api/student/activities/{$activity->id}")
            ->assertOk()
            ->assertJsonPath('content.slides.0.title', 'Form');
    }

    public function test_a_presentation_that_is_not_assigned_stays_hidden(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = $this->student($teacher);
        $activity = $this->presentation($teacher);

        $this->actingAs($student)->getJson("/api/student/activities/{$activity->id}")->assertNotFound();
    }

    public function test_a_trilha_presentation_still_does_not_reach_the_automatic_trilha_list(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = $this->student($teacher);
        $this->presentation($teacher, ['trilha' => 'Lights', 'trilha_lesson' => 1, 'student_visible' => true]);

        $lessons = $this->actingAs($student)->getJson('/api/student/lessons')->assertOk()->json('lessons');
        $this->assertSame([], $lessons, 'a presentation must never appear in the auto-browsed trilha list, assigned or not');
    }

    public function test_a_trilha_presentation_is_still_blocked_even_if_it_matches_the_students_trilha(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = $this->student($teacher);
        $activity = $this->presentation($teacher, ['trilha' => 'Lights', 'trilha_lesson' => 1, 'student_visible' => true]);

        // Not homework-assigned — trilha match alone must not be enough for a teacher-only type.
        $this->actingAs($student)->getJson("/api/student/activities/{$activity->id}")->assertNotFound();
    }

    public function test_the_other_teacher_only_types_stay_blocked_even_when_homework_assigned(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = $this->student($teacher);

        foreach (['reading_text', 'essay_feedback', 'grammar_explainer'] as $type) {
            $activity = Activity::create(['user_id' => $teacher->id, 'name' => $type, 'type' => $type, 'content' => ['type' => $type]]);
            StudentAssignment::create(['student_id' => $student->id, 'activity_id' => $activity->id]);

            $this->actingAs($student)->getJson("/api/student/activities/{$activity->id}")->assertNotFound();
        }
    }

    public function test_a_student_can_record_completing_an_assigned_presentation(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = $this->student($teacher);
        $activity = $this->presentation($teacher);
        StudentAssignment::create(['student_id' => $student->id, 'activity_id' => $activity->id]);

        $this->actingAs($student)->postJson('/api/student/attempts', ['activity_id' => $activity->id])
            ->assertCreated();

        $this->assertDatabaseHas('activity_attempts', ['student_id' => $student->id, 'activity_id' => $activity->id]);
    }

    public function test_a_presentation_can_be_assigned_by_its_owning_teacher(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = $this->student($teacher);
        $activity = $this->presentation($teacher);

        $this->actingAs($teacher)->postJson("/api/students/{$student->id}/assignments", ['activity_id' => $activity->id])
            ->assertCreated();
    }
}
