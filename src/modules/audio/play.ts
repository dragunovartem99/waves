export type Playback = { position: () => number; muffle: () => void; stop: () => void };

export function play({
	context,
	buffer,
}: {
	context: AudioContext;
	buffer: AudioBuffer;
}): Playback {
	const source = new AudioBufferSourceNode(context, { buffer });
	const filter = new BiquadFilterNode(context, {
		type: "lowpass",
		frequency: context.sampleRate / 2,
		Q: 0.5,
	});
	source.connect(filter).connect(context.destination);
	source.start();
	const start = context.currentTime;

	function muffle() {
		const now = context.currentTime;
		filter.frequency.cancelScheduledValues(now);
		filter.frequency.setValueAtTime(filter.frequency.value, now);
		filter.frequency.exponentialRampToValueAtTime(550, now + 1.2);
	}

	return { position: () => context.currentTime - start, muffle, stop: () => source.stop() };
}
