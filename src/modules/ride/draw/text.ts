import type { Pen } from "./canvas";
import { DIM } from "./canvas";

type Text = {
	pen: Pen;
	text: string;
	x: number;
	y: number;
	color?: string;
	bold?: boolean;
	tight?: boolean;
};

// Fractions of the canvas, taken from the 1600×1000 mockup.
export const MARGIN = 0.039;
const LABEL = 0.015;
// Letter spacing for long lines, as a share of the font size: Azeret's narrow glyphs sit loose.
const TIGHT = -0.05;

// Positions are fractions of the canvas; alignment follows the side of the screen.
export function mono({ pen, text, x, y, color = DIM, bold = false, tight = false }: Text) {
	const { context, width, height } = pen;
	const size = Math.max(11, LABEL * height);
	context.font = `${bold ? 700 : 400} ${size}px 'Azeret Mono'`;
	// Set on every call: canvas keeps it, and it would leak into the next text.
	context.letterSpacing = `${tight ? TIGHT * size : 0}px`;
	context.fillStyle = color;
	context.textAlign = x < 0.4 ? "left" : x > 0.6 ? "right" : "center";
	context.fillText(text, x * width, y * height);
}

export const clock = (seconds: number) =>
	`${String(Math.floor(seconds / 60)).padStart(2, "0")}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
