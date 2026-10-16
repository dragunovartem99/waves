import { HOP, RATE } from "@/modules/audio";

import type { Hit } from "./judge";
import { maxima } from "./maxima";
import type { Lane } from "./project";
import { random } from "./random";
import { rings } from "./rings";
import type { Swell } from "./swells";
import { swells } from "./swells";
import { tilts } from "./tilt";

type Spot = Swell & { lane: Lane; block: boolean };

// Share of hits that are blocks to dodge, weakest first: 0.55 casual, 0.75 hard.
export const BLOCKS = 0.55;
const LANES = [0, 1, 2] as const;
// Rings within which a hit joins the chain it follows, and rings a block keeps from the last hit.
const CHAIN = 5;
const SPACING = 11;

const seconds = (frame: number) => (frame * HOP) / RATE;

// The weakest BLOCKS share of swells become blocks, the rest pickups; lanes are random but the
// same on every ride of a song.
function split({ found, seed }: { found: Swell[]; seed: number }): Spot[] {
	const order = [...found.keys()].toSorted(
		(a, b) => (found[a]?.strength ?? 0) - (found[b]?.strength ?? 0)
	);
	const weak = new Set(order.slice(0, Math.floor(BLOCKS * found.length)));
	const next = random(seed);
	return found.map((swell, i) => ({
		...swell,
		lane: LANES[Math.floor(next() * LANES.length)] ?? 1,
		block: weak.has(i),
	}));
}

// A hit right after a chain's first takes its kind and lane, so close hits string together.
function chain(spots: Spot[]) {
	let head: Spot | undefined;
	return spots.map((spot) => {
		if (head && spot.ring - head.ring < CHAIN)
			return { ...spot, lane: head.lane, block: head.block };
		head = spot;
		return spot;
	});
}

// Drops a block too soon after the last hit kept, so blocks never crowd.
const thin = (spots: Spot[]) =>
	spots.reduce<Spot[]>((kept, spot) => {
		const last = kept.at(-1);
		return spot.block && last && spot.ring - last.ring < SPACING ? kept : kept.concat(spot);
	}, []);

// A hit on each swell of the music, the strongest pickups to catch and the rest blocks to dodge,
// at the time the ride reaches its ring.
export function hits(speeds: Float32Array) {
	const laid = rings(speeds);
	const found = swells(maxima(tilts(laid)));
	const spots = thin(chain(split({ found, seed: speeds.length })));
	const hit = ({ ring, lane }: Spot): Hit => ({ time: seconds(laid[ring]?.frame ?? 0), lane });
	return {
		pickups: spots.filter(({ block }) => !block).map((spot) => hit(spot)),
		blocks: spots.filter(({ block }) => block).map((spot) => hit(spot)),
	};
}
