<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Cambridge Writing exam mode (2026-11-28): a student hands in, only their own teacher reads it. */
class WritingSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_student_hands_in_and_only_their_teacher_reads_it(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $other = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student', 'trilha' => 'Radiant', 'teacher_id' => $teacher->id, 'is_active' => true]);

        $this->actingAs($student)->postJson('/api/student/writing', ['exam' => 'b2-first', 'seconds_used' => 3000, 'parts' => [
            ['part' => 1, 'task_id' => 'essay-b2-1', 'genre' => 'Essay', 'prompt' => 'Phones?', 'text' => "Nowadays, young people… use phones a lot.\n\nIn my opinion it's fine — really."],
            ['part' => 2, 'task_id' => 'report-b2-1', 'genre' => 'Report', 'prompt' => 'Sports report', 'text' => ''],
        ]])->assertCreated();

        $res = $this->actingAs($teacher)->getJson("/api/students/{$student->id}/writing")->assertOk();
        $this->assertSame(13, $res->json('writing.0.parts.0.words')); // the dash alone isn't a word
        $this->assertSame(0, $res->json('writing.0.parts.1.words'));
        $this->assertSame(3000, $res->json('writing.0.seconds_used'));

        $this->actingAs($other)->getJson("/api/students/{$student->id}/writing")->assertForbidden();
        $this->actingAs($student)->getJson("/api/students/{$student->id}/writing")->assertForbidden();
        $this->actingAs($teacher)->postJson('/api/student/writing', ['exam' => 'b2-first', 'parts' => [['part' => 1, 'task_id' => 'x', 'genre' => 'Essay', 'prompt' => 'p', 'text' => 't']]])->assertForbidden();
        $this->actingAs($student)->postJson('/api/student/writing', ['exam' => 'b2-first', 'parts' => []])->assertStatus(422);

        $this->actingAs($teacher)->deleteJson("/api/students/{$student->id}")->assertOk();
        $this->assertDatabaseCount('writing_submissions', 0);
    }
}
