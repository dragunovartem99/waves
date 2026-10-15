import { analyze } from "./utils/analyze";

self.addEventListener("message", (event: MessageEvent<Float32Array>) => {
	const analysis = analyze(event.data);
	self.postMessage(analysis, {
		transfer: [
			analysis.envelope.buffer,
			analysis.ridges.buffer,
			analysis.kicks.buffer,
			analysis.intensity.buffer,
			analysis.motion.buffer,
		],
	});
});
