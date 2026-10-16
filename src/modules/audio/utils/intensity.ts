// 12 bands of 42 bins from bin 1, ~1.8 kHz each at HOP 1024 and 44.1 kHz.
const GROUPS = 12;
const WIDTH = 42;

const group = ({ magnitudes, g }: { magnitudes: Float32Array; g: number }) =>
	magnitudes
		.subarray(1 + g * WIDTH, 1 + (g + 1) * WIDTH)
		.reduce((sum, value) => sum + Math.sqrt(value), 0) / WIDTH;

// How loud the music is per frame: the square-rooted spectrum averaged into 12 equal bands and
// summed, so brightness counts as much as bass.
export const intensity = (spectra: Float32Array[]) =>
	Float32Array.from(spectra, (magnitudes) =>
		Array.from({ length: GROUPS }, (_, g) => group({ magnitudes, g })).reduce(
			(sum, value) => sum + value,
			0
		)
	);
