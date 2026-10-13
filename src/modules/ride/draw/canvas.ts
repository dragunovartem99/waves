export type Pen = { context: CanvasRenderingContext2D; width: number; height: number };
export type Dot = { x: number; y: number };

export const ACCENT = "#ff6b1a";
export const INK = "#f1efe9";
export const DIM = "#8a8883";
export const GUIDE = "#2a2a2a";
export const BACKDROP = "#000";

// Canvas text doesn't request web fonts; without this the first frames fall back.
const FONTS = ["900 100px Archivo", "400 15px 'JetBrains Mono'", "700 15px 'JetBrains Mono'"];

export const loadFonts = () => Promise.all(FONTS.map((font) => document.fonts.load(font)));

// Matches the backing store to the CSS size × pixel ratio, so lines stay crisp.
export function fit(canvas: HTMLCanvasElement): Pen {
	const width = Math.round(canvas.clientWidth * devicePixelRatio);
	const height = Math.round(canvas.clientHeight * devicePixelRatio);
	if (canvas.width !== width || canvas.height !== height)
		Object.assign(canvas, { width, height });
	const context = canvas.getContext("2d");
	if (!context) throw new Error("No 2D canvas");
	return { context, width, height };
}

export function trace({ context, dots }: { context: CanvasRenderingContext2D; dots: Dot[] }) {
	context.beginPath();
	dots.forEach(({ x, y }) => context.lineTo(x, y));
}
