import { energy } from "./energy";
import { rise } from "./rise";
import { scale } from "./scale";

// FFT bins at HOP 1024 and 44.1 kHz (~43 Hz each) where kicks live.
const BASS = { from: 1, to: 6 };
// Bass rises below this many typical rises are groove, not kicks; KICK more reaches full punch.
const FLOOR = 1.5;
const KICK = 5;
// Share of the punch left after each frame (~23 ms): about 0.1 s to halve.
const DECAY = 0.85;

// Kick punch per frame, 0–1: jumps on a sharp bass rise, then decays, so visuals can ring.
export function kicks(spectra: Float32Array[]) {
	const values = energy({ spectra, ...BASS });
	const typical = scale(values);
	const out = new Float32Array(values.length);
	values.forEach((_value, f) => {
		const hit = Math.min(1, Math.max(0, (rise({ values, f }) / typical - FLOOR) / KICK));
		out[f] = Math.max(hit, (out[f - 1] ?? 0) * DECAY);
	});
	return out;
}
