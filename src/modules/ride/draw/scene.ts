import { HOP, POINTS, RATE } from "@/modules/audio";

import type { Hit } from "../utils/judge";
import { distance, frameAt } from "../utils/track";
import type { Pen } from "./canvas";
import { BACKDROP } from "./canvas";
import { clamp, guides, hit, player, ridge } from "./lines";

// `at` is the playhead in fractional frames; `pickups` and `blocks` are the ones not judged yet.
export type Scene = {
	pen: Pen;
	ridges: Float32Array;
	track: Float32Array;
	pickups: Hit[];
	blocks: Hit[];
	at: number;
	u: number;
};
type Item = { depth: number; frame: number; lane?: Hit["lane"]; block?: boolean };

const RIDGES = 14;
// Track distance between ridges (~0.2 s at average speed): sparse enough not to turn into
// Joy Division.
const SPACING = 9;
const SPAN = RIDGES * SPACING;

// Fades in over the far two ridges, so new ones don't pop in at the horizon.
const fade = (depth: number) => clamp(((1 - depth) * RIDGES) / 2);

function slice({ ridges, frame }: { ridges: Float32Array; frame: number }) {
	const f = Math.round(frame);
	return f < 0 ? new Float32Array(0) : ridges.subarray(f * POINTS, (f + 1) * POINTS);
}

// Ridges sit at fixed track distances, so they always keep their spacing and only their speed
// changes with the song's loudness.
function items({ track, pickups, blocks, at }: Scene): Item[] {
	const now = distance({ track, frame: at });
	const first = Math.floor(now / SPACING) + 1;
	const lines = Array.from({ length: RIDGES }, (_, i) => {
		const far = (first + i) * SPACING;
		return { frame: frameAt({ track, distance: far }), depth: (far - now) / SPAN };
	});
	const mark = ({ hit: { time, lane }, block }: { hit: Hit; block: boolean }) => {
		const frame = (time * RATE) / HOP;
		return { frame, lane, block, depth: (distance({ track, frame }) - now) / SPAN };
	};
	const marks = [
		...pickups.map((entry) => mark({ hit: entry, block: false })),
		...blocks.map((entry) => mark({ hit: entry, block: true })),
	];
	return [...lines, ...marks]
		.filter(({ depth }) => depth > 0 && depth <= 1)
		.toSorted((a, b) => b.depth - a.depth);
}

function paint({ view, item }: { view: Scene; item: Item }) {
	const { pen, ridges } = view;
	const { depth, frame, lane, block = false } = item;
	const line = { pen, depth, values: slice({ ridges, frame }) };
	if (line.values.length < POINTS) return;
	pen.context.globalAlpha = fade(depth);
	if (lane === undefined) ridge(line);
	else hit({ line, lane, block });
}

// Painted far → near for occlusion, ending with the live front ridge (the spectrum right now)
// that the player rides on.
export function scene(view: Scene) {
	const { pen, ridges, at, u } = view;
	pen.context.globalAlpha = 1;
	pen.context.fillStyle = BACKDROP;
	pen.context.fillRect(0, 0, pen.width, pen.height);
	guides(pen);
	items(view).forEach((item) => paint({ view, item }));
	pen.context.globalAlpha = 1;
	const front = { pen, depth: 0, values: slice({ ridges, frame: at }) };
	if (front.values.length < POINTS) return;
	ridge(front);
	player({ line: front, u });
}
