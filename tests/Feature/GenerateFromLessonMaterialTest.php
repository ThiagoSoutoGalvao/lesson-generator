<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Aurora Lessons Phase 1, step 5: /api/generate can build an activity straight from a saved Reading Text or
 * Presentation (`source_activity_id`) — the text is read server-side, so the PDF download/upload round trip
 * is gone. Claude is faked; these tests check what is SENT to it and who may use which material.
 */
class GenerateFromLessonMaterialTest extends TestCase
{
    use RefreshDatabase;

    private string $sent = '';

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake(function ($request) {
            $this->sent = $request->data()['messages'][0]['content'];
            $quiz = ['type' => 'quiz', 'questions' => [['question' => 'Q?', 'answers' => [['text' => 'a', 'correct' => true]]]]];

            return Http::response(['content' => [['type' => 'text', 'text' => json_encode($quiz)]]], 200);
        });
    }

    private function teacher(): User
    {
        return User::factory()->create(['role' => 'teacher']);
    }

    private function reading(User $owner): Activity
    {
        return Activity::create([
            'user_id' => $owner->id, 'name' => 'RADIANT L01 · Reading Text · A weekend away', 'type' => 'reading_text',
            'trilha' => 'Radiant', 'trilha_lesson' => 1, 'stage' => 'presentation',
            'content' => [
                'type' => 'reading_text', 'topic' => 'A weekend away',
                'paragraphs' => ['My cousin has never been to Natal.', 'We have already booked a table.'],
                'vocabulary' => [['word' => 'book a table', 'definition' => 'reserve a place at a restaurant']],
            ],
        ]);
    }

    private function presentation(User $owner): Activity
    {
        return Activity::create([
            'user_id' => $owner->id, 'name' => 'RADIANT L01 · Presentation · Ever and never', 'type' => 'presentation',
            'content' => ['type' => 'presentation', 'topic' => 'Present perfect', 'slides' => [
                ['title' => 'Ever', 'rule' => 'Use **ever** in questions.', 'form' => 'Have you **ever** + past participle?', 'examples' => ['Have you **ever** been to Paris?']],
            ]],
        ]);
    }

    private function generate(User $as, array $body)
    {
        return $this->actingAs($as)->postJson('/api/generate', $body + ['type' => 'quiz', 'prompt' => 'Write 6 questions.', 'level' => 'B2']);
    }

    public function test_a_reading_is_sent_as_its_text_and_target_vocabulary(): void
    {
        $t = $this->teacher();
        $this->generate($t, ['source_activity_id' => $this->reading($t)->id])->assertOk()->assertJsonPath('type', 'quiz');

        $this->assertStringContainsString("lesson's reading text", $this->sent);
        $this->assertStringContainsString('My cousin has never been to Natal.', $this->sent);
        $this->assertStringContainsString('We have already booked a table.', $this->sent);
        $this->assertStringContainsString("Target vocabulary:\n- book a table — reserve a place at a restaurant", $this->sent);
    }

    public function test_a_presentation_is_sent_as_its_slides_without_bold_markers(): void
    {
        $t = $this->teacher();
        $this->generate($t, ['source_activity_id' => $this->presentation($t)->id])->assertOk();

        $this->assertStringContainsString("lesson's presentation", $this->sent);
        $this->assertStringContainsString('Slide 1: Ever', $this->sent);
        $this->assertStringContainsString('Have you ever + past participle?', $this->sent);
        $this->assertStringContainsString('- Have you ever been to Paris?', $this->sent);
        $this->assertStringNotContainsString('**', $this->sent);
    }

    public function test_another_teachers_material_is_refused(): void
    {
        $owner = $this->teacher();
        $this->generate($this->teacher(), ['source_activity_id' => $this->reading($owner)->id])
            ->assertStatus(422)->assertJsonPath('message', 'That presentation or reading could not be found in your library.');
        $this->assertSame('', $this->sent, 'Claude must not be called');
    }

    public function test_an_activity_that_is_not_a_reading_or_presentation_is_refused(): void
    {
        $t = $this->teacher();
        $quiz = Activity::create(['user_id' => $t->id, 'name' => 'Quiz', 'type' => 'quiz', 'content' => ['type' => 'quiz', 'questions' => []]]);
        $this->generate($t, ['source_activity_id' => $quiz->id])->assertStatus(422);
    }

    public function test_material_with_no_text_is_refused(): void
    {
        $t = $this->teacher();
        $empty = Activity::create(['user_id' => $t->id, 'name' => 'Empty', 'type' => 'reading_text', 'content' => ['type' => 'reading_text', 'paragraphs' => []]]);
        $this->generate($t, ['source_activity_id' => $empty->id])
            ->assertStatus(422)->assertJsonPath('message', 'That presentation or reading has no text to work from.');
    }

    public function test_it_is_still_exactly_one_source(): void
    {
        $t = $this->teacher();
        $this->generate($t, ['source_activity_id' => $this->reading($t)->id, 'topic' => 'travel'])->assertStatus(422);
    }

    public function test_a_long_presentation_is_cut_at_a_slide_boundary(): void
    {
        $t = $this->teacher();
        $slides = [];
        for ($i = 1; $i <= 80; $i++) {
            $slides[] = ['title' => "Slide title {$i}", 'rule' => str_repeat('A rule sentence. ', 15), 'examples' => ['One.', 'Two.']];
        }
        $big = Activity::create(['user_id' => $t->id, 'name' => 'Big', 'type' => 'presentation', 'content' => ['type' => 'presentation', 'slides' => $slides]]);
        $this->generate($t, ['source_activity_id' => $big->id])->assertOk();

        // The source is everything before the builder's "Task:" line; the material in it is capped at 12,000 chars.
        $source = trim(explode("\n\nTask:", $this->sent)[0]);
        $this->assertLessThan(12000 + 400, mb_strlen($source));   // + the one-paragraph lead-in
        $this->assertStringContainsString('Slide 1: Slide title 1', $source);
        $this->assertStringNotContainsString('Slide 80:', $source);
        $this->assertStringEndsWith('- Two.', $source);            // cut after a whole slide, never mid-slide
    }
}
