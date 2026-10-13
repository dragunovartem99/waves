type Point = { depth: number; u: number; value: number };

// Fractions of the canvas, taken from the 1600×1000 mockup.
const RECEDE = 2.6;
const WIDTH = 0.94;
const FRONT = 0.84;
const HEIGHT = 0.17;
const SPREAD = 0.3;

// Edges stay low so the ridge reads as a horizon, not a bar chart.
const weight = (u: number) => 0.15 + 0.85 * Math.exp(-(((u - 0.5) / SPREAD) ** 2));

// Ridge point → canvas fractions. depth 0 is the front ridge, 1 the horizon; u 0–1 runs bass to
// treble; value 0–1 is the ridge height. Further ridges shrink toward the centre and rise.
export function project({ depth, u, value }: Point) {
	const scale = 1 / (1 + depth * RECEDE);
	return {
		x: 0.5 + (u - 0.5) * WIDTH * scale,
		y: FRONT - (1 - scale) - value * HEIGHT * scale * weight(u),
		scale,
	};
}
