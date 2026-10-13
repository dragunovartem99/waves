import type { Lane, Playback } from "@/modules/audio";
import { analyzeOffThread, decode, play, RATE, samples } from "@/modules/audio";
import type { Run, Song } from "@/modules/ride";
import { advance, fit, FRESH, idle, loadFonts, prepare, show } from "@/modules/ride";

import { $, onFile } from "./dom";

type Ride = { song: Song; playback: Playback; run: Run };

const LEFT: Record<Lane, Lane> = { 0: 0, 1: 0, 2: 1 };
const RIGHT: Record<Lane, Lane> = { 0: 1, 1: 2, 2: 2 };
const PICK = "or click to pick one";

const context = new AudioContext({ sampleRate: RATE });
const canvas = $<HTMLCanvasElement>("#ride");
const input = $<HTMLInputElement>("#file");
let ride: Ride | undefined;

const say = (text: string, note = PICK) => idle({ pen: fit(canvas), text, note });

function frame() {
	if (!ride) return;
	const { song, playback } = ride;
	const { duration } = song.buffer;
	const now = Math.min(playback.position(), duration);
	const run = advance({
		run: ride.run,
		pickups: song.pickups,
		blocks: song.blocks,
		now,
		duration,
	});
	ride = { ...ride, run };
	show({ pen: fit(canvas), song, run, now });
	if (run.ended) playback.stop();
	else requestAnimationFrame(frame);
}

function start(song: Song) {
	ride?.playback.stop();
	ride = { song, playback: play({ context, buffer: song.buffer }), run: FRESH };
	requestAnimationFrame(frame);
}

async function load(file: File) {
	ride?.playback.stop();
	ride = undefined;
	say("DECODING…", file.name);
	const buffer = await decode({ context, file });
	say("ANALYZING…", file.name);
	const analysis = await analyzeOffThread(samples(buffer));
	await context.resume();
	start(prepare({ analysis, buffer, name: file.name }));
}

function steer(move: Record<Lane, Lane>) {
	if (ride && !ride.run.ended)
		ride = { ...ride, run: { ...ride.run, lane: move[ride.run.lane] } };
}

const open = (file: File) =>
	load(file).catch((error: unknown) => say("CAN'T READ IT", String(error)));

addEventListener("keydown", (event) => {
	if (event.key === "ArrowLeft") steer(LEFT);
	if (event.key === "ArrowRight") steer(RIGHT);
});
// Tapping a half of the screen steers; after a ride it starts the song again.
canvas.addEventListener("pointerdown", (event) => {
	if (!ride) return input.click();
	if (ride.run.ended) return start(ride.song);
	steer(event.clientX < canvas.clientWidth / 2 ? LEFT : RIGHT);
});
addEventListener("resize", () => ride ?? say("DROP A SONG"));
onFile((file) => void open(file));

await loadFonts();
say("DROP A SONG");
