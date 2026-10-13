import { energy } from "./energy";
import { rank } from "./rank";
import { smooth } from "./smooth";

type Song = { spectra: Float32Array[]; loudness: Float32Array };

const MIDS = { from: 6, to: 93 };
const HIGHS = { from: 93, to: 372 };
// ~1 s time constant: follows sections, not single hits.
const SETTLE = 0.02;

// Smoothed forward and back, so a change lands where it happens instead of lagging behind.
const settle = (values: Float32Array) =>
	smooth({
		values: smooth({ values, factor: SETTLE }).toReversed(),
		factor: SETTLE,
	}).toReversed();

// How full the music is, 0–1 per frame. Overall loudness barely moves between verse and chorus
// on loud masters (the bass dominates it); mid and high energy do. Each is ranked within the
// song, so every song spans the whole range.
export function intensity({ spectra, loudness }: Song) {
	const parts = [loudness, energy({ spectra, ...MIDS }), energy({ spectra, ...HIGHS })];
	const ranked = parts.map((values) => rank(settle(values)));
	return loudness.map(
		(_value, f) => ranked.reduce((sum, values) => sum + (values[f] ?? 0), 0) / ranked.length
	);
}
