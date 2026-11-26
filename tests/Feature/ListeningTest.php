<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\AudioClip;
use App\Models\User;
use App\Services\ListeningMaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Listening activities (2026-11-26). Claude and OpenAI are faked: the tests check the reading is split into
 * speakers, items Claude invents that the recording doesn't support are dropped, each line is voiced once
 * (the same line is never paid for twice) and the audio route serves the clip.
 */
class ListeningTest extends TestCase
{
    use RefreshDatabase;

    private int $tts = 0;
    private array $claude = [];

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake(function ($request) {
            if (str_contains($request->url(), 'openai.com')) {
                $this->tts++;
                return Http::response(str_repeat('ID3', 4000), 200, ['Content-Type' => 'audio/mpeg']);
            }
            return Http::response(['content' => [['type' => 'text', 'text' => json_encode(array_shift($this->claude))]], 'stop_reason' => 'end_turn'], 200);
        });
    }

    private function reading(): Activity
    {
        return Activity::create([
            'user_id' => User::factory()->create()->id, 'name' => 'FIRST STEPS L03B · Reading Text · Routines', 'type' => 'reading_text',
            'trilha' => 'FirstSteps', 'trilha_lesson' => 3, 'trilha_part' => 'B',
            'content' => ['type' => 'reading_text', 'topic' => 'Routines', 'paragraphs' => [
                'Camila: Hi Diego! How often do you work from home? Diego: Hi Camila! I work from home twice a week.',
                'Camila: Do you ever write a report? Diego: Yes, I write a report every day.',
                'Diego: And you? Camila: I never work from home!',
            ]],
        ]);
    }

    public function test_a_dialogue_reading_is_split_into_speakers_and_a_story_into_paragraphs(): void
    {
        $lines = ListeningMaker::lines($this->reading());
        $this->assertCount(6, $lines);
        $this->assertSame(['who' => 'Diego', 'text' => 'Hi Camila! I work from home twice a week.'], $lines[1]);
        $this->assertSame(['Camila', 'Diego'], ListeningMaker::speakers($lines));

        $story = new Activity(['type' => 'reading_text', 'content' => ['paragraphs' => ['Hi! My name is Camila. I work at 8:30.', 'At 12:00, I have lunch.']]]);
        $this->assertSame('Narrator', ListeningMaker::lines($story)[0]['who']);
        $this->assertCount(2, ListeningMaker::lines($story));
    }

    public function test_who_said_it_keeps_only_real_quotes_and_voices_each_line_once(): void
    {
        $items = [
            ['quote' => 'twice a week', 'who' => 'Diego'], ['quote' => 'How often do you work from home', 'who' => 'Camila'],
            ['quote' => 'I write a report every day', 'who' => 'Diego'], ['quote' => 'I never work from home', 'who' => 'Camila'],
            ['quote' => 'Do you ever write a report', 'who' => 'Camila'], ['quote' => 'And you?', 'who' => 'Diego'],
            ['quote' => 'I never work from home', 'who' => 'Diego'],      // wrong speaker → dropped
            ['quote' => 'I love Mondays', 'who' => 'Camila'],             // never said → dropped
        ];
        $this->claude = [['title' => 'Routines', 'items' => $items, 'voices' => ['Camila' => 'female', 'Diego' => 'male']]];

        $c = app(ListeningMaker::class)->make('who', $this->reading(), 'A2');

        $this->assertCount(6, $c['items']);
        $this->assertSame(['Camila', 'Diego'], $c['speakers']);
        $this->assertSame('coral', $c['lines'][0]['voice']);
        $this->assertSame('ash', $c['lines'][1]['voice']);
        $this->assertSame(6, $this->tts);
        $this->assertSame(6, AudioClip::count());

        // The same reading again: every line is reused, nothing is paid for twice.
        $this->claude = [['title' => 'Routines', 'items' => $items, 'voices' => ['Camila' => 'female', 'Diego' => 'male']]];
        app(ListeningMaker::class)->make('who', $this->reading(), 'A2');
        $this->assertSame(6, $this->tts);
    }

    public function test_gaps_must_appear_in_their_line_and_a_message_gets_its_own_script(): void
    {
        $this->claude = [['title' => 'Gaps', 'gaps' => [
            ['line' => 1, 'answer' => 'twice a week'], ['line' => 3, 'answer' => 'every day'], ['line' => 3, 'answer' => 'write a report'],
            ['line' => 5, 'answer' => 'never'], ['line' => 0, 'answer' => 'How often'], ['line' => 2, 'answer' => 'ever'],
            ['line' => 4, 'answer' => 'tomorrow'], // not in that line → dropped
        ], 'voices' => ['Camila' => 'female', 'Diego' => 'male']]];
        $c = app(ListeningMaker::class)->make('complete', $this->reading(), 'A2');
        $this->assertCount(6, $c['gaps']);
        $this->assertSame(0, $c['gaps'][0]['line']);

        $this->claude = [['title' => 'Message from Renata', 'lines' => [['who' => 'Renata', 'text' => 'Hi Camila, it is Renata. Meeting on Wednesday at ten, room two. Call me on 214.']],
            'fields' => [['label' => 'Who called?', 'answer' => 'Renata', 'accept' => ['Renata']], ['label' => 'Day', 'answer' => 'Wednesday', 'accept' => ['wednesday', 'wed']],
                ['label' => 'Time', 'answer' => '10', 'accept' => ['10', 'ten']], ['label' => 'Room', 'answer' => '2', 'accept' => ['2', 'two']], ['label' => 'Extension', 'answer' => '214', 'accept' => ['214']]],
            'voices' => ['Renata' => 'female']]];
        $m = app(ListeningMaker::class)->make('message', $this->reading(), 'A2');
        $this->assertSame('Renata', $m['lines'][0]['who']);
        $this->assertCount(1, $m['lines']);
        $this->assertCount(5, $m['fields']);
    }

    public function test_the_audio_route_serves_a_clip_to_any_signed_in_user(): void
    {
        $clip = AudioClip::create(['key' => str_repeat('a', 64), 'voice' => 'coral', 'bytes' => 3, 'data' => base64_encode('mp3')]);
        $student = User::factory()->create(['role' => 'student', 'trilha' => 'FirstSteps']);

        $this->get("/api/audio/{$clip->id}")->assertRedirect();
        $res = $this->actingAs($student)->get("/api/audio/{$clip->id}")->assertOk();
        $this->assertSame('mp3', $res->getContent());
        $this->assertSame('audio/mpeg', $res->headers->get('Content-Type'));
    }
}
