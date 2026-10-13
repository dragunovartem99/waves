import type { Lane, Playback } from "@/modules/audio";
import { analyzeOffThread, decode, HOP, play, RATE, samples } from "@/modules/audio";
import type { Hit, Run } from "@/modules/ride";
import { advance, fit, FRESH, hits, hud, idle, loadFonts, scene, track } from "@/modules/ride";

import { $, onFile } from "./dom";

type Song = {
	buffer: AudioBuffer;
	ridges: Float32Array;
	kicks: Float32Array;
	track: Float32Array;
	pickups: Hit[];
	blocks: Hit[];
	title: string;
};
type Ride = { song: Song; playback: Playback; run: Run };

// Radians per second the kick ripple travels across the ridges.
const RIPPLE = 9;
// Seconds the red flash takes to fade after a crash.
const FLASH = 0.4;
const LEFT: Record<Lane, Lane> = { 0: 0, 1: 0, 2: 1 };
const RIGHT: Record<Lane, Lane> = { 0: 1, 1: 2, 2: 2 };
const PICK = "or click to pick one";
const AGAIN = "click to ride again · drop another song";

const context = new AudioContext({ sampleRate: RATE });
const canvas = $<HTMLCanvasElement>("#ride");
const input = $<HTMLInputElement>("#file");
let ride: Ride | undefined;

const say = (text: string, note = PICK) => idle({ pen: fit(canvas), text, note });
const title = (file: File) =>
	file.name
		.replace(/\.[^.]+$/u, "")
		.replaceAll(" - ", " — ")
		.toUpperCase();

function draw({ song, run, now }: { song: Song; run: Run; now: number }) {
	const { score, health, u, crashed, ended } = run;
	const { duration } = song.buffer;
	const pen = fit(canvas);
	const [pickups, blocks] = [song.pickups.slice(score.next), song.blocks.slice(health.next)];
	const at = (now * RATE) / HOP;
	const kick = song.kicks[Math.round(at)] ?? 0;
	const field = { ridges: song.ridges, track: song.track, kick, phase: now * RIPPLE };
	scene({ pen, ...field, pickups, blocks, at, u });
	const text = health.lives === 0 ? "GAME OVER" : "CLEAR";
	const banner = ended ? { text, note: AGAIN } : undefined;
	// The loop stops when the ride ends, so a flash there would freeze on screen.
	const flash = ended ? 0 : Math.max(0, 1 - (now - crashed) / FLASH);
	const { lives } = health;
	hud({ pen, score, title: song.title, now, duration, hint: "← →", lives, flash, banner });
}

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
	draw({ song, run, now });
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
	const { ridges, kicks } = analysis;
	start({ buffer, ridges, kicks, track: track(analysis), ...hits(analysis), title: title(file) });
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
