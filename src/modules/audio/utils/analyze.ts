import { envelope } from "./envelope";
import { flux } from "./flux";
import { frames, HOP } from "./frames";
import { intensity } from "./intensity";
import { kicks } from "./kicks";
import type { Lane } from "./lanes";
import { lanes } from "./lanes";
import { peaks } from "./peaks";
import { ridges } from "./ridges";
import { smooth } from "./smooth";
import { spectrum } from "./spectrum";

export type Analysis = {
	envelope: Float32Array;
	onsets: number[];
	// Spectral flux at each onset: how hard it hit.
	strengths: number[];
	lanes: Lane[];
	ridges: Float32Array;
	// Kick punch per frame, 0–1.
	kicks: Float32Array;
	// How full the music is per frame, 0–1 within the song.
	intensity: Float32Array;
};

const SMOOTHING = 0.05;

export function analyze(samples: Float32Array): Analysis {
	const hops = frames(samples);
	const fft = spectrum(HOP);
	const spectra = hops.map((frame) => fft(frame));
	const rises = flux(spectra);
	const onsets = peaks(rises);
	const loudness = smooth({ values: envelope(hops), factor: SMOOTHING });
	return {
		envelope: loudness,
		onsets,
		strengths: onsets.map((onset) => rises[onset] ?? 0),
		lanes: lanes({ spectra, onsets }),
		ridges: ridges(spectra),
		kicks: kicks(spectra),
		intensity: intensity({ spectra, loudness }),
	};
}
