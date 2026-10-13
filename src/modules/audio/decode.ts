import { mono } from "./utils/mono";

export const decode = async ({ context, file }: { context: AudioContext; file: File }) =>
	context.decodeAudioData(await file.arrayBuffer());

export const samples = (buffer: AudioBuffer) =>
	mono(Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i)));
