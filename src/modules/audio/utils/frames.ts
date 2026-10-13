export const HOP = 1024;

// Views, not copies; a trailing partial hop is dropped so every frame has equal weight.
export const frames = (samples: Float32Array) =>
	Array.from({ length: Math.floor(samples.length / HOP) }, (_, i) =>
		samples.subarray(i * HOP, (i + 1) * HOP)
	);
