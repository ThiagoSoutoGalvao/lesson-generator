<x-guest-layout>
    <!-- Session Status -->
    <x-auth-session-status class="mb-4" :status="session('status')" />

    <form method="POST" action="{{ route('login') }}">
        @csrf

        <!-- Email Address -->
        <div>
            <x-input-label for="email" :value="__('Email')" />
            <x-text-input id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required autofocus autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" />
            <x-input-error :messages="$errors->get('email')" class="mt-2" />
        </div>

        <!-- Password -->
        <div class="mt-4">
            <x-input-label for="password" :value="__('Password')" />

            <div class="relative mt-1">
                <x-text-input id="password" class="block w-full pr-10"
                                type="password"
                                name="password"
                                required autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false" />
                {{-- Plain vanilla JS — this page loads CSS only, no app.js bundle (see guest.blade.php). Lets a
                     student check what they actually typed instead of fighting to edit a masked field blind. --}}
                <button type="button" id="toggle-password" aria-label="Show password"
                        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                </button>
            </div>

            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>

        <!-- Remember Me -->
        <div class="block mt-4">
            <label for="remember_me" class="inline-flex items-center">
                <input id="remember_me" type="checkbox" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500" name="remember">
                <span class="ms-2 text-sm text-gray-600">{{ __('Remember me') }}</span>
            </label>
        </div>

        <div class="flex items-center justify-end mt-4">
            @if (Route::has('password.request'))
                <a class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" href="{{ route('password.request') }}">
                    {{ __('Forgot your password?') }}
                </a>
            @endif

            <x-primary-button class="ms-3">
                {{ __('Log in') }}
            </x-primary-button>
        </div>
    </form>

    <script>
        (function () {
            var btn = document.getElementById('toggle-password');
            var field = document.getElementById('password');
            if (!btn || !field) return;
            var eyeOpen = btn.querySelector('svg').innerHTML;
            var eyeOff = '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 .74-2.06 2.03-3.89 3.68-5.27M9.9 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a13.16 13.16 0 0 1-1.67 2.94M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/>';
            btn.addEventListener('click', function () {
                var shown = field.type === 'text';
                field.type = shown ? 'password' : 'text';
                btn.querySelector('svg').innerHTML = shown ? eyeOpen : eyeOff;
                btn.setAttribute('aria-label', shown ? 'Show password' : 'Hide password');
            });
        })();
    </script>
</x-guest-layout>
