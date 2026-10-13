type At = { values: Float32Array; i: number; floor: number };

const WINDOW = 10;
const MULTIPLIER = 1.5;
// Share of the song's mean flux every onset must clear, so silence and fades don't turn each
// tiny bump into one; relative because flux scale varies with the song.
const FLOOR = 0.5;

const mean = (values: Float32Array) =>
	values.reduce((sum, value) => sum + value, 0) / values.length;

function threshold({ values, i, floor }: At) {
	const local = values.subarray(Math.max(0, i - WINDOW), i + WINDOW + 1).toSorted();
	return MULTIPLIER * (local[Math.floor(local.length / 2)] ?? 0) + floor;
}

// `>=` on the right so a flat top yields its first frame only.
function isPeak(at: At) {
	const { values, i } = at;
	const value = values[i] ?? 0;
	const local = value > (values[i - 1] ?? 0) && value >= (values[i + 1] ?? 0);
	return local && value > threshold(at);
}

// Onsets as frame indices: local maxima above an adaptive threshold (moving median).
export function peaks(values: Float32Array) {
	const floor = FLOOR * mean(values);
	return [...values.keys()].filter((i) => isPeak({ values, i, floor }));
}
