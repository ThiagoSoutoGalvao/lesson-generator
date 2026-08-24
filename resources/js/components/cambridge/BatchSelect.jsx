// Groups a flat array of items by their `batch` field (defaulting ungrouped items to batch 1),
// sorted by batch number, so newer content batches can render as their own labeled row/button.
export function groupByBatch(items) {
    const map = new Map();
    for (const item of items) {
        const batch = item.batch ?? 1;
        if (!map.has(batch)) map.set(batch, []);
        map.get(batch).push(item);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([batch, batchItems]) => ({ batch, items: batchItems }));
}

// Shared "choose a batch" screen for the flat-item-pool speaking drills (Long Turn, Collaborative
// Task, Discussion) — these had no select screen at all before batching, unlike Interview which
// already picks a named topic. Renders as a single row of buttons (All + one per batch), never a
// stacked column, so a new batch is always visually distinct rather than silently growing a list.
export default function BatchSelect({ allItems, batches, unitLabel = 'items', onSelect }) {
    return (
        <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="flex flex-col gap-4 max-w-2xl w-full mx-auto">
                <p className="text-white/60 text-sm text-center">Pick a set to work through together.</p>
                <div className="flex flex-row flex-wrap justify-center gap-3">
                    {batches.length > 1 && (
                        <button
                            onClick={() => onSelect(allItems)}
                            className="flex-1 min-w-[160px] px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white font-bold transition-all cursor-pointer text-center"
                        >
                            <p className="text-lg">All</p>
                            <p className="text-white/40 text-xs font-normal mt-1">{allItems.length} {unitLabel}</p>
                        </button>
                    )}
                    {batches.map(({ batch, items }) => (
                        <button
                            key={batch}
                            onClick={() => onSelect(items)}
                            className="flex-1 min-w-[160px] px-6 py-6 rounded-2xl bg-white/8 border border-white/20 hover:bg-white/15 hover:border-white/40 text-white font-bold transition-all cursor-pointer text-center"
                        >
                            <p className="text-lg">Batch {batch}</p>
                            <p className="text-white/40 text-xs font-normal mt-1">{items.length} {unitLabel}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
