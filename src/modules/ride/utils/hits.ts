import type { Lane } from "@/modules/audio";
import { HOP, RATE } from "@/modules/audio";

import type { Hit } from "./judge";

type Onsets = { onsets: number[]; lanes: Lane[]; strengths: number[]; intensity: Float32Array };

// Hits are judged against their neighbours this many seconds either side, not the whole song:
// dense parts smear transients, so globally they'd never rank as hard.
const SPAN = 4;
const WINDOW = Math.round((SPAN * RATE) / HOP);
// Blocks per second from the sparsest parts to the fullest, whatever the song's hit density.
const SPARSE = 0.4;
const FULL = 2;
// Never more than this share of hits, so dense parts still leave plenty to catch.
const MOST = 0.6;
// Seconds in which blocks must never cover all three lanes, so there's always a way through.
const REACH = 0.35;

// How many of its neighbours an onset hits harder than (0–1), and how many hits a second
// are around it.
function standing({ onsets, strengths, i }: { onsets: number[]; strengths: number[]; i: number }) {
	const [frame = 0, strength = 0] = [onsets[i], strengths[i]];
	const near = onsets.flatMap((other, j) =>
		Math.abs(other - frame) <= WINDOW ? [strengths[j] ?? 0] : []
	);
	return {
		rank: near.filter((other) => other < strength).length / near.length,
		density: near.length / (2 * SPAN),
	};
}

// Turns a block back into a pickup when the blocks just before it already cover the other two
// lanes: a wall the player could only dodge by reflex.
function fair(marks: { hit: Hit; block: boolean }[]) {
	return marks.reduce<{ hit: Hit; block: boolean }[]>((kept, mark) => {
		const recent = kept.filter(({ hit, block }) => block && mark.hit.time - hit.time < REACH);
		const lanes = new Set([...recent.map(({ hit }) => hit.lane), mark.hit.lane]);
		return kept.concat(mark.block && lanes.size === 3 ? { ...mark, block: false } : mark);
	}, []);
}

// Every onset becomes something in its band's lane: locally hard hits are blocks to dodge, the
// rest pickups to catch. Fuller music gets more blocks a second, so choruses hit back.
export function hits({ onsets, lanes, strengths, intensity }: Onsets) {
	const rate = (onset: number) => SPARSE + (FULL - SPARSE) * (intensity[onset] ?? 0);
	const blocked = (onset: number, i: number) => {
		const { rank, density } = standing({ onsets, strengths, i });
		return rank >= 1 - Math.min(MOST, rate(onset) / density);
	};
	const all = fair(
		onsets.map((onset, i) => ({
			hit: { time: (onset * HOP) / RATE, lane: lanes[i] ?? 1 },
			block: blocked(onset, i),
		}))
	);
	return {
		pickups: all.filter(({ block }) => !block).map(({ hit }): Hit => hit),
		blocks: all.filter(({ block }) => block).map(({ hit }): Hit => hit),
	};
}
