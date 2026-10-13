import { POINTS } from "@/modules/audio";

import type { Hit } from "../utils/judge";
import { LANES, project } from "../utils/project";
import type { Dot, Pen } from "./canvas";
import { ACCENT, BACKDROP, GUIDE, INK, trace } from "./canvas";

export type Line = { pen: Pen; depth: number; values: Float32Array };
type At = { pen: Pen; depth: number; u: number; value: number };

const SEGMENT = 0.07;
const SKIRT = 0.06;
const GUIDES = [0.4, 0.6];
// Mockup sizes were drawn on a 1000 px tall canvas.
const unit = (pen: Pen) => pen.height / 1000;

export const clamp = (value: number) => Math.min(1, Math.max(0, value));

function dot({ pen, depth, u, value }: At) {
	const { x, y, scale } = project({ depth, u, value });
	return { x: x * pen.width, y: y * pen.height, scale };
}

const dots = ({ pen, depth, values }: Line): Dot[] =>
	[...values].map((value, k) => dot({ pen, depth, u: k / (POINTS - 1), value }));

// Fills black below itself before stroking, so nearer ridges hide farther ones.
export function ridge(line: Line) {
	const { pen, depth } = line;
	const { context } = pen;
	const points = dots(line);
	const { y, scale } = dot({ pen, depth, u: 0.5, value: 0 });
	const floor = y + SKIRT * pen.height;
	const edges = [points.at(-1)?.x ?? 0, points[0]?.x ?? 0].map((x) => ({ x, y: floor }));
	trace({ context, dots: [...points, ...edges] });
	context.fillStyle = BACKDROP;
	context.fill();
	const shade = Math.round(70 + 170 * (1 - clamp(depth)));
	trace({ context, dots: points });
	context.strokeStyle = `rgb(${shade} ${shade - 2} ${shade - 6})`;
	context.lineWidth = Math.max(1, 2.4 * scale) * unit(pen);
	context.stroke();
}

// Blocks are heavier than pickups, so danger reads at a glance even far away.
export function hit({ line, lane, block }: { line: Line; lane: Hit["lane"]; block: boolean }) {
	const { pen, depth } = line;
	const u = LANES[lane];
	const from = Math.round((u - SEGMENT) * (POINTS - 1));
	const to = Math.round((u + SEGMENT) * (POINTS - 1));
	trace({ context: pen.context, dots: dots(line).slice(from, to + 1) });
	const weight = block ? 9 : 5;
	pen.context.strokeStyle = block ? ACCENT : INK;
	pen.context.lineWidth =
		Math.max(2, weight * dot({ pen, depth, u, value: 0 }).scale) * unit(pen);
	pen.context.stroke();
}

// Faint lines between the lanes, converging to the horizon.
export function guides(pen: Pen) {
	pen.context.strokeStyle = GUIDE;
	pen.context.lineWidth = unit(pen);
	GUIDES.forEach((u) => {
		const near = dot({ pen, depth: 0, u, value: 0 });
		const far = dot({ pen, depth: 1, u, value: 0 });
		trace({ context: pen.context, dots: [far, { x: near.x, y: near.y + SKIRT * pen.height }] });
		pen.context.stroke();
	});
}

export function player({ line, u }: { line: Line; u: number }) {
	const { pen, values } = line;
	const { x, y } = dot({ pen, depth: 0, u, value: values[Math.round(u * (POINTS - 1))] ?? 0 });
	pen.context.fillStyle = ACCENT;
	pen.context.beginPath();
	pen.context.arc(x, y, 11 * unit(pen), 0, 2 * Math.PI);
	pen.context.fill();
}
