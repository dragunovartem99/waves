type Params = { values: Float32Array; factor: number };

// Exponential moving average: `factor` near 0 is heavy smoothing, 1 passes values through.
export function smooth({ values, factor }: Params) {
	const out = new Float32Array(values.length);
	values.forEach((value, i) => {
		const prev = out[i - 1] ?? value;
		out[i] = prev + factor * (value - prev);
	});
	return out;
}

// Smoothed forward and back, so a change lands where it happens instead of lagging behind.
export const settle = ({ values, factor }: Params) =>
	smooth({ values: smooth({ values, factor }).toReversed(), factor }).toReversed();
