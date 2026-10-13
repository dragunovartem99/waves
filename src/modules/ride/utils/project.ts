// `kick` 0–1 is the current kick punch; `phase` (radians) moves its ripple along.
type Point = { depth: number; u: number; value: number; kick?: number; phase?: number };

// Where each lane sits across a ridge: bass, mids, highs.
export const LANES = [0.3, 0.5, 0.7] as const;

// Fractions of the canvas, taken from the 1600×1000 mockup.
const RECEDE = 2.6;
const WIDTH = 0.94;
const FRONT = 0.84;
const HEIGHT = 0.17;
const SPREAD = 0.3;
// On a full kick: ridges grow by LIFT, ripple by RIPPLE across WAVES crests, and dip by DIP.
const LIFT = 0.4;
const RIPPLE = 0.01;
const WAVES = 2.5;
const BEND = 6;
const DIP = 0.008;

// Edges stay low so the ridge reads as a horizon, not a bar chart.
const weight = (u: number) => 0.15 + 0.85 * Math.exp(-(((u - 0.5) / SPREAD) ** 2));

// Ridge point → canvas fractions. depth 0 is the front ridge, 1 the horizon; u 0–1 runs bass to
// treble; value 0–1 is the ridge height. Further ridges shrink toward the centre and rise.
export function project({ depth, u, value, kick = 0, phase = 0 }: Point) {
	const scale = 1 / (1 + depth * RECEDE);
	const height = value * (1 + LIFT * kick) * HEIGHT * scale * weight(u);
	const ripple = RIPPLE * Math.sin(2 * Math.PI * WAVES * u + BEND * depth - phase);
	return {
		x: 0.5 + (u - 0.5) * WIDTH * scale,
		y: FRONT - (1 - scale) - height + kick * scale * (DIP + ripple),
		scale,
	};
}
