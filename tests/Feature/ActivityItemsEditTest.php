<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Edit inside the activity (2026-11-28, groups 1 + 2): text only, items can be removed but not added, rules checked. */
class ActivityItemsEditTest extends TestCase
{
    use RefreshDatabase;

    private User $u;

    protected function setUp(): void
    {
        parent::setUp();
        $this->u = User::factory()->create();
    }

    private function make(string $type, array $content): Activity
    {
        return Activity::create(['user_id' => $this->u->id, 'type' => $type, 'name' => 'FIRST STEPS L02A · x', 'trilha' => 'FirstSteps', 'trilha_lesson' => 2, 'trilha_part' => 'A', 'content' => ['type' => $type] + $content]);
    }

    private function send(Activity $a, string $key, array $list)
    {
        return $this->actingAs($this->u)->patchJson("/api/activities/{$a->id}/items", ['content' => [$key => $list]]);
    }

    public function test_quiz_question_answers_and_removal(): void
    {
        $a = $this->make('quiz', ['questions' => [
            ['question' => 'Q1?', 'keyword' => 'desk', 'answers' => [['text' => 'a', 'correct' => true], ['text' => 'b', 'correct' => false]]],
            ['question' => 'Q2?', 'answers' => [['text' => 'c', 'correct' => false], ['text' => 'd', 'correct' => true]]],
        ]]);
        $this->send($a, 'questions', [['_from' => 1, 'question' => ' Q2 fixed? ', 'options' => ['c', 'e'], 'correct' => 0]])->assertOk();
        $q = $a->fresh()->content['questions'];
        $this->assertCount(1, $q);
        $this->assertSame('Q2 fixed?', $q[0]['question']);
        $this->assertSame([['text' => 'c', 'correct' => true], ['text' => 'e', 'correct' => false]], $q[0]['answers']);

        $this->send($a, 'questions', [['_from' => 0, 'question' => 'x', 'options' => ['c', 'c'], 'correct' => 0]])->assertStatus(422); // same options
        $this->send($a, 'questions', [['_from' => 0, 'question' => 'x', 'options' => ['c', 'e', 'f'], 'correct' => 0]])->assertStatus(422); // option count changed
        $this->send($a, 'questions', [])->assertStatus(422); // at least one stays
    }

    public function test_categorise_fix_move_and_remove_words_but_no_repeats(): void
    {
        $a = $this->make('word_categorisation', ['topic' => 'There is / there are', 'categories' => [
            ['name' => 'There is', 'words' => ['a printer', 'any free desks']],
            ['name' => 'There are', 'words' => ['two chairs']],
        ]]);
        $this->send($a, 'categories', [
            ['_from' => 0, 'name' => 'There is', 'words' => ['a printer', '']],
            ['_from' => 1, 'name' => 'There are', 'words' => ['two chairs', 'some free desks']],
        ])->assertOk();
        $this->assertSame([['name' => 'There is', 'words' => ['a printer']], ['name' => 'There are', 'words' => ['two chairs', 'some free desks']]], $a->fresh()->content['categories']);

        $this->send($a, 'categories', [
            ['_from' => 0, 'name' => 'There is', 'words' => ['a printer']],
            ['_from' => 1, 'name' => 'There are', 'words' => ['A printer']],
        ])->assertStatus(422)->assertJsonFragment(['A word appears twice — every word must be different.']);
        $this->send($a, 'categories', [['_from' => 0, 'name' => 'There is', 'words' => ['a printer']]])->assertStatus(422); // a group can't go
    }

    public function test_odd_one_unjumble_error_correction_and_role_play(): void
    {
        $o = $this->make('odd_one_out', ['groups' => [['words' => ['always', 'often', 'on', 'never'], 'odd_one' => 'on', 'reason' => 'r']]]);
        $this->send($o, 'groups', [['_from' => 0, 'words' => ['always', 'often', 'at', 'never'], 'odd' => 2, 'reason' => 'A preposition.']])->assertOk();
        $this->assertSame('at', $o->fresh()->content['groups'][0]['odd_one']);

        $j = $this->make('unjumble', ['sentences' => [['sentence' => 'I am here.', 'words' => ['I', 'am', 'here.'], 'keyword' => 'k']]]);
        $this->send($j, 'sentences', [['_from' => 0, 'sentence' => 'Are you free on Monday?']])->assertOk();
        $this->assertSame(['Are', 'you', 'free', 'on', 'Monday?'], $j->fresh()->content['sentences'][0]['words']);
        $this->assertSame('k', $j->fresh()->content['sentences'][0]['keyword']);

        $e = $this->make('error_correction', ['items' => [['sentence' => 'She go to work.', 'error' => 'go', 'correction' => 'goes']]]);
        $this->send($e, 'items', [['_from' => 0, 'sentence' => 'She go to work.', 'error' => 'went', 'correction' => 'goes']])->assertStatus(422);

        $r = $this->make('role_play', ['targets' => ['t'], 'cards' => [['situation' => 's', 'role_a' => ['name' => 'A', 'brief' => 'a'], 'role_b' => ['name' => 'B', 'brief' => 'b']]]]);
        $this->send($r, 'cards', [['_from' => 0, 'situation' => 'New situation', 'role_a' => ['name' => 'Ana', 'brief' => 'You call.'], 'role_b' => ['name' => 'Bia', 'brief' => 'You answer.']]])->assertOk();
        $this->assertSame(['name' => 'Ana', 'brief' => 'You call.'], $r->fresh()->content['cards'][0]['role_a']);
        $this->assertSame(['t'], $r->fresh()->content['targets']);
    }

    public function test_refuses_other_owners_adding_items_and_gap_fills(): void
    {
        $a = $this->make('match_pairs', ['pairs' => [['left' => 'a', 'right' => '1'], ['left' => 'b', 'right' => '2']]]);
        $this->actingAs(User::factory()->create())->patchJson("/api/activities/{$a->id}/items", ['content' => ['pairs' => [['_from' => 0, 'left' => 'x', 'right' => 'y'], ['_from' => 1, 'left' => 'b', 'right' => '2']]]])->assertForbidden();
        $this->send($a, 'pairs', [['_from' => 0, 'left' => 'a', 'right' => '1'], ['_from' => 1, 'left' => 'b', 'right' => '2'], ['_from' => 1, 'left' => 'c', 'right' => '3']])->assertStatus(422);
        $this->send($a, 'pairs', [['_from' => 0, 'left' => 'a', 'right' => '1'], ['_from' => 1, 'left' => 'a', 'right' => '2']])->assertStatus(422); // same left side
        $g = $this->make('dialog_gap_fill', ['lines' => []]);
        $this->send($g, 'lines', [])->assertStatus(422);
    }
}
