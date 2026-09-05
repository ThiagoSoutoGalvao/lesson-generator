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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @vite(['resources/css/app.css'])

        <style>
            body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
            .aurora-ground {
                background: linear-gradient(150deg, #F8C63D 0%, #FA9C3E 30%, #FC6840 62%, #A01789 115%);
                background-attachment: fixed;
            }
            .aurora-card {
                background: rgba(255, 255, 255, .88);
                -webkit-backdrop-filter: blur(20px) saturate(1.15);
                backdrop-filter: blur(20px) saturate(1.15);
                border: 1px solid rgba(255, 255, 255, .7);
            }
        </style>
    </head>
    <body class="antialiased text-[#271d62]">
        <div class="aurora-ground min-h-screen flex flex-col sm:justify-center items-center pt-10 sm:pt-0 px-4">
            <a href="/" class="mb-8 transition-opacity hover:opacity-80">
                <img src="/brand/aurora-logo-horizontal-white.png" alt="Aurora" class="h-10 w-auto drop-shadow-sm">
            </a>

            <div class="w-full sm:max-w-md px-6 py-6 aurora-card shadow-xl shadow-[#271d62]/15 overflow-hidden rounded-2xl">
                {{ $slot }}
            </div>
        </div>
    </body>
</html>
