<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImportActivitiesTest extends TestCase
{
    use RefreshDatabase;

    // A cloze-family passage: the spaces sit against the gaps and must survive the trip.
    private function cloze(): array
    {
        return [
            'type'  => 'mc_cloze',
            'parts' => [
                ['text' => 'She '],
                ['gap' => 1, 'options' => ['goes', 'go'], 'answer' => 'goes'],
                ['text' => ' to school every day. '],
            ],
        ];
    }

    private function item(string $name = 'verbPatterns', string $type = 'mc_cloze', ?array $content = null): array
    {
        return ['name' => $name, 'type' => $type, 'content' => $content ?? $this->cloze(), 'trilha' => null, 'built_by' => null];
    }

    public function test_activities_are_imported_under_the_signed_in_teacher(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $someoneElse = User::factory()->create(['role' => 'teacher']);

        $this->actingAs($teacher)->postJson('/api/activities/import', [
            'activities' => [$this->item('A'), $this->item('B', 'quiz', ['type' => 'quiz', 'questions' => []]) + ['user_id' => $someoneElse->id]],
        ])->assertOk()->assertJson(['imported' => 2, 'skipped' => 0]);

        $this->assertSame(2, Activity::where('user_id', $teacher->id)->count());
        $this->assertSame(0, Activity::where('user_id', $someoneElse->id)->count());   // a user_id in the file is ignored
    }

    public function test_spaces_next_to_the_gaps_are_kept_exactly(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $this->actingAs($teacher)->postJson('/api/activities/import', ['activities' => [$this->item()]])->assertOk();

        $saved = Activity::where('user_id', $teacher->id)->firstOrFail();
        $this->assertSame('She ', $saved->content['parts'][0]['text']);
        $this->assertSame(' to school every day. ', $saved->content['parts'][2]['text']);
    }

    public function test_importing_the_same_file_twice_does_not_duplicate(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $payload = ['activities' => [$this->item('A'), $this->item('B')]];

        $this->actingAs($teacher)->postJson('/api/activities/import', $payload)->assertJson(['imported' => 2, 'skipped' => 0]);
        $this->actingAs($teacher)->postJson('/api/activities/import', $payload)->assertJson(['imported' => 0, 'skipped' => 2]);

        $this->assertSame(2, Activity::where('user_id', $teacher->id)->count());
    }

    public function test_same_name_but_different_content_is_a_different_activity(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $changed = $this->cloze();
        $changed['parts'][1]['answer'] = 'go';

        $this->actingAs($teacher)->postJson('/api/activities/import', ['activities' => [$this->item('A')]])->assertOk();
        $this->actingAs($teacher)->postJson('/api/activities/import', ['activities' => [$this->item('A', 'mc_cloze', $changed)]])
            ->assertJson(['imported' => 1, 'skipped' => 0]);
    }

    public function test_another_teachers_identical_activity_does_not_count_as_already_there(): void
    {
        $other   = User::factory()->create(['role' => 'teacher']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $this->actingAs($other)->postJson('/api/activities/import', ['activities' => [$this->item('A')]])->assertOk();

        $this->actingAs($teacher)->postJson('/api/activities/import', ['activities' => [$this->item('A')]])
            ->assertJson(['imported' => 1, 'skipped' => 0]);
    }

    public function test_bad_files_are_refused_and_nothing_is_saved(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $this->actingAs($teacher)->postJson('/api/activities/import', ['activities' => [$this->item('A'), $this->item('B', 'not_a_type')]])
            ->assertStatus(422)->assertJsonValidationErrors('activities.1.type');
        $this->actingAs($teacher)->postJson('/api/activities/import', ['activities' => []])->assertStatus(422);
        $this->actingAs($teacher)->postJson('/api/activities/import', [])->assertStatus(422);

        $this->assertSame(0, Activity::count());
    }

    public function test_a_student_cannot_import(): void
    {
        $student = User::factory()->create(['role' => 'student', 'trilha' => 'Lights', 'is_active' => true]);

        $this->actingAs($student)->postJson('/api/activities/import', ['activities' => [$this->item()]])->assertForbidden();

        $this->assertSame(0, Activity::count());
    }

    public function test_export_then_import_round_trips_an_activity(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher', 'email' => 'me@example.com']);
        $orig = Activity::create(['user_id' => $teacher->id, 'name' => 'verbPatterns', 'type' => 'mc_cloze', 'content' => $this->cloze()]);
        $file = tempnam(sys_get_temp_dir(), 'exp');

        $this->artisan('activities:export', ['file' => $file, '--user' => 'ME@example.com'])->assertSuccessful();

        $payload = json_decode(file_get_contents($file), true);
        $this->assertSame('lesson-generator-activities', $payload['format']);
        $this->assertCount(1, $payload['activities']);
        $this->assertArrayNotHasKey('user_id', $payload['activities'][0]);
        $this->assertArrayNotHasKey('id', $payload['activities'][0]);

        $fresh = User::factory()->create(['role' => 'teacher']);
        $this->actingAs($fresh)->postJson('/api/activities/import', ['activities' => $payload['activities']])->assertJson(['imported' => 1]);
        $this->assertEquals($orig->content, Activity::where('user_id', $fresh->id)->first()->content);

        @unlink($file);
    }

    public function test_export_says_so_when_nothing_matches(): void
    {
        $this->artisan('activities:export', ['file' => tempnam(sys_get_temp_dir(), 'exp'), '--since' => '2999-01-01'])->assertFailed();
    }
}
