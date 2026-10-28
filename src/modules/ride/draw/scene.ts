import { HOP, POINTS, RATE } from "@/modules/audio";

import type { Ridge } from "../utils/grid";
import type { Hit } from "../utils/judge";
import { distance } from "../utils/track";
import type { Pen } from "./canvas";
import { BACKDROP } from "./canvas";
import { clamp, guides, hit, player, ridge } from "./lines";

// `at` is the playhead in fractional frames; `pickups` and `blocks` are the ones not judged yet.
export type Scene = {
	pen: Pen;
	ridges: Float32Array;
	track: Float32Array;
	grid: Ridge[];
	pickups: Hit[];
	blocks: Hit[];
	at: number;
	u: number;
};
type Item = { depth: number; frame: number; beat?: boolean; lane?: Hit["lane"]; block?: boolean };

// Track distance from the front ridge to the horizon.
const SPAN = 126;
// Ridges fade in over the far seventh, so new ones don't pop in at the horizon.
const FADE = 1 / 7;
const fade = (depth: number) => clamp((1 - depth) / FADE);

function slice({ ridges, frame }: { ridges: Float32Array; frame: number }) {
	const f = Math.round(frame);
	return f < 0 ? new Float32Array(0) : ridges.subarray(f * POINTS, (f + 1) * POINTS);
}

const visible = (items: Item[]) =>
	items.filter(({ depth }) => depth > 0 && depth <= 1).toSorted((a, b) => b.depth - a.depth);

// Ridges sit on the beat grid, so each one reaches the player in time with the music.
function lines({ track, grid, at }: Scene): Item[] {
	const now = distance({ track, frame: at });
	return visible(
		grid.map(({ frame, beat, distance: far }) => ({ frame, beat, depth: (far - now) / SPAN }))
	);
}

function marks({ track, pickups, blocks, at }: Scene): Item[] {
	const now = distance({ track, frame: at });
	const mark = ({ hit: { time, lane }, block }: { hit: Hit; block: boolean }) => {
		const frame = (time * RATE) / HOP;
		return { frame, lane, block, depth: (distance({ track, frame }) - now) / SPAN };
	};
	return visible([
		...pickups.map((entry) => mark({ hit: entry, block: false })),
		...blocks.map((entry) => mark({ hit: entry, block: true })),
	]);
}

function paint({ view, item }: { view: Scene; item: Item }) {
	const { pen, ridges } = view;
	const { depth, frame, beat = true, lane, block = false } = item;
	const line = { pen, depth, values: slice({ ridges, frame }), beat };
	if (line.values.length < POINTS) return;
	pen.context.globalAlpha = fade(depth);
	if (lane === undefined) ridge(line);
	else hit({ line, lane, block });
}

// Ridges are painted far → near for occlusion, ending with the live front ridge (the spectrum
// right now) that the player rides on. Hits go over all of them: a nearer ridge must never hide one.
export function scene(view: Scene) {
	const { pen, ridges, at, u } = view;
	pen.context.globalAlpha = 1;
	pen.context.fillStyle = BACKDROP;
	pen.context.fillRect(0, 0, pen.width, pen.height);
	guides(pen);
	lines(view).forEach((item) => paint({ view, item }));
	pen.context.globalAlpha = 1;
	const front = { pen, depth: 0, values: slice({ ridges, frame: at }) };
	if (front.values.length >= POINTS) ridge(front);
	marks(view).forEach((item) => paint({ view, item }));
	pen.context.globalAlpha = 1;
	if (front.values.length >= POINTS) player({ line: front, u });
}
