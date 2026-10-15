import { beats } from "./beats";
import { envelope } from "./envelope";
import { fill } from "./fill";
import { flux } from "./flux";
import { frames, HOP } from "./frames";
import { intensity } from "./intensity";
import { kicks } from "./kicks";
import type { Lane } from "./lanes";
import { lanes } from "./lanes";
import { motion } from "./motion";
import { peaks } from "./peaks";
import { ridges } from "./ridges";
import { smooth } from "./smooth";
import { spectrum } from "./spectrum";
import { tempo } from "./tempo";

export type Analysis = {
	envelope: Float32Array;
	// Detected onsets only (the debug graph shows these).
	onsets: number[];
	// What the game turns into hits: onsets plus empty beats; strengths and lanes follow these.
	marks: number[];
	// Spectral flux at each mark: how hard it hit.
	strengths: number[];
	lanes: Lane[];
	ridges: Float32Array;
	// Kick punch per frame, 0–1.
	kicks: Float32Array;
	// How full the music is per frame, 0–1 within the song.
	intensity: Float32Array;
	// How much the ridges move per frame, smoothed: what the ride's speed follows.
	motion: Float32Array;
	bpm: number;
	// Beat frames, tracked so they follow small tempo drifts.
	beats: number[];
};

const SMOOTHING = 0.05;

export function analyze(samples: Float32Array): Analysis {
	const hops = frames(samples);
	const fft = spectrum(HOP);
	const spectra = hops.map((frame) => fft(frame));
	const rises = flux(spectra);
	const onsets = peaks(rises);
	const loudness = smooth({ values: envelope(hops), factor: SMOOTHING });
	const bpm = tempo(rises);
	const grid = beats({ flux: rises, bpm });
	const full = intensity(spectra);
	const lines = ridges(spectra);
	const moving = motion(lines);
	const marks = fill({ onsets, beats: grid, bpm, intensity: full, motion: moving });
	return {
		envelope: loudness,
		onsets,
		marks,
		strengths: marks.map((mark) => rises[mark] ?? 0),
		lanes: lanes({ spectra, onsets: marks }),
		ridges: lines,
		kicks: kicks(spectra),
		intensity: full,
		motion: moving,
		bpm,
		beats: grid,
	};
}
