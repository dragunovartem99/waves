// Rings per frame at full speed. Ring counts in tilt, maxima and hits are tuned to this spacing.
export const RINGS = 1.68;

// A slice of track at equal distance: the frame it falls in and the top speed since the last.
export type Ring = { frame: number; speed: number };

// Rings laid every 1/RINGS of full-speed travel, so fast parts get more of them per second.
export function rings(speeds: Float32Array) {
	const out: Ring[] = [];
	let travelled = 0;
	let peak = 0;
	speeds.forEach((speed, frame) => {
		peak = Math.max(peak, speed);
		travelled += RINGS * speed;
		const count = Math.floor(travelled);
		if (count === 0) return;
		travelled -= count;
		out.push(...Array.from({ length: count }, () => ({ frame, speed: peak })));
		peak = 0;
	});
	return out;
}
