type Pair = { current: Float32Array; previous: Float32Array };

// Log compression evens out bands: without it the bass swamps quiet hi-hats.
const COMPRESSION = 100;

const compress = (magnitudes: Float32Array) =>
	magnitudes.map((magnitude) => Math.log1p(COMPRESSION * magnitude));

const rise = ({ current, previous }: Pair) =>
	current.reduce((sum, value, k) => sum + Math.max(0, value - (previous[k] ?? 0)), 0);

// Spectral flux: how much energy rose since the previous frame. Only rises count, since that's
// where notes start; the first frame has nothing to compare to, so it is 0.
export function flux(spectra: Float32Array[]) {
	const compressed = spectra.map((magnitudes) => compress(magnitudes));
	return Float32Array.from(compressed, (current, i) =>
		rise({ current, previous: compressed[i - 1] ?? current })
	);
}
