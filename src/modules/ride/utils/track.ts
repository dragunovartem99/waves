type Song = { intensity: Float32Array; kicks: Float32Array };
type At = { track: Float32Array; frame: number };
type Find = { track: Float32Array; distance: number };

// Average distance per frame; with ridges SPAN apart in distance, sets how far ahead you see.
export const PACE = 1.6;
// Speed range before scaling to PACE: sparse parts crawl, full ones (choruses, drops) rush.
const SLOW = 0.4;
const FAST = 3;
// Above 1 keeps middling sections calm, so the jump into a chorus stands out.
const CURVE = 1.5;
// Extra speed at a full kick, so each one shoves you forward.
const JOLT = 1.5;

// Distance travelled by the start of each frame, averaging PACE per frame.
export function track({ intensity, kicks }: Song) {
	const speeds = intensity.map(
		(x, i) => SLOW + (FAST - SLOW) * x ** CURVE + JOLT * (kicks[i] ?? 0)
	);
	const mean = speeds.reduce((sum, speed) => sum + speed, 0) / (speeds.length || 1);
	const out = new Float32Array(speeds.length + 1);
	speeds.forEach((speed, i) => (out[i + 1] = (out[i] ?? 0) + (PACE * speed) / mean));
	return out;
}

// Distance at a fractional frame; past either end it runs on at the edge frame's speed.
export function distance({ track: line, frame }: At) {
	const last = line.length - 1;
	const i = Math.min(Math.max(Math.floor(frame), 0), Math.max(last - 1, 0));
	const [a = 0, b = a + 1] = [line[i], line[i + 1]];
	return a + (b - a) * (frame - i);
}

// Inverse of `distance`: binary search for the fractional frame at a distance.
export function frameAt({ track: line, distance: target }: Find) {
	let [low, high] = [0, line.length - 1];
	while (high - low > 1) {
		const middle = (low + high) >> 1;
		if ((line[middle] ?? 0) <= target) low = middle;
		else high = middle;
	}
	const [a = 0, b = a + 1] = [line[low], line[high]];
	return low + (target - a) / (b - a || 1);
}
