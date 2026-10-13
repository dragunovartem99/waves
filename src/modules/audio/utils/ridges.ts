import { POINTS, ridge } from "./ridge";

// Every frame's ridge in one flat array (frame × POINTS), scaled so the song's peak is 1 and
// quiet passages stay low. One buffer so the worker can transfer it.
export function ridges(spectra: Float32Array[]) {
	const out = new Float32Array(spectra.length * POINTS);
	spectra.forEach((magnitudes, f) => out.set(ridge(magnitudes), f * POINTS));
	const top = out.reduce((max, value) => Math.max(max, value), 0);
	return out.map((value) => value / (top || 1));
}
