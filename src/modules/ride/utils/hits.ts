import { HOP, RATE } from "@/modules/audio";

import type { Hit } from "./judge";
import { maxima } from "./maxima";
import type { Lane } from "./project";
import { random } from "./random";
import { rings } from "./rings";
import type { Swell } from "./swells";
import { swells } from "./swells";
import { tilts } from "./tilt";

type Timed = Swell & { time: number };
type Spot = Timed & { lane: Lane; block: boolean };

// Share of hits that are blocks to dodge, weakest first: 0.55 casual, 0.75 hard.
export const BLOCKS = 0.55;
const LANES = [0, 1, 2] as const;
// Least real-time gap between hits, so density does not grow with speed.
const SPACING = 0.25;
const INTRO = 1;

const seconds = (frame: number) => (frame * HOP) / RATE;
const hit = ({ time, lane }: Spot): Hit => ({ time, lane });

// The weakest BLOCKS share of swells become blocks, the rest pickups; lanes are random but the
// same on every ride of a song.
function split({ found, seed }: { found: Timed[]; seed: number }): Spot[] {
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

// Drops hits that would leave too little time to steer, whatever the current speed.
const thin = (spots: Spot[]) =>
	spots.reduce<Spot[]>((kept, spot) => {
		const last = kept.at(-1);
		return last && spot.time - last.time < SPACING ? kept : kept.concat(spot);
	}, []);

// A hit on each swell of the music, the strongest pickups to catch and the rest blocks to dodge,
// at the time the ride reaches its ring.
export function hits(speeds: Float32Array) {
	const laid = rings(speeds);
	const found = swells(maxima(tilts(laid))).map((swell) =>
		Object.assign(swell, { time: seconds(laid[swell.ring]?.frame ?? 0) })
	);
	const spots = thin(split({ found, seed: speeds.length })).filter(({ time }) => time >= INTRO);
	return {
		pickups: spots.filter(({ block }) => !block).map((spot) => hit(spot)),
		blocks: spots.filter(({ block }) => block).map((spot) => hit(spot)),
	};
}
