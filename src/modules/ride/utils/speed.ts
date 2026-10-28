// The calmest share of full speed.
const LEAST = 0.1;
// Share of the song, loudest first, that rides flat out.
const FULL = 0.2;

const share = ({ intensity, baseline }: { intensity: Float32Array; baseline: number }) =>
	intensity.map((value) => Math.min(1, Math.max(LEAST, value / (baseline || 1))));

// Share of full speed per frame, as Audiosurf lays its rings: intensity over the song's
// baseline, twice its mean but never above its peak, so every loud part rides flat out.
export function speeds(intensity: Float32Array) {
	const mean = intensity.reduce((sum, value) => sum + value, 0) / (intensity.length || 1);
	const peak = intensity.reduce((top, value) => Math.max(top, value), 0);
	return share({ intensity, baseline: Math.min(peak, 2 * mean) });
}

// Share of full speed the ride moves at: full from the intensity the song tops only FULL of the
// time, so a dense wall of sound rides fast where Audiosurf's twice-the-mean is never reached.
export function rides(intensity: Float32Array) {
	const sorted = intensity.toSorted();
	return share({
		intensity,
		baseline: sorted[Math.floor((1 - FULL) * (sorted.length - 1))] ?? 1,
	});
}
