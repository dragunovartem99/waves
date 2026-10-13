type At = { values: Float32Array; i: number };

const WINDOW = 10;
const MULTIPLIER = 1.5;
// Keeps silence and fades from turning every tiny bump into an onset; tune on the graph.
const FLOOR = 1;

function threshold({ values, i }: At) {
	const local = values.subarray(Math.max(0, i - WINDOW), i + WINDOW + 1).toSorted();
	return MULTIPLIER * (local[Math.floor(local.length / 2)] ?? 0) + FLOOR;
}

// `>=` on the right so a flat top yields its first frame only.
function isPeak({ values, i }: At) {
	const value = values[i] ?? 0;
	const local = value > (values[i - 1] ?? 0) && value >= (values[i + 1] ?? 0);
	return local && value > threshold({ values, i });
}

// Onsets as frame indices: local maxima above an adaptive threshold (moving median).
export const peaks = (values: Float32Array) =>
	[...values.keys()].filter((i) => isPeak({ values, i }));
