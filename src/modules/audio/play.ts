export type Playback = { position: () => number; stop: () => void };

export function play({
	context,
	buffer,
}: {
	context: AudioContext;
	buffer: AudioBuffer;
}): Playback {
	const source = new AudioBufferSourceNode(context, { buffer });
	source.connect(context.destination);
	source.start();
	const start = context.currentTime;
	return { position: () => context.currentTime - start, stop: () => source.stop() };
}
