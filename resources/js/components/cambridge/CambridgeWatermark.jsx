// Generic academic mortarboard + open book — evokes graduation/exam-prep without
// using Cambridge's actual crest, shield, or wordmark (all trademarked). Blue/gold
// palette (collegiate gown colours) instead of DET's amber owl, so the two practice
// modes read as visually distinct at a glance.
export default function CambridgeWatermark() {
    return (
        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <svg viewBox="0 0 400 460" className="opacity-[0.20] w-auto h-[85%] max-w-[90%]" aria-hidden="true">
                {/* open book */}
                <line x1="200" y1="298" x2="200" y2="392" stroke="#1e3a8a" strokeWidth="4" />
                <polygon points="200,300 54,326 54,406 200,392" fill="#93c5fd" />
                <polygon points="200,300 346,326 346,406 200,392" fill="#93c5fd" />
                <line x1="86" y1="348" x2="176" y2="338" stroke="#eff6ff" strokeWidth="3" opacity="0.6" />
                <line x1="86" y1="368" x2="176" y2="358" stroke="#eff6ff" strokeWidth="3" opacity="0.6" />
                <line x1="224" y1="338" x2="314" y2="348" stroke="#eff6ff" strokeWidth="3" opacity="0.6" />
                <line x1="224" y1="358" x2="314" y2="368" stroke="#eff6ff" strokeWidth="3" opacity="0.6" />

                {/* mortarboard cap */}
                <ellipse cx="200" cy="248" rx="72" ry="28" fill="#1d4ed8" />
                <rect x="115" y="93" width="170" height="170" fill="#2563eb" transform="rotate(45 200 178)" />
                <circle cx="200" cy="178" r="11" fill="#facc15" />

                {/* tassel */}
                <path d="M200 178 L262 206 L272 250" fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
                <circle cx="272" cy="256" r="9" fill="#facc15" />
            </svg>
        </div>
    );
}
