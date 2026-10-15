import { energy } from "./energy";
import { rise } from "./rise";
import { scale } from "./scale";

export type Lane = 0 | 1 | 2;
type Song = { spectra: Float32Array[]; onsets: number[] };

// FFT bins at HOP 1024 and 44.1 kHz (~43 Hz each): bass, mids, highs.
export const BASS = { from: 1, to: 6 };
export const BANDS = [BASS, { from: 6, to: 93 }, { from: 93, to: 372 }];
const LANES = [0, 1, 2] as const;

const strongest = (scores: number[]) =>
	LANES.reduce((best, lane) => ((scores[lane] ?? 0) > (scores[best] ?? 0) ? lane : best));

// Per onset, the band that rose most relative to its own typical jump, so quiet bands compete
// with loud ones. Ties go to the lower band.
export function lanes({ spectra, onsets }: Song): Lane[] {
	const bands = BANDS.map(({ from, to }) => energy({ spectra, from, to }));
	const scales = bands.map((values) => scale(values));
	return onsets.map((f) =>
		strongest(bands.map((values, b) => rise({ values, f }) / (scales[b] ?? 1)))
	);
}
