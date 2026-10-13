function rms(frame: Float32Array) {
	const sum = frame.reduce((total, sample) => total + sample * sample, 0);
	return Math.sqrt(sum / frame.length);
}

// One loudness value per frame.
export const envelope = (frames: Float32Array[]) =>
	Float32Array.from(frames, (frame) => rms(frame));
