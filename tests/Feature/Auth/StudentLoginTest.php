<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A student the teacher creates in the app must be able to log in with exactly
 * what the teacher handed over — the way people really type it on a phone.
 */
class StudentLoginTest extends TestCase
{
    use RefreshDatabase;

    private function makeStudent(string $email, string $password): User
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $this->actingAs($teacher)
            ->postJson('/api/students', [
                'name'     => 'Gabriel',
                'email'    => $email,
                'trilha'   => 'Lights',
                'password' => $password,
            ])
            ->assertCreated();

        auth()->logout();
        $this->app['auth']->forgetGuards();

        return User::where('role', 'student')->firstOrFail();
    }

    private function loginAs(string $email, string $password)
    {
        return $this->post('/login', ['email' => $email, 'password' => $password]);
    }

    public function test_exact_credentials_log_in(): void
    {
        $this->makeStudent('gabriel@example.com', 'Lights-2026');

        $this->loginAs('gabriel@example.com', 'Lights-2026')->assertRedirect('/');
        $this->assertAuthenticated();
    }

    public function test_capitalised_email_logs_in(): void
    {
        $this->makeStudent('gabriel@example.com', 'Lights-2026');

        $this->loginAs('Gabriel@Example.com', 'Lights-2026');
        $this->assertAuthenticated();
    }

    public function test_email_typed_with_surrounding_spaces_logs_in(): void
    {
        $this->makeStudent('gabriel@example.com', 'Lights-2026');

        $this->loginAs('  gabriel@example.com ', 'Lights-2026');
        $this->assertAuthenticated();
    }

    public function test_teacher_typing_mixed_case_email_still_stores_a_loginable_account(): void
    {
        $this->makeStudent('  Gabriel@Example.com ', 'Lights-2026');

        $this->loginAs('gabriel@example.com', 'Lights-2026');
        $this->assertAuthenticated();
    }

    public function test_password_with_symbols_logs_in(): void
    {
        $this->makeStudent('gabriel@example.com', 'p@ss w0rd!#$%&çã');

        $this->loginAs('gabriel@example.com', 'p@ss w0rd!#$%&çã');
        $this->assertAuthenticated();
    }

    public function test_password_the_teacher_pasted_with_a_trailing_space_still_works_when_typed_without_it(): void
    {
        $this->makeStudent('gabriel@example.com', 'Lights-2026 ');

        $this->loginAs('gabriel@example.com', 'Lights-2026');
        $this->assertAuthenticated();
    }

    public function test_password_pasted_from_a_chat_with_invisible_characters_works_when_typed_plainly(): void
    {
        // NBSP in front, zero-width space and a plain space behind — what a WhatsApp/Slack paste can carry.
        $this->makeStudent('gabriel@example.com', "\u{00A0}Lights-2026\u{200B} ");

        $this->loginAs('gabriel@example.com', 'Lights-2026');
        $this->assertAuthenticated();
    }

    public function test_student_typing_a_trailing_space_or_capital_on_their_phone_still_logs_in(): void
    {
        $this->makeStudent('gabriel@example.com', 'Lights-2026');

        $this->loginAs('Gabriel@Example.com ', 'Lights-2026 ');
        $this->assertAuthenticated();
    }

    public function test_the_saved_password_is_the_clean_one(): void
    {
        $student = $this->makeStudent('gabriel@example.com', '  Lights-2026 ');

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('Lights-2026', $student->password));
        $this->assertSame('gabriel@example.com', $student->email);
    }

    public function test_minimum_length_counts_the_password_not_its_padding(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $this->actingAs($teacher)
            ->postJson('/api/students', [
                'name' => 'Gabriel', 'email' => 'gabriel@example.com',
                'trilha' => 'Lights', 'password' => '1234567 ',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_an_older_account_whose_stored_password_has_a_trailing_space_still_logs_in_as_typed(): void
    {
        User::factory()->create([
            'email' => 'old@example.com', 'password' => 'Lights-2026 ', 'role' => 'student',
            'trilha' => 'Lights', 'is_active' => true,
        ]);

        $this->loginAs('old@example.com', 'Lights-2026 ');
        $this->assertAuthenticated();
    }

    public function test_wrong_password_is_still_refused(): void
    {
        $this->makeStudent('gabriel@example.com', 'Lights-2026');

        $this->loginAs('gabriel@example.com', 'Lights-2027');
        $this->assertGuest();
    }

    public function test_password_reset_by_teacher_logs_in(): void
    {
        $student = $this->makeStudent('gabriel@example.com', 'Lights-2026');
        $teacher = User::find($student->teacher_id);

        $this->actingAs($teacher)
            ->patchJson("/api/students/{$student->id}", ['password' => 'Brand-new-9'])
            ->assertOk();
        $this->app['auth']->forgetGuards();

        $this->loginAs('gabriel@example.com', 'Brand-new-9');
        $this->assertAuthenticated();
    }
}
