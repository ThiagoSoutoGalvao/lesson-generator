<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\ActivityAttempt;
use App\Models\StudentAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RemoveStudentTest extends TestCase
{
    use RefreshDatabase;

    private function teacher(): User
    {
        return User::factory()->create(['role' => 'teacher']);
    }

    private function studentOf(User $teacher, string $email = 'gabriel@example.com'): User
    {
        return User::factory()->create([
            'email' => $email, 'role' => 'student', 'trilha' => 'Lights', 'teacher_id' => $teacher->id, 'is_active' => true,
        ]);
    }

    private function activityOf(User $owner): Activity
    {
        return Activity::create(['user_id' => $owner->id, 'name' => 'Lesson 1', 'type' => 'quiz', 'content' => ['questions' => []]]);
    }

    public function test_a_teacher_can_remove_their_student_and_everything_that_belonged_to_them(): void
    {
        $teacher  = $this->teacher();
        $student  = $this->studentOf($teacher);
        $activity = $this->activityOf($teacher);

        ActivityAttempt::create(['student_id' => $student->id, 'activity_id' => $activity->id, 'score' => 3, 'max_score' => 5, 'completed_at' => now()]);
        StudentAssignment::create(['student_id' => $student->id, 'activity_id' => $activity->id]);
        DB::table('sessions')->insert(['id' => 'abc', 'user_id' => $student->id, 'payload' => '', 'last_activity' => time()]);

        $this->actingAs($teacher)->deleteJson("/api/students/{$student->id}")->assertOk()->assertJson(['ok' => true]);

        $this->assertDatabaseMissing('users', ['id' => $student->id]);
        $this->assertDatabaseMissing('activity_attempts', ['student_id' => $student->id]);
        $this->assertDatabaseMissing('student_assignments', ['student_id' => $student->id]);
        $this->assertDatabaseMissing('sessions', ['user_id' => $student->id]);
        $this->assertDatabaseHas('activities', ['id' => $activity->id]);   // the teacher's activity stays
        $this->assertDatabaseHas('users', ['id' => $teacher->id]);
    }

    public function test_removing_one_student_leaves_the_others_alone(): void
    {
        $teacher = $this->teacher();
        $gone    = $this->studentOf($teacher, 'gone@example.com');
        $kept    = $this->studentOf($teacher, 'kept@example.com');
        $activity = $this->activityOf($teacher);
        ActivityAttempt::create(['student_id' => $kept->id, 'activity_id' => $activity->id, 'completed_at' => now()]);

        $this->actingAs($teacher)->deleteJson("/api/students/{$gone->id}")->assertOk();

        $this->assertDatabaseHas('users', ['id' => $kept->id]);
        $this->assertDatabaseHas('activity_attempts', ['student_id' => $kept->id]);
    }

    public function test_a_teacher_cannot_remove_someone_elses_student(): void
    {
        $other   = $this->teacher();
        $student = $this->studentOf($other);

        $this->actingAs($this->teacher())->deleteJson("/api/students/{$student->id}")->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $student->id]);
    }

    public function test_this_route_can_never_remove_a_teacher_account(): void
    {
        $teacher = $this->teacher();
        $victim  = $this->teacher();

        $this->actingAs($teacher)->deleteJson("/api/students/{$victim->id}")->assertForbidden();
        $this->actingAs($teacher)->deleteJson("/api/students/{$teacher->id}")->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $victim->id]);
        $this->assertDatabaseHas('users', ['id' => $teacher->id]);
    }

    public function test_a_student_cannot_remove_anyone(): void
    {
        $teacher = $this->teacher();
        $student = $this->studentOf($teacher);
        $friend  = $this->studentOf($teacher, 'friend@example.com');

        $this->actingAs($student)->deleteJson("/api/students/{$friend->id}")->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $friend->id]);
    }

    public function test_a_removed_email_can_be_used_again(): void
    {
        $teacher = $this->teacher();
        $student = $this->studentOf($teacher);
        $this->actingAs($teacher)->deleteJson("/api/students/{$student->id}")->assertOk();

        $this->actingAs($teacher)->postJson('/api/students', [
            'name' => 'Gabriel', 'email' => 'gabriel@example.com', 'trilha' => 'Lights', 'password' => 'Lights-2026',
        ])->assertCreated();
    }
}
