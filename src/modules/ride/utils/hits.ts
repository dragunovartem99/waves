import type { Lane } from "@/modules/audio";
import { HOP, RATE } from "@/modules/audio";

import type { Hit } from "./judge";

type Onsets = { onsets: number[]; lanes: Lane[]; strengths: number[] };

// Share of onsets, the hardest ones, that turn into blocks to dodge.
const BLOCKS = 0.25;

// Every onset becomes something in its band's lane: the hardest hits are blocks to dodge, the
// rest pickups to catch.
export function hits({ onsets, lanes, strengths }: Onsets) {
	const sorted = strengths.toSorted((a, b) => a - b);
	const cut = sorted[Math.floor((1 - BLOCKS) * sorted.length)] ?? Infinity;
	const all = onsets.map((onset, i) => ({
		hit: { time: (onset * HOP) / RATE, lane: lanes[i] ?? 1 },
		block: (strengths[i] ?? 0) >= cut,
	}));
	return {
		pickups: all.filter(({ block }) => !block).map(({ hit }): Hit => hit),
		blocks: all.filter(({ block }) => block).map(({ hit }): Hit => hit),
	};
}
