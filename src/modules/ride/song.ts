import type { Analysis } from "@/modules/audio";

import type { Ridge } from "./utils/grid";
import { grid } from "./utils/grid";
import { hits } from "./utils/hits";
import type { Hit } from "./utils/judge";
import { rides, speeds } from "./utils/speed";
import { track } from "./utils/track";

export type Song = {
	buffer: AudioBuffer;
	ridges: Float32Array;
	kicks: Float32Array;
	track: Float32Array;
	grid: Ridge[];
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
	const { ridges, kicks, beats, intensity } = analysis;
	const speed = speeds(intensity);
	// Hits keep Audiosurf's speed; the ride reaches full speed in every song's loudest parts.
	const path = track({ speeds: rides(intensity), kicks });
	return {
		buffer,
		ridges,
		kicks,
		track: path,
		grid: grid({ beats, track: path }),
		...hits(speed),
		title: title(name),
	};
}
