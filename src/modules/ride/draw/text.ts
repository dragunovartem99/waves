import type { Pen } from "./canvas";
import { BACKDROP, DIM, INK } from "./canvas";

type Text = { pen: Pen; text: string; x: number; y: number; color?: string; bold?: boolean };

// Fractions of the canvas, taken from the 1600×1000 mockup.
export const MARGIN = 0.039;
const LABEL = 0.015;

// Positions are fractions of the canvas; alignment follows the side of the screen.
export function mono({ pen, text, x, y, color = INK, bold = false }: Text) {
	const { context, width, height } = pen;
	context.font = `${bold ? 700 : 400} ${Math.max(11, LABEL * height)}px 'JetBrains Mono'`;
	context.fillStyle = color;
	context.textAlign = x < 0.4 ? "left" : x > 0.6 ? "right" : "center";
	context.fillText(text, x * width, y * height);
}

export const clock = (seconds: number) =>
	`${String(Math.floor(seconds / 60)).padStart(2, "0")}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;

// A centred message with a dim note under it.
export function message({ pen, text, note }: { pen: Pen; text: string; note: string }) {
	mono({ pen, text, x: 0.5, y: 0.5, bold: true });
	mono({ pen, text: note, x: 0.5, y: 0.54, color: DIM });
}

// Black screen with one centred message, for before a song and while it loads.
export function idle({ pen, text, note }: { pen: Pen; text: string; note: string }) {
	pen.context.globalAlpha = 1;
	pen.context.fillStyle = BACKDROP;
	pen.context.fillRect(0, 0, pen.width, pen.height);
	message({ pen, text, note });
}
