export type Playback = {
	position: () => number;
	slow: (down: boolean) => void;
	muffle: () => void;
	stop: () => void;
};

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
	let elapsed = 0;
	let previous = context.currentTime;

	// AudioContext time keeps running at full speed, so integrate the changing playback rate.
	function position() {
		const now = context.currentTime;
		elapsed += (now - previous) * source.playbackRate.value;
		previous = now;
		return elapsed;
	}

	function slow(down: boolean) {
		position();
		const now = context.currentTime;
		const rate = source.playbackRate;
		rate.cancelScheduledValues(now);
		rate.setValueAtTime(rate.value, now);
		rate.linearRampToValueAtTime(down ? 2 ** (-7 / 12) : 1, now + 0.2);
	}

	function muffle() {
		const now = context.currentTime;
		filter.frequency.cancelScheduledValues(now);
		filter.frequency.setValueAtTime(filter.frequency.value, now);
		filter.frequency.exponentialRampToValueAtTime(550, now + 1.2);
	}

	return { position, slow, muffle, stop: () => source.stop() };
}
