<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Aurora') }}</title>

        <link rel="icon" type="image/png" href="/brand/aurora-symbol.png">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lexend:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @vite(['resources/css/app.css'])

        <style>
            body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
            .aurora-ground {
                background: linear-gradient(150deg, #1A0F3D 0%, #2A1560 32%, #5A1B73 66%, #8E2160 92%, #B8433A 120%);
                background-attachment: fixed;
            }
            .aurora-card {
                background: rgba(39, 29, 98, .55);
                -webkit-backdrop-filter: blur(22px) saturate(1.3);
                backdrop-filter: blur(22px) saturate(1.3);
                border: 1px solid rgba(255, 255, 255, .12);
            }
            /* Re-tint the Breeze auth form (light-themed by default) for the dark card */
            .aurora-card label { color: rgba(255, 255, 255, .85); }
            .aurora-card input[type=email],
            .aurora-card input[type=password],
            .aurora-card input[type=text] {
                background: rgba(255, 255, 255, .08);
                border-color: rgba(255, 255, 255, .22);
                color: #fff;
            }
            .aurora-card input::placeholder { color: rgba(255, 255, 255, .4); }
            .aurora-card a { color: #fdb08a; }
            .aurora-card .text-gray-600,
            .aurora-card .text-gray-900,
            .aurora-card .text-gray-500 { color: rgba(255, 255, 255, .7) !important; }
        </style>
    </head>
    <body class="antialiased text-white">
        <div class="aurora-ground min-h-screen flex flex-col sm:justify-center items-center pt-10 sm:pt-0 px-4">
            <a href="/" class="mb-8 transition-opacity hover:opacity-80">
                <img src="/brand/aurora-logo-horizontal-white.png" alt="Aurora" class="h-12 w-auto">
            </a>

            <div class="w-full sm:max-w-md px-6 py-6 aurora-card shadow-2xl shadow-black/40 overflow-hidden rounded-2xl">
                {{ $slot }}
            </div>
        </div>
    </body>
</html>
