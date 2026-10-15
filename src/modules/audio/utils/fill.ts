type Song = {
	onsets: number[];
	beats: number[];
	bpm: number;
	intensity: Float32Array;
	motion: Float32Array;
};

// Frames a beat may sit from an onset and still count as having one.
const NEAR = 2;
// Below this tempo songs are felt in eighths, so full sections also get the off-beats.
const HALF_TIME = 110;
const FULL = 0.5;
// Share of the song's mean motion below which nothing sounds: the beat grid runs on through
// silence, but marks there would be pickups in thin air.
const STILL = 0.05;

// Onsets plus a mark on every beat that has none, so dense, smeared mixes (distorted guitars
// hide transients) still give the player something on each beat. Sorted frames.
export function fill({ onsets, beats, bpm, intensity, motion }: Song) {
	const still = (STILL * motion.reduce((sum, value) => sum + value, 0)) / (motion.length || 1);
	const halves =
		bpm < HALF_TIME
			? beats
					.slice(0, -1)
					.map((beat, i) => Math.round((beat + (beats[i + 1] ?? beat)) / 2))
					.filter((half) => (intensity[half] ?? 0) >= FULL)
			: [];
	const empty = [...beats, ...halves].filter(
		(slot) =>
			(motion[slot] ?? 0) > still && !onsets.some((onset) => Math.abs(onset - slot) <= NEAR)
	);
	return [...onsets, ...empty].toSorted((a, b) => a - b);
}
