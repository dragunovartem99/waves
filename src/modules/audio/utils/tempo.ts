import { HOP, RATE } from "./frames";

const PER_SECOND = RATE / HOP;
const SLOWEST = 60;
const FASTEST = 200;
// Prior toward ~120 BPM, an octave wide: the usual cure for picking half or double the tempo.
const CENTRE = 120;
const OCTAVES = 1;

const toBpm = (lag: number) => (60 * PER_SECOND) / lag;

// How well the curve lines up with itself shifted by `lag` frames.
function correlate({ values, lag }: { values: Float32Array; lag: number }) {
	let sum = 0;
	for (let i = lag; i < values.length; i++) sum += (values[i] ?? 0) * (values[i - lag] ?? 0);
	return sum / Math.max(1, values.length - lag);
}

// Sharpens a whole-frame peak to a fractional lag (frames are ~23 ms, too coarse for BPM).
function refine({ values, lag }: { values: Float32Array; lag: number }) {
	const [before, at, after] = [lag - 1, lag, lag + 1].map((shift) =>
		correlate({ values, lag: shift })
	);
	const bend = (before ?? 0) - 2 * (at ?? 0) + (after ?? 0);
	return bend < 0 ? lag + ((before ?? 0) - (after ?? 0)) / (2 * bend) : lag;
}

// Tempo in BPM from the onset-strength curve (spectral flux), by autocorrelation: the beat is
// the lag at which the song best repeats itself.
export function tempo(flux: Float32Array) {
	const mean = flux.reduce((sum, value) => sum + value, 0) / (flux.length || 1);
	const values = flux.map((value) => value - mean);
	const first = Math.ceil((60 * PER_SECOND) / FASTEST);
	const last = Math.floor((60 * PER_SECOND) / SLOWEST);
	const lags = Array.from({ length: last - first + 1 }, (_, i) => first + i);
	const score = (lag: number) =>
		correlate({ values, lag }) *
		Math.exp(-0.5 * (Math.log2(toBpm(lag) / CENTRE) / OCTAVES) ** 2);
	const best = lags.reduce((top, lag) => (score(lag) > score(top) ? lag : top), first);
	return toBpm(refine({ values, lag: best }));
}
