<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** "Edit text" on Picture Prompts / Discussion (2026-11-27): only the words change; photos and item count are kept. */
class ActivityTextEditTest extends TestCase
{
    use RefreshDatabase;

    private function make(User $u, string $type, array $content): Activity
    {
        return Activity::create(['user_id' => $u->id, 'type' => $type, 'name' => 'FIRST STEPS L04A · x', 'trilha' => 'FirstSteps', 'trilha_lesson' => 4, 'trilha_part' => 'A', 'content' => ['type' => $type] + $content]);
    }

    public function test_picture_prompt_question_changes_and_the_photo_stays(): void
    {
        $u = User::factory()->create();
        $a = $this->make($u, 'picture_prompts', ['topic' => 'Office', 'targets' => ['I can see'], 'prompts' => [
            ['photo' => 'https://img/1.jpg', 'photo_credit' => 'Ana', 'keyword' => 'desk', 'question' => 'Old question?', 'starters' => ['Old…']],
            ['photo' => 'https://img/2.jpg', 'photo_credit' => 'Bia', 'keyword' => 'cafe', 'question' => 'Second?', 'starters' => []],
        ]]);
        $this->actingAs($u)->patchJson("/api/activities/{$a->id}/text", ['content' => [
            'topic' => 'Office life', 'targets' => ['There is…', ' ', 'They are…'],
            'prompts' => [
                ['question' => '  A man is at a laptop. What is he doing?  ', 'starters' => ['He is…', '', 'Maybe…'], 'photo' => 'https://evil/x.jpg'],
                ['question' => 'Second?', 'starters' => []],
            ],
        ]])->assertOk();
        $c = $a->fresh()->content;
        $this->assertSame('A man is at a laptop. What is he doing?', $c['prompts'][0]['question']);
        $this->assertSame(['He is…', 'Maybe…'], $c['prompts'][0]['starters']);
        $this->assertSame('https://img/1.jpg', $c['prompts'][0]['photo']);
        $this->assertSame('Ana', $c['prompts'][0]['photo_credit']);
        $this->assertSame(['There is…', 'They are…'], $c['targets']);
        $this->assertSame('Office life', $c['topic']);
        $this->assertSame('picture_prompts', $c['type']);
    }

    public function test_discussion_follow_ups_change(): void
    {
        $u = User::factory()->create();
        $a = $this->make($u, 'discussion_questions', ['topic' => 'Jobs', 'questions' => [['question' => 'Q1?', 'follow_ups' => ['F1']]]]);
        $this->actingAs($u)->patchJson("/api/activities/{$a->id}/text", ['content' => ['questions' => [['question' => 'New Q1?', 'follow_ups' => ['A', 'B']]]]])->assertOk();
        $this->assertSame(['question' => 'New Q1?', 'follow_ups' => ['A', 'B']], $a->fresh()->content['questions'][0]);
        $this->assertSame('Jobs', $a->fresh()->content['topic']);
    }

    public function test_story_builder_steps_change_and_the_rest_is_kept(): void
    {
        $u = User::factory()->create();
        $a = $this->make($u, 'story_builder', ['targets' => ['first', 'then'], 'stories' => [
            ['title' => 'A late train', 'opening' => 'Ana is at the station.', 'steps' => [
                ['ask' => 'Where / Ana / go?', 'full' => 'Where is Ana going?', 'word' => 'meeting'],
                ['ask' => 'The train is late.', 'word' => 'banana'],
            ]],
            ['title' => 'Old style', 'prompts' => ['A', 'B']],
        ]]);
        $this->actingAs($u)->patchJson("/api/activities/{$a->id}/text", ['content' => ['stories' => [
            ['steps' => [
                ['ask' => 'Where / Ana / go?', 'full' => 'Where is Ana going?', 'word' => 'meeting'],
                ['ask' => '  Why / train / late?  ', 'full' => 'Why is the train late?', 'word' => ' '],
            ]],
            [],
        ]]])->assertOk();
        $c = $a->fresh()->content;
        $this->assertSame(['ask' => 'Why / train / late?', 'full' => 'Why is the train late?'], $c['stories'][0]['steps'][1]);
        $this->assertSame('A late train', $c['stories'][0]['title']);
        $this->assertSame(['A', 'B'], $c['stories'][1]['prompts']);
        $this->assertSame(['first', 'then'], $c['targets']);

        // a step can't be added, and an empty ask is refused
        $this->actingAs($u)->patchJson("/api/activities/{$a->id}/text", ['content' => ['stories' => [['steps' => [['ask' => 'x']]], []]]])->assertStatus(422);
        $this->actingAs($u)->patchJson("/api/activities/{$a->id}/text", ['content' => ['stories' => [['steps' => [['ask' => ''], ['ask' => 'y']]], []]]])->assertStatus(422);
    }

    public function test_refuses_other_owners_other_types_wrong_count_and_empty_questions(): void
    {
        $u = User::factory()->create();
        $a = $this->make($u, 'discussion_questions', ['questions' => [['question' => 'Q1?'], ['question' => 'Q2?']]]);
        $this->actingAs(User::factory()->create())->patchJson("/api/activities/{$a->id}/text", ['content' => ['questions' => [['question' => 'x'], ['question' => 'y']]]])->assertForbidden();
        $this->actingAs($u)->patchJson("/api/activities/{$a->id}/text", ['content' => ['questions' => [['question' => 'only one']]]])->assertStatus(422);
        $this->actingAs($u)->patchJson("/api/activities/{$a->id}/text", ['content' => ['questions' => [['question' => 'ok'], ['question' => '']]]])->assertStatus(422);
        $q = $this->make($u, 'quiz', ['questions' => [['question' => 'Q?']]]);
        $this->actingAs($u)->patchJson("/api/activities/{$q->id}/text", ['content' => ['questions' => [['question' => 'x']]]])->assertStatus(422);
        $this->assertSame('Q1?', $a->fresh()->content['questions'][0]['question']);
    }
}
