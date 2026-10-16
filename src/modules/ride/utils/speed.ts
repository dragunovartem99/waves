// The calmest share of full speed.
const LEAST = 0.1;

// Share of full speed per frame: intensity over the song's baseline, twice its mean but never
// above its peak, so every loud part rides flat out.
export function speeds(intensity: Float32Array) {
	const mean = intensity.reduce((sum, value) => sum + value, 0) / (intensity.length || 1);
	const peak = intensity.reduce((top, value) => Math.max(top, value), 0);
	const baseline = Math.min(peak, 2 * mean) || 1;
	return intensity.map((value) => Math.min(1, Math.max(LEAST, value / baseline)));
}
