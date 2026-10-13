import type { Score } from "../utils/judge";
import type { Pen } from "./canvas";
import { ACCENT, BACKDROP, DIM, INK } from "./canvas";

export type Hud = {
	pen: Pen;
	score: Score;
	title: string;
	now: number;
	duration: number;
	hint: string;
};
type Text = { pen: Pen; text: string; x: number; y: number; color?: string; bold?: boolean };

// Fractions of the canvas, taken from the 1600×1000 mockup.
const MARGIN = 0.039;
const LABEL = 0.015;
const SCORE = 0.12;
const DIGITS = 5;

// Positions are fractions of the canvas; alignment follows the side of the screen.
function mono({ pen, text, x, y, color = INK, bold = false }: Text) {
	const { context, width, height } = pen;
	context.font = `${bold ? 700 : 400} ${Math.max(11, LABEL * height)}px 'JetBrains Mono'`;
	context.fillStyle = color;
	context.textAlign = x < 0.4 ? "left" : x > 0.6 ? "right" : "center";
	context.fillText(text, x * width, y * height);
}

const clock = (seconds: number) =>
	`${String(Math.floor(seconds / 60)).padStart(2, "0")}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;

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

export function hud(view: Hud) {
	view.pen.context.globalAlpha = 1;
	score(view);
	footer(view);
}

// Black screen with one centred message, for before a song and while it loads.
export function idle({ pen, text, note }: { pen: Pen; text: string; note: string }) {
	pen.context.globalAlpha = 1;
	pen.context.fillStyle = BACKDROP;
	pen.context.fillRect(0, 0, pen.width, pen.height);
	mono({ pen, text, x: 0.5, y: 0.5, bold: true });
	mono({ pen, text: note, x: 0.5, y: 0.54, color: DIM });
}
