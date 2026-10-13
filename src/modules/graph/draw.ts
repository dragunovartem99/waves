import type { Analysis } from "@/modules/audio";

type View = { canvas: HTMLCanvasElement; analysis: Analysis; from: number; to: number; at: number };
type Layer = { context: CanvasRenderingContext2D; x: (frame: number) => number };

const LINE = "#3ef0ff";
const ONSET = "#ff3e9a";
const HEAD = "#ffffff";
const TICK = 0.3;

function fit(canvas: HTMLCanvasElement) {
	const width = Math.round(canvas.clientWidth * devicePixelRatio);
	const height = Math.round(canvas.clientHeight * devicePixelRatio);
	if (canvas.width !== width || canvas.height !== height)
		Object.assign(canvas, { width, height });
}

function curve({ context, view }: { context: CanvasRenderingContext2D; view: View }) {
	const { canvas, analysis, from, to } = view;
	const max = analysis.envelope.reduce((top, value) => Math.max(top, value), 0) || 1;
	context.strokeStyle = LINE;
	context.lineWidth = devicePixelRatio;
	context.beginPath();
	for (let px = 0; px < canvas.width; px++) {
		const value = analysis.envelope[Math.floor(from + (px / canvas.width) * (to - from))] ?? 0;
		context.lineTo(px, canvas.height * (1 - TICK - (1 - TICK) * 0.9 * (value / max)));
	}
	context.stroke();
}

function mark({ context, x, at, color, top }: Layer & { at: number; color: string; top: number }) {
	context.fillStyle = color;
	context.fillRect(
		Math.round(x(at)),
		context.canvas.height * top,
		devicePixelRatio,
		context.canvas.height
	);
}

export function draw(view: View) {
	const { canvas, analysis, from, to, at } = view;
	const context = canvas.getContext("2d");
	if (!context) return;
	fit(canvas);
	const x = (frame: number) => ((frame - from) / (to - from)) * canvas.width;
	context.clearRect(0, 0, canvas.width, canvas.height);
	curve({ context, view });
	analysis.onsets
		.filter((onset) => onset >= from && onset <= to)
		.forEach((onset) => mark({ context, x, at: onset, color: ONSET, top: 1 - TICK }));
	mark({ context, x, at, color: HEAD, top: 0 });
}
