type Song = { intensity: Float32Array; kicks: Float32Array; bpm?: number };
type At = { track: Float32Array; frame: number };
type Find = { track: Float32Array; distance: number };

// Average distance per frame at 120 BPM; with the view SPAN deep, sets how far ahead you see.
export const PACE = 1.4;
// Faster songs ride faster overall, within limits so slow ones don't drag or fast ones blur.
const TEMPO = 120;
const TEMPO_RANGE = [0.8, 1.35] as const;
// Speed range before scaling to PACE: sparse parts crawl, full ones (choruses, drops) rush.
const SLOW = 0.4;
const FAST = 3;
// Above 1 keeps middling sections calm, so the jump into a chorus stands out.
const CURVE = 1.5;
// Extra speed at a full kick, so each one shoves you forward.
const JOLT = 1.5;

const pace = (bpm: number) =>
	PACE * Math.min(TEMPO_RANGE[1], Math.max(TEMPO_RANGE[0], bpm / TEMPO));

// Distance travelled by the start of each frame, averaging PACE per frame (scaled by tempo).
export function track({ intensity, kicks, bpm = TEMPO }: Song) {
	const speeds = intensity.map(
		(x, i) => SLOW + (FAST - SLOW) * x ** CURVE + JOLT * (kicks[i] ?? 0)
	);
	const mean = speeds.reduce((sum, speed) => sum + speed, 0) / (speeds.length || 1);
	const out = new Float32Array(speeds.length + 1);
	speeds.forEach((speed, i) => (out[i + 1] = (out[i] ?? 0) + (pace(bpm) * speed) / mean));
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
