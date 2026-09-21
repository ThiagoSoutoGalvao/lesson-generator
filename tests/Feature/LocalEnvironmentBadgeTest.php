<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The "LOCAL — not the live site" badge must show on a developer machine and never on Railway,
 * so an account created locally can't be mistaken for one that exists in production.
 */
class LocalEnvironmentBadgeTest extends TestCase
{
    use RefreshDatabase;

    private const BADGE = 'not the live site';

    public function test_login_page_shows_the_badge_only_in_the_local_environment(): void
    {
        $this->app['env'] = 'local';
        $this->get('/login')->assertOk()->assertSee(self::BADGE);

        $this->app['env'] = 'production';
        $this->get('/login')->assertOk()->assertDontSee(self::BADGE);
    }

    public function test_the_app_shell_tells_the_page_whether_it_is_local(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $this->app['env'] = 'local';
        $this->actingAs($teacher)->get('/')->assertOk()->assertSee('window.__AURORA_LOCAL__ = true', false);

        $this->app['env'] = 'production';
        $this->actingAs($teacher)->get('/')->assertOk()->assertSee('window.__AURORA_LOCAL__ = false', false);
    }
}
