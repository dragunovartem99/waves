import type { Lane, Playback } from "@/modules/audio";
import { analyzeOffThread, decode, play, RATE, samples } from "@/modules/audio";
import type { Run, Song } from "@/modules/ride";
import { advance, fit, FRESH, loadFonts, prepare, show } from "@/modules/ride";

import { controls } from "./controls";
import { $, onFile } from "./dom";
import { close, isOpen, menu } from "./menu";

type Ride = { song: Song; playback: Playback; run: Run; paused: boolean };

const context = new AudioContext({ sampleRate: RATE });
const canvas = $<HTMLCanvasElement>("#ride");
const input = $<HTMLInputElement>("#file");
const pauseButton = $<HTMLButtonElement>("#pause");
let ride: Ride | undefined;

const pick = { label: "Pick a song", run: () => input.click() };
const again = { label: "Ride again", run: () => ride && start(ride.song) };
const score = (run: Run) => `SCORE ${String(run.score.score).padStart(5, "0")}`;

function end({ run }: Ride) {
	pauseButton.hidden = true;
	menu({
		title: run.health.lives === 0 ? "GAME OVER" : "CLEAR",
		note: score(run),
		actions: [again, pick],
	});
}

function frame() {
	if (!ride || ride.paused) return;
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
	requestAnimationFrame(frame);
}

// Suspending the audio context freezes `currentTime`, so the music and the ride stop together.
function pause() {
	if (!ride || ride.paused || ride.run.ended) return;
	ride = { ...ride, paused: true };
	void context.suspend();
	pauseButton.hidden = true;
	const resume = { label: "Resume", run: () => unpause() };
	menu({ title: "PAUSED", note: score(ride.run), actions: [resume, again, pick] });
}

function unpause() {
	if (!ride?.paused) return;
	ride = { ...ride, paused: false };
	void context.resume();
	close();
	pauseButton.hidden = false;
	requestAnimationFrame(frame);
}

async function load(file: File) {
	ride?.playback.stop();
	ride = undefined;
	pauseButton.hidden = true;
	menu({ title: "DECODING…", note: file.name });
	const buffer = await decode({ context, file });
	menu({ title: "ANALYZING…", note: file.name });
	const analysis = await analyzeOffThread(samples(buffer));
	start(prepare({ analysis, buffer, name: file.name }));
}

function steer(move: Record<Lane, Lane>) {
	if (ride && !ride.paused && !ride.run.ended)
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
