<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditActivitiesTest extends TestCase
{
    use RefreshDatabase;

    public function test_finds_activities_in_a_folder_across_different_owners(): void
    {
        $personal = User::factory()->create(['email' => 'me@example.com', 'role' => 'teacher']);
        $aurora   = User::factory()->create(['email' => 'aurora@example.com', 'role' => 'teacher']);
        Activity::create(['user_id' => $personal->id, 'name' => 'A', 'type' => 'quiz', 'content' => [], 'folder' => 'Ketlin']);
        Activity::create(['user_id' => $personal->id, 'name' => 'B', 'type' => 'quiz', 'content' => [], 'folder' => 'Ketlin']);
        Activity::create(['user_id' => $aurora->id, 'name' => 'C', 'type' => 'presentation', 'content' => [], 'folder' => 'ketlin']);
        Activity::create(['user_id' => $personal->id, 'name' => 'D', 'type' => 'quiz', 'content' => [], 'folder' => 'Other']);

        $this->artisan('activities:audit', ['--folder' => 'Ketlin'])
            ->expectsOutputToContain('me@example.com')
            ->expectsOutputToContain('aurora@example.com')
            ->expectsOutputToContain('split across 2 different accounts')
            ->assertSuccessful();
    }

    public function test_finds_by_name_case_insensitively(): void
    {
        $teacher = User::factory()->create(['email' => 'me@example.com', 'role' => 'teacher']);
        Activity::create(['user_id' => $teacher->id, 'name' => 'Past Simple Quiz', 'type' => 'quiz', 'content' => []]);

        $this->artisan('activities:audit', ['--name' => 'past simple'])
            ->expectsOutputToContain('me@example.com')
            ->assertSuccessful();
    }

    public function test_no_match_is_reported_plainly(): void
    {
        $this->artisan('activities:audit', ['--folder' => 'Nobody'])
            ->expectsOutputToContain('No activities match')
            ->assertSuccessful();
    }

    public function test_requires_a_search_option(): void
    {
        $this->artisan('activities:audit')->assertFailed();
    }
}
