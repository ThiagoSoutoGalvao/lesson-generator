<?php

namespace Tests\Feature;

use App\Services\ClaudeService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** Magazine reading (2026-11-28): business readings ask for dek / byline / pull, and unusable extras are dropped. */
class ReadingMagazineExtrasTest extends TestCase
{
    private const PARAS = ['Hi! My name is Camila. I work at Pampa Seguros.', 'The meetings are sometimes short, but they are always useful. I like them.', 'I finish at six.'];

    private function fake(array $extra): void
    {
        Http::fake(['api.anthropic.com/*' => Http::response(['content' => [['text' => json_encode(['type' => 'reading_text', 'topic' => 'A day', 'paragraphs' => self::PARAS, 'vocabulary' => []] + $extra)]]])]);
    }

    public function test_business_prompt_asks_for_the_extras_and_keeps_good_ones(): void
    {
        $this->fake(['dek' => ' Camila works in Porto Alegre. ', 'byline' => ['name' => 'Camila', 'role' => 'Claims assistant', 'company' => ''],
            'pull' => ['after' => 1, 'text' => '“The meetings are sometimes short, but they are always useful.”']]);
        $data = app(ClaudeService::class)->generateReadingText('A day', '', 3, '', 'A2', true);

        Http::assertSent(fn ($r) => str_contains($r['messages'][0]['content'], '"pull"') && str_contains($r['messages'][0]['content'], '"dek"'));
        $this->assertSame('Camila works in Porto Alegre.', $data['dek']);
        $this->assertSame(['name' => 'Camila', 'role' => 'Claims assistant'], $data['byline']);
        $this->assertSame(['after' => 1, 'text' => 'The meetings are sometimes short, but they are always useful.'], $data['pull']);
    }

    public function test_an_invented_pull_or_one_after_the_last_paragraph_is_dropped(): void
    {
        $tidy = fn ($pull, $byline = null) => ClaudeService::tidyMagazineExtras(['paragraphs' => self::PARAS, 'pull' => $pull, 'byline' => $byline, 'dek' => '']);
        $this->assertArrayNotHasKey('pull', $tidy(['after' => 0, 'text' => 'Meetings are the best part of my day.']));
        $this->assertArrayNotHasKey('pull', $tidy(['after' => 2, 'text' => 'I finish at six.']));
        $this->assertArrayNotHasKey('byline', $tidy(null, ['name' => ' ']));
        $this->assertArrayNotHasKey('dek', $tidy(null));
    }

    public function test_other_courses_get_the_old_prompt(): void
    {
        $this->fake([]);
        app(ClaudeService::class)->generateReadingText('A day', '', 3, '', 'B1');
        Http::assertSent(fn ($r) => ! str_contains($r['messages'][0]['content'], '"pull"') && ! str_contains($r['messages'][0]['content'], '"dek"'));
    }
}
