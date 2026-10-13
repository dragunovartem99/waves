import { envelope } from "./envelope";
import { flux } from "./flux";
import { frames, HOP } from "./frames";
import type { Lane } from "./lanes";
import { lanes } from "./lanes";
import { peaks } from "./peaks";
import { ridges } from "./ridges";
import { smooth } from "./smooth";
import { spectrum } from "./spectrum";

export type Analysis = {
	envelope: Float32Array;
	onsets: number[];
	lanes: Lane[];
	ridges: Float32Array;
};

const SMOOTHING = 0.05;

export function analyze(samples: Float32Array): Analysis {
	const hops = frames(samples);
	const fft = spectrum(HOP);
	const spectra = hops.map((frame) => fft(frame));
	const onsets = peaks(flux(spectra));
	return {
		envelope: smooth({ values: envelope(hops), factor: SMOOTHING }),
		onsets,
		lanes: lanes({ spectra, onsets }),
		ridges: ridges(spectra),
	};
}
