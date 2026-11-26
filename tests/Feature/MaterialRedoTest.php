<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * "Write a new version" / "Edit text" on a lesson's reading or presentation (2026-11-26). Claude is faked: the
 * tests check what is sent, that nothing is saved before the teacher approves, and that only the activities made
 * from the replaced material are remade (the queue runs synchronously in tests).
 */
class MaterialRedoTest extends TestCase
{
    use RefreshDatabase;

    private array $sent = [];

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake(function ($request) {
            $prompt = $request->data()['messages'][0]['content'];
            $prompt = is_array($prompt) ? $prompt[0]['text'] : $prompt;
            $this->sent[] = $prompt;
            if (str_contains($prompt, 'Draft the prompts')) {
                $reply = ['reading' => ['topic' => 'A clear email from Ana', 'vocabulary' => 'deadline', 'paragraphs' => 3, 'extra' => 'An email.'],
                    'presentation' => ['topic' => 'Asking for updates', 'extra' => 'B1 level.', 'slides' => 5]];
            } elseif (str_contains($prompt, 'Write a reading text')) {
                $reply = ['type' => 'reading_text', 'topic' => 'A clear email from Ana', 'keyword' => 'office', 'paragraphs' => ['Hi team, the deadline is Friday.'], 'vocabulary' => []];
            } else {
                $reply = ['type' => 'true_false', 'title' => 'New', 'statements' => array_map(fn ($i) => ['statement' => "Ana wrote on day {$i}.", 'answer' => true], range(1, 10))];
            }
            return Http::response(['content' => [['type' => 'text', 'text' => json_encode($reply)]], 'stop_reason' => 'end_turn'], 200);
        });
    }

    private function lesson(User $u): array
    {
        $base = ['user_id' => $u->id, 'trilha' => 'EverydayBusiness', 'trilha_lesson' => 3, 'trilha_part' => 'B'];
        $reading = Activity::create($base + ['name' => 'EVERYDAY BUSINESS L03B · Reading Text · A confusing story', 'type' => 'reading_text', 'stage' => 'presentation',
            'content' => ['type' => 'reading_text', 'topic' => 'A confusing story', 'paragraphs' => ['Old paragraph one.', 'Old paragraph two.'], 'vocabulary' => []]]);
        $pres = Activity::create($base + ['name' => 'EVERYDAY BUSINESS L03B · Presentation · Updates', 'type' => 'presentation', 'stage' => 'presentation',
            'content' => ['type' => 'presentation', 'topic' => 'Updates', 'slides' => [['title' => 'Asking', 'rule' => 'Use could.', 'examples' => ['Could you…?']]]]]);
        $fromReading = Activity::create($base + ['name' => 'EVERYDAY BUSINESS L03B · True / False · Old', 'type' => 'true_false', 'stage' => 'practice', 'student_visible' => true,
            'content' => ['type' => 'true_false', 'title' => 'Old', 'statements' => [['statement' => 'old', 'answer' => true]]]]);
        $fromPres = Activity::create($base + ['name' => 'EVERYDAY BUSINESS L03B · Quiz · Old', 'type' => 'quiz', 'stage' => 'practice',
            'content' => ['type' => 'quiz', 'questions' => [['question' => 'old?', 'answers' => [['text' => 'a', 'correct' => true]]]]]]);
        return [$reading, $pres, $fromReading, $fromPres];
    }

    public function test_a_new_version_is_written_with_the_teachers_note_and_nothing_is_saved(): void
    {
        $u = User::factory()->create(['role' => 'teacher']);
        [$reading] = $this->lesson($u);

        $res = $this->actingAs($u)->postJson("/api/materials/{$reading->id}/new-version", ['note' => 'Make it an email from Ana.'])->assertOk();

        $this->assertSame('A clear email from Ana', $res->json('content.topic'));
        $this->assertStringContainsString('Make it an email from Ana.', $this->sent[0]);
        $this->assertStringContainsString('Old paragraph one.', $this->sent[0]);
        $this->assertSame('A confusing story', $reading->fresh()->content['topic']);
    }

    public function test_using_it_replaces_the_reading_and_remakes_only_the_activities_made_from_it(): void
    {
        $u = User::factory()->create(['role' => 'teacher']);
        [$reading, , $fromReading, $fromPres] = $this->lesson($u);
        $new = ['type' => 'reading_text', 'topic' => 'A clear email from Ana', 'paragraphs' => ['Hi team, the deadline is Friday.'], 'vocabulary' => []];

        $this->actingAs($u)->postJson("/api/materials/{$reading->id}/replace", ['content' => $new, 'remake' => true])->assertOk()->assertJson(['remaking' => true]);

        $reading->refresh();
        $this->assertSame(['Hi team, the deadline is Friday.'], $reading->content['paragraphs']);
        $this->assertSame('EVERYDAY BUSINESS L03B · Reading Text · A clear email from Ana', $reading->name);
        $this->assertCount(10, $fromReading->fresh()->content['statements']);
        $this->assertTrue((bool) $fromReading->fresh()->student_visible);
        $this->assertSame('old?', $fromPres->fresh()->content['questions'][0]['question']);
        $this->actingAs($u)->getJson("/api/materials/{$reading->id}/remake-status")->assertJson(['state' => 'done', 'done' => 1, 'failed' => 0]);
    }

    public function test_an_edit_without_remake_changes_only_the_text(): void
    {
        $u = User::factory()->create(['role' => 'teacher']);
        [, $pres, , $fromPres] = $this->lesson($u);
        $edited = $pres->content;
        $edited['slides'][0]['title'] = 'Asking politely';

        $this->actingAs($u)->postJson("/api/materials/{$pres->id}/replace", ['content' => $edited, 'remake' => false])->assertOk()->assertJson(['remaking' => false]);

        $this->assertSame('Asking politely', $pres->fresh()->content['slides'][0]['title']);
        $this->assertSame('old?', $fromPres->fresh()->content['questions'][0]['question']);
        $this->assertSame([], $this->sent);
    }

    public function test_only_the_owner_and_only_business_materials(): void
    {
        $u = User::factory()->create(['role' => 'teacher']);
        [$reading, , $fromReading] = $this->lesson($u);
        $other = User::factory()->create(['role' => 'teacher']);

        $this->actingAs($other)->postJson("/api/materials/{$reading->id}/new-version")->assertForbidden();
        $this->actingAs($u)->postJson("/api/materials/{$fromReading->id}/new-version")->assertStatus(422);
        $this->actingAs($u)->postJson("/api/materials/{$reading->id}/replace", ['content' => ['topic' => 'x']])->assertStatus(422);
    }
}
