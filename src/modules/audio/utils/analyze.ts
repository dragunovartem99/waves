import { beats } from "./beats";
import { flux } from "./flux";
import { frames, HOP } from "./frames";
import { intensity } from "./intensity";
import { kicks } from "./kicks";
import { ridges } from "./ridges";
import { spectrum } from "./spectrum";
import { tempo } from "./tempo";

export type Analysis = {
	ridges: Float32Array;
	// Kick punch per frame, 0–1.
	kicks: Float32Array;
	// How loud and bright the music is per frame: what speed and hits follow.
	intensity: Float32Array;
	// Beat frames, tracked so they follow small tempo drifts.
	beats: number[];
};

export function analyze(samples: Float32Array): Analysis {
	const hops = frames(samples);
	const fft = spectrum(HOP);
	const spectra = hops.map((frame) => fft(frame));
	const rises = flux(spectra);
	return {
		ridges: ridges(spectra),
		kicks: kicks(spectra),
		intensity: intensity(spectra),
		beats: beats({ flux: rises, bpm: tempo(rises) }),
	};
}
