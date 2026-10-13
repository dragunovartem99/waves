import { HOP, POINTS, RATE } from "@/modules/audio";

import type { Hit } from "../utils/judge";
import type { Pen } from "./canvas";
import { BACKDROP } from "./canvas";
import { clamp, guides, hit, player, ridge } from "./lines";

// `at` is the playhead in fractional frames; `hits` are the ones not judged yet.
export type Scene = { pen: Pen; ridges: Float32Array; hits: Hit[]; at: number; u: number };
type Item = { depth: number; frame: number; lane?: Hit["lane"] };

const RIDGES = 14;
// Frames between ridges (~0.2 s): sparse enough not to turn into Joy Division.
const SPACING = 9;
const SPAN = RIDGES * SPACING;

// Fades in over the far two ridges, so new ones don't pop in at the horizon.
const fade = (depth: number) => clamp(((1 - depth) * RIDGES) / 2);

function slice({ ridges, frame }: { ridges: Float32Array; frame: number }) {
	const f = Math.round(frame);
	return f < 0 ? new Float32Array(0) : ridges.subarray(f * POINTS, (f + 1) * POINTS);
}

function items({ hits, at }: Scene): Item[] {
	const depth = (frame: number) => (frame - at) / SPAN;
	const first = Math.ceil(at / SPACING) - 1;
	const lines = Array.from({ length: RIDGES + 2 }, (_, i) => (first + i) * SPACING);
	const marks = hits.map(({ time, lane }) => ({ frame: (time * RATE) / HOP, lane }));
	return [
		...lines.map((frame) => ({ frame, depth: depth(frame) })),
		...marks.map(({ frame, lane }) => ({ frame, lane, depth: depth(frame) })),
	]
		.filter(({ depth: d }) => d > 0 && d <= 1)
		.toSorted((a, b) => b.depth - a.depth);
}

function paint({ view, item }: { view: Scene; item: Item }) {
	const { pen, ridges } = view;
	const { depth, frame, lane } = item;
	const line = { pen, depth, values: slice({ ridges, frame }) };
	if (line.values.length < POINTS) return;
	pen.context.globalAlpha = fade(depth);
	if (lane === undefined) ridge(line);
	else hit({ line, lane });
}

// Ridges sit at fixed song frames and glide toward the viewer as `at` advances, so motion is
// continuous; hits ride on their own frame's line. Painted far → near for occlusion, ending
// with the live front ridge (the spectrum right now) that the player rides on.
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
