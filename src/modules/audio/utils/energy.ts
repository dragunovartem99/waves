type Band = { spectra: Float32Array[]; from: number; to: number };

const power = (magnitudes: Float32Array) =>
	magnitudes.reduce((sum, magnitude) => sum + magnitude * magnitude, 0) / magnitudes.length;

// Mean power over bins [from, to) per frame. Linear on purpose: log energy saturates the bass,
// so kicks would barely rise above it.
export const energy = ({ spectra, from, to }: Band) =>
	Float32Array.from(spectra, (magnitudes) => power(magnitudes.subarray(from, to)));
