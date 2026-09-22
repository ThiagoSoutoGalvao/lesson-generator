<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Lesson Generator</title>
        <link rel="icon" type="image/png" href="/brand/aurora-symbol.png">
        {{-- "Add to Home Screen" (Aurora students/teachers on a phone): without these, the browser makes up its own
             icon from the page title's first letter — that's the plain "L" that was showing up. --}}
        <link rel="manifest" href="/manifest.json">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        <meta name="theme-color" content="#1A0F3D">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Aurora">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
        @php($auroraUser = auth()->user()?->only(['id', 'name', 'role', 'trilha', 'is_active']))
        <script>window.__AURORA_USER__ = @json($auroraUser); window.__AURORA_LOCAL__ = @json(app()->isLocal());</script>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/App.jsx'])
    </head>
    <body>
        <div id="app"></div>
    </body>
</html>
