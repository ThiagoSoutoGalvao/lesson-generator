// Set by welcome.blade.php from APP_ENV. True only on a developer machine (Herd / `php artisan serve`),
// never on Railway — so an account created here can't be mistaken for one that exists on the live site.
export const IS_LOCAL = typeof window !== 'undefined' && window.__AURORA_LOCAL__ === true;

export default function EnvBadge() {
    if (!IS_LOCAL) return null;

    return (
        <div
            role="status"
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] pointer-events-none select-none rounded-b-lg bg-[#f5b400] px-3 py-0.5 text-[11px] font-bold tracking-wide text-[#1a1200] shadow-md"
        >
            LOCAL — not the live site
        </div>
    );
}
