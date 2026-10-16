import type { Ring } from "./rings";

// Ring speed → desired tilt in radians: calm climbs, full speed dives.
const KEYS = [
	[0, 0.7],
	[0.4, 0.5],
	[0.5, 0],
	[0.6, -0.5],
	[1, -0.7],
] as const;
// Share of the way to the desired tilt covered per ring, and the steepest tilt either way.
const EASE = 0.04;
const STEEPEST = 0.7;

// Linear between keys; speeds stay within 0–1, inside them.
function desired(speed: number) {
	const above = KEYS.findIndex(([x]) => x >= speed);
	const i = Math.max(1, above);
	const [[x0, y0], [x1, y1]] = [KEYS[i - 1] ?? KEYS[0], KEYS[i] ?? KEYS[1]];
	return y0 + ((y1 - y0) * (speed - x0)) / (x1 - x0);
}

// The track's tilt at each ring, easing toward the curve so a swell steepens it gradually.
export function tilts(rings: Ring[]) {
	let tilt = 0;
	return rings.map(({ speed }) => {
		const next = tilt + (desired(speed) - tilt) * EASE;
		tilt = Math.min(STEEPEST, Math.max(-STEEPEST, next));
		return tilt;
	});
}
