type At = { track: Float32Array; frame: number };
type Find = { track: Float32Array; distance: number };

// Distance per frame at full speed; with the view SPAN deep, sets how far ahead you see.
export const PACE = 3;

// Distance travelled by the start of each frame, from each frame's share of full speed.
export function track(speeds: Float32Array) {
	const out = new Float32Array(speeds.length + 1);
	speeds.forEach((speed, i) => {
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
