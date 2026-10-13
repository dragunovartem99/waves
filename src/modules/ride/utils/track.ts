import { smooth } from "@/modules/audio";

type Song = { envelope: Float32Array; kicks: Float32Array };
type At = { track: Float32Array; frame: number };
type Find = { track: Float32Array; distance: number };

// Average distance per frame; with ridges SPAN apart in distance, sets how far ahead you see.
export const PACE = 1.6;
// Speed range before scaling to PACE: quiet parts crawl, loud ones rush.
const SLOW = 0.5;
const FAST = 2.6;
// Extra speed at a full kick, so each one shoves you forward.
const JOLT = 2.5;
const PERCENTILE = 0.98;
// Loudness smoothing: fast enough to follow a drop within a beat or two.
const SWELL = 0.08;

const loudness = (envelope: Float32Array) => {
	const top = envelope.toSorted()[Math.floor(PERCENTILE * (envelope.length - 1))] ?? 0;
	return envelope.map((value) => Math.min(1, value / (top || 1)));
};

// Distance travelled by the start of each frame, averaging PACE per frame.
export function track({ envelope, kicks }: Song) {
	const swells = smooth({
		values: loudness(envelope).map((x) => SLOW + (FAST - SLOW) * x * x),
		factor: SWELL,
	});
	const speeds = swells.map((speed, i) => speed + JOLT * (kicks[i] ?? 0));
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
