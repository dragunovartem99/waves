import type { Analysis } from "./utils/analyze";

// Transfers `samples`: the caller's copy is detached afterwards.
export const analyzeOffThread = (samples: Float32Array) =>
	new Promise<Analysis>((resolve, reject) => {
		const worker = new Worker(new URL("analyze.worker.ts", import.meta.url), {
			type: "module",
		});
		worker.addEventListener("message", (event: MessageEvent<Analysis>) => {
			resolve(event.data);
			worker.terminate();
		});
		worker.addEventListener("error", (event) => {
			reject(new Error(event.message));
			worker.terminate();
		});
		worker.postMessage(samples, [samples.buffer]);
	});
