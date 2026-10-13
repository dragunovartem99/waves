import { LIVES } from "../utils/crash";
import type { Score } from "../utils/judge";
import type { Pen } from "./canvas";
import { ACCENT, DIM, INK } from "./canvas";
import { clock, MARGIN, message, mono } from "./text";

export type Hud = {
	pen: Pen;
	score: Score;
	title: string;
	now: number;
	duration: number;
	hint: string;
	lives: number;
	// 1 right after a crash, fading to 0.
	flash: number;
	banner?: { text: string; note: string };
};
// Fractions of the canvas, taken from the 1600×1000 mockup.
const SCORE = 0.12;
const DIGITS = 5;
const FLASH = 0.35;
const DOT = 0.008;

function score({ pen, score: { score: points, streak } }: Hud) {
	const { context, width, height } = pen;
	mono({ pen, text: "SCORE", x: MARGIN, y: 0.056 });
	context.font = `900 ${SCORE * height}px Archivo`;
	context.fillStyle = INK;
	context.textAlign = "left";
	context.fillText(
		String(points).padStart(DIGITS, "0"),
		MARGIN * width * 0.9,
		(0.056 + SCORE * 0.88) * height
	);
	mono({ pen, text: "STREAK", x: MARGIN, y: 0.09 + SCORE });
	mono({ pen, text: `×${streak}`, x: MARGIN + 0.05, y: 0.09 + SCORE, color: ACCENT, bold: true });
}

function footer({ pen, title, now, duration, hint }: Hud) {
	const { context, width, height } = pen;
	mono({ pen, text: title, x: MARGIN, y: 0.952 });
	mono({ pen, text: `${clock(now)} / ${clock(duration)}`, x: 1 - MARGIN, y: 0.952 });
	mono({ pen, text: hint, x: 0.5, y: 0.94, color: DIM });
	const [left, full] = [MARGIN * width, (1 - 2 * MARGIN) * width];
	context.fillStyle = "#333";
	context.fillRect(left, 0.97 * height, full, Math.max(1, height / 1000));
	context.fillStyle = ACCENT;
	context.fillRect(
		left,
		0.97 * height,
		full * Math.min(1, now / duration),
		Math.max(2, (2 * height) / 1000)
	);
}

function lives({ pen, lives: left }: Hud) {
	const { context, width, height } = pen;
	mono({ pen, text: "LIVES", x: 1 - MARGIN - 0.07, y: 0.056, color: DIM });
	Array.from({ length: LIVES }, (_, i) => {
		context.beginPath();
		context.arc(
			(1 - MARGIN - i * 0.022) * width - DOT * height,
			0.05 * height,
			DOT * height,
			0,
			2 * Math.PI
		);
		context.fillStyle = LIVES - i <= left ? INK : "#333";
		return context.fill();
	});
}

function banner({ pen, banner: shown }: Hud) {
	if (!shown) return;
	const { context, width, height } = pen;
	context.fillStyle = "rgb(0 0 0 / 0.6)";
	context.fillRect(0, 0.42 * height, width, 0.16 * height);
	message({ pen, ...shown });
}

export function hud(view: Hud) {
	const { pen, flash } = view;
	pen.context.globalAlpha = FLASH * flash;
	pen.context.fillStyle = ACCENT;
	pen.context.fillRect(0, 0, pen.width, pen.height);
	pen.context.globalAlpha = 1;
	score(view);
	lives(view);
	footer(view);
	banner(view);
}
