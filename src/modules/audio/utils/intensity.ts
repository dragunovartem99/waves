import { energy } from "./energy";
import { BANDS } from "./lanes";
import { rank } from "./rank";
import { settle } from "./smooth";

// ~1 s time constant: follows sections, not single hits.
const SETTLE = 0.02;

// One band alone (a bare 808, a lone pad) isn't a full section; two of three at once are.
function topTwo(values: number[]) {
	const [first = 0, second = 0] = values.toSorted((a, b) => b - a);
	return (first + second) / 2;
}

// How full the music is, 0–1 per frame: bass, mid and high energy, each ranked within the song
// so every song spans the whole range, then the two strongest averaged and ranked again.
export function intensity(spectra: Float32Array[]) {
	const ranked = BANDS.map((band) =>
		rank(settle({ values: energy({ spectra, ...band }), factor: SETTLE }))
	);
	return rank(
		Float32Array.from(spectra, (_magnitudes, f) =>
			topTwo(ranked.map((values) => values[f] ?? 0))
		)
	);
}
