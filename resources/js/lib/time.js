// Small relative-time formatter for progress feeds (Phase S5) — no library,
// just the handful of buckets these lists actually need.
export function relativeTime(dateStr) {
    if (!dateStr) return '';
    const then = new Date(dateStr.replace(' ', 'T'));
    const diffMs = Date.now() - then.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day === 1) return 'yesterday';
    if (day < 7) return `${day}d ago`;
    return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
