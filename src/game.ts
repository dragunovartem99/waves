import type { Playback } from "@/modules/audio";
import { analyzeOffThread, decode, play, RATE, samples } from "@/modules/audio";
import type { Lane, Run, Song } from "@/modules/ride";
import { accuracy, advance, aim, fit, FRESH, loadFonts, prepare, show } from "@/modules/ride";

import { controls } from "./controls";
import { $, onFile } from "./dom";
import { close, isOpen, menu } from "./menu";

type Ride = { song: Song; playback: Playback; run: Run; paused: boolean };

const context = new AudioContext({ sampleRate: RATE });
const canvas = $<HTMLCanvasElement>("#ride");
const input = $<HTMLInputElement>("#file");
const pauseButton = $<HTMLButtonElement>("#pause");
// `?bot` rides for you: every pickup, no blocks. For recording demos.
const bot = new URLSearchParams(location.search).has("bot");
let ride: Ride | undefined;

const pick = { label: "Pick a song", run: () => input.click() };
const again = { label: "Ride again", run: () => ride && start(ride.song) };

function end({ run, song }: Ride) {
	pauseButton.hidden = true;
	menu({
		title: run.health.lives === 0 ? "GAME OVER" : "CLEAR",
		note: `SCORE ${String(run.score.score).padStart(5, "0")}`,
		actions: [again, pick],
		accuracy: accuracy({ ...run, ...song }),
	});
}

function frame() {
	if (!ride || ride.paused) return;
	const { song, playback } = ride;
	const { duration } = song.buffer;
	const now = Math.min(playback.position(), duration);
	const { pickups, blocks } = song;
	const steered = bot
		? { ...ride.run, lane: aim({ run: ride.run, pickups, blocks, now }) }
		: ride.run;
	const run = advance({ run: steered, pickups, blocks, now, duration });
	ride = { ...ride, run };
	show({ pen: fit(canvas), song, run, now });
	if (!run.ended) return requestAnimationFrame(frame);
	playback.stop();
	end(ride);
}

function start(song: Song) {
	ride?.playback.stop();
	void context.resume();
	ride = { song, playback: play({ context, buffer: song.buffer }), run: FRESH, paused: false };
	close();
	pauseButton.hidden = false;
	pauseButton.ariaPressed = "false";
	requestAnimationFrame(frame);
}

// Suspending the audio context freezes `currentTime`, so the music and the ride stop together.
function pause() {
	if (!ride || ride.paused || ride.run.ended) return;
	ride = { ...ride, paused: true };
	void context.suspend();
	pauseButton.ariaPressed = "true";
	const resume = { label: "Resume", run: () => unpause() };
	menu({ title: "PAUSED", actions: [resume, again, pick] });
}

function unpause() {
	if (!ride?.paused) return;
	ride = { ...ride, paused: false };
	void context.resume();
	close();
	pauseButton.ariaPressed = "false";
	requestAnimationFrame(frame);
}

async function load(file: File) {
	ride?.playback.stop();
	ride = undefined;
	pauseButton.hidden = true;
	menu({ title: "DECODING", note: file.name });
	const buffer = await decode({ context, file });
	menu({ title: "ANALYZING", note: file.name });
	const analysis = await analyzeOffThread(samples(buffer));
	start(prepare({ analysis, buffer, name: file.name }));
}

function steer(move: Record<Lane, Lane>) {
	if (!bot && ride && !ride.paused && !ride.run.ended)
		ride = { ...ride, run: { ...ride.run, lane: move[ride.run.lane] } };
}

const open = (file: File) =>
	load(file).catch((error: unknown) =>
		menu({ title: "CAN'T READ IT", note: String(error), actions: [pick] })
	);

const toggle = () => (ride?.paused ? unpause() : isOpen() || pause());
controls({ canvas, pauseButton, steer, toggle, pause });
onFile((file) => void open(file));

await loadFonts();
menu({
	title: "WAVES",
	note: "Drop a song anywhere, or pick one. It never leaves your browser.",
	actions: [pick],
	keys: true,
});
