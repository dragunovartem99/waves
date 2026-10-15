type Song = { motion: Float32Array; kicks: Float32Array };
type At = { track: Float32Array; frame: number };
type Find = { track: Float32Array; distance: number };

// Average distance per frame; with the view SPAN deep, sets how far ahead you see.
export const PACE = 1.9;
// Least share of average speed: below it, hits a beat apart would land on top of each other.
const LEAST = 0.33;
// Share of average speed a full kick adds, the same everywhere: a leap from a calm crawl, a nudge
// in a loud part.
const JOLT = 0.25;

// Distance travelled by the start of each frame. Speed follows how much the music moves: twice
// the motion rides twice as fast, down to a crawl where little moves, and each kick shoves.
export function track({ motion, kicks }: Song) {
	const mean = motion.reduce((sum, value) => sum + value, 0) / (motion.length || 1);
	const out = new Float32Array(motion.length + 1);
	motion.forEach((value, i) => {
		const speed = Math.max(LEAST, value / (mean || 1)) + JOLT * (kicks[i] ?? 0);
		out[i + 1] = (out[i] ?? 0) + PACE * speed;
	});
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
