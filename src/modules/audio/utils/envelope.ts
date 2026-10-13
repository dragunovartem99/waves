export const HOP = 1024;

function rms(frame: Float32Array) {
	const sum = frame.reduce((total, sample) => total + sample * sample, 0);
	return Math.sqrt(sum / frame.length);
}

// One loudness value per hop; a trailing partial hop is dropped so every value has equal weight.
export function envelope(samples: Float32Array) {
	const count = Math.floor(samples.length / HOP);
	return Float32Array.from({ length: count }, (_, i) =>
		rms(samples.subarray(i * HOP, (i + 1) * HOP))
	);
}
