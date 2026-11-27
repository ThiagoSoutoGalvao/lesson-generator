<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Aurora Business "taught up to" (2026-11-28): students see lessons up to the teacher's mark, with readings + presentations. */
class TaughtUpToTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    private function student(string $trilha = 'FirstSteps'): User
    {
        return User::factory()->create(['role' => 'student', 'trilha' => $trilha, 'teacher_id' => $this->teacher->id, 'is_active' => true]);
    }

    private function act(string $trilha, int $lesson, ?string $part, string $type = 'quiz', bool $visible = true): Activity
    {
        return Activity::create(['user_id' => $this->teacher->id, 'name' => "{$trilha} {$lesson}{$part} {$type}", 'type' => $type,
            'content' => ['type' => $type], 'trilha' => $trilha, 'trilha_lesson' => $lesson, 'trilha_part' => $part, 'student_visible' => $visible]);
    }

    private function names(User $s): array
    {
        return collect($this->actingAs($s->fresh())->getJson('/api/student/lessons')->assertOk()->json('lessons'))->flatten(1)->pluck('name')->all();
    }

    public function test_a_new_business_student_sees_only_1a_with_its_reading_first(): void
    {
        $quiz = $this->act('FirstSteps', 1, 'A');
        $this->act('FirstSteps', 1, 'A', 'reading_text');
        $this->act('FirstSteps', 1, 'A', 'presentation');
        $this->act('FirstSteps', 1, null, 'match_pairs');          // saved before parts = A
        $this->act('FirstSteps', 1, 'A', 'essay_feedback');       // still teacher-only
        $this->act('FirstSteps', 1, 'A', 'quiz', false);          // not approved yet
        $b = $this->act('FirstSteps', 1, 'B');
        $this->act('FirstSteps', 2, 'A');

        $s = $this->student();
        $this->assertSame(['FirstSteps 1A reading_text', 'FirstSteps 1A presentation', 'FirstSteps 1A quiz', 'FirstSteps 1 match_pairs'], $this->names($s));
        $this->actingAs($s)->getJson('/api/student/lessons')->assertJson(['taught' => ['lesson' => 1, 'part' => 'A']]);
        $this->actingAs($s)->getJson("/api/student/activities/{$quiz->id}")->assertOk();
        $this->actingAs($s)->getJson("/api/student/activities/{$b->id}")->assertNotFound();
        $this->actingAs($s)->getJson('/api/student/progress')->assertJson(['activities_total' => 4]);
    }

    public function test_marking_4b_opens_everything_up_to_4b_and_only_moves_forward(): void
    {
        foreach ([[3, 'C'], [4, 'A'], [4, 'B'], [4, 'C'], [5, 'A']] as [$l, $p]) $this->act('FirstSteps', $l, $p);
        $late = $this->act('FirstSteps', 4, 'C');
        $ana = $this->student();
        $bia = $this->student();
        $ahead = $this->student();
        $ahead->forceFill(['taught_lesson' => 5, 'taught_part' => 'A'])->save();
        $other = User::factory()->create(['role' => 'student', 'trilha' => 'FirstSteps', 'teacher_id' => User::factory()->create(['role' => 'teacher'])->id]);

        $this->actingAs($this->teacher)->postJson('/api/students/taught', ['trilha' => 'FirstSteps', 'lesson' => 4, 'part' => 'B',
            'student_ids' => [$ana->id, $ahead->id, $other->id]])->assertOk()->assertJsonCount(2, 'students');

        $this->assertSame(['FirstSteps 3C quiz', 'FirstSteps 4A quiz', 'FirstSteps 4B quiz'], $this->names($ana));
        $this->assertSame([], $this->names($bia));                       // not ticked: still 1A
        $this->assertSame(5, $ahead->fresh()->taught_lesson);             // never moved back
        $this->assertNull($other->fresh()->taught_lesson);                // not this teacher's
        $this->actingAs($ana->fresh())->getJson("/api/student/activities/{$late->id}")->assertNotFound();
        $this->actingAs($ana->fresh())->postJson('/api/student/attempts', ['activity_id' => $late->id])->assertNotFound();
    }

    public function test_the_students_page_sets_any_mark_and_a_new_course_starts_again(): void
    {
        $s = $this->student();
        $this->actingAs($this->teacher)->patchJson("/api/students/{$s->id}", ['taught' => '6c'])->assertOk()->assertJson(['taught_lesson' => 6, 'taught_part' => 'C']);
        $this->actingAs($this->teacher)->patchJson("/api/students/{$s->id}", ['taught' => '2A'])->assertOk()->assertJson(['taught_lesson' => 2]);
        $this->actingAs($this->teacher)->patchJson("/api/students/{$s->id}", ['taught' => 'lesson four'])->assertStatus(422);
        $this->actingAs($this->teacher)->patchJson("/api/students/{$s->id}", ['trilha' => 'EverydayBusiness'])->assertOk()->assertJson(['taught_lesson' => null]);
        $this->actingAs($this->teacher)->getJson('/api/students')->assertOk()->assertJsonFragment(['taught_part' => null]);
    }

    public function test_other_courses_keep_the_whole_trilha_and_no_readings(): void
    {
        $this->act('Radiant', 1, 'A');
        $this->act('Radiant', 9, 'C');
        $reading = $this->act('Radiant', 1, 'A', 'reading_text');
        $s = $this->student('Radiant');
        $this->assertSame(['Radiant 1A quiz', 'Radiant 9C quiz'], $this->names($s));
        $this->actingAs($s)->getJson('/api/student/lessons')->assertJson(['taught' => null]);
        $this->actingAs($s)->getJson("/api/student/activities/{$reading->id}")->assertNotFound();
        $this->actingAs($this->teacher)->patchJson("/api/students/{$s->id}", ['taught' => '2A'])->assertStatus(422);
    }
}
