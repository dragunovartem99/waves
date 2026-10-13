// Always a fresh array: the result is transferred to a worker, which would detach a channel's
// own buffer and silence playback.
export const mono = (channels: Float32Array[]) =>
	Float32Array.from(
		channels[0] ?? [],
		(_, i) => channels.reduce((sum, channel) => sum + (channel[i] ?? 0), 0) / channels.length
	);
