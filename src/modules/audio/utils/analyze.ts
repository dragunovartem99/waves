import { envelope } from "./envelope";
import { flux } from "./flux";
import { frames, HOP } from "./frames";
import { peaks } from "./peaks";
import { smooth } from "./smooth";
import { spectrum } from "./spectrum";

export type Analysis = { envelope: Float32Array; onsets: number[] };

const SMOOTHING = 0.05;

export function analyze(samples: Float32Array): Analysis {
	const hops = frames(samples);
	const fft = spectrum(HOP);
	return {
		envelope: smooth({ values: envelope(hops), factor: SMOOTHING }),
		onsets: peaks(flux(hops.map((frame) => fft(frame)))),
	};
}
