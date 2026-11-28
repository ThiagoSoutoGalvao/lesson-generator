<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\StudentAssignment;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 2026-11-28 (Thiago): students never get AI correction of their writing — the teacher corrects it in class.
 * Essay Feedback stays teacher-only on every path: the generator, and a saved feedback even if assigned as homework.
 */
class StudentNoEssayFeedbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_student_cannot_get_essay_feedback_in_any_way(): void
    {
        Http::fake(); // nothing may reach Claude
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student', 'trilha' => 'Radiant', 'teacher_id' => $teacher->id, 'is_active' => true]);

        $this->actingAs($student)->postJson('/api/essay-feedback/generate', ['essay_text' => 'My essay about phones.'])->assertForbidden();
        Http::assertNothingSent();

        $saved = Activity::create(['user_id' => $teacher->id, 'name' => 'Feedback', 'type' => 'essay_feedback', 'content' => ['type' => 'essay_feedback'], 'trilha' => 'Radiant', 'trilha_lesson' => 1]);
        StudentAssignment::create(['student_id' => $student->id, 'activity_id' => $saved->id]);
        $this->actingAs($student)->getJson("/api/student/activities/{$saved->id}")->assertNotFound();
    }
}
