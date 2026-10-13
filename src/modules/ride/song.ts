import type { Analysis } from "@/modules/audio";

import type { Ridge } from "./utils/grid";
import { grid } from "./utils/grid";
import { hits } from "./utils/hits";
import type { Hit } from "./utils/judge";
import { track } from "./utils/track";

export type Song = {
	buffer: AudioBuffer;
	ridges: Float32Array;
	kicks: Float32Array;
	track: Float32Array;
	grid: Ridge[];
	bpm: number;
	pickups: Hit[];
	blocks: Hit[];
	title: string;
};
type Source = { analysis: Analysis; buffer: AudioBuffer; name: string };

// "Artist - Title.mp3" → "ARTIST — TITLE".
const title = (name: string) =>
	name
		.replace(/\.[^.]+$/u, "")
		.replaceAll(" - ", " — ")
		.toUpperCase();

// Everything a ride needs, built once per song from its analysis.
export function prepare({ analysis, buffer, name }: Source): Song {
	const { ridges, kicks, beats, bpm } = analysis;
	const path = track(analysis);
	const marks = hits(analysis);
	return {
		buffer,
		ridges,
		kicks,
		track: path,
		grid: grid({ beats, track: path }),
		bpm,
		...marks,
		title: title(name),
	};
}
