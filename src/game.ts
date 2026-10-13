import type { Lane, Playback } from "@/modules/audio";
import { analyzeOffThread, decode, HOP, play, RATE, samples } from "@/modules/audio";
import type { Hit, Score } from "@/modules/ride";
import { fit, hud, idle, judge, LANES, loadFonts, scene, START } from "@/modules/ride";

import { $, onFile } from "./dom";

type Song = { buffer: AudioBuffer; ridges: Float32Array; hits: Hit[]; title: string };
type Ride = { song: Song; playback: Playback; score: Score; lane: Lane; u: number };

// Share of the gap to the target lane the dot covers per frame.
const EASE = 0.35;
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
	const { song, playback, lane } = ride;
	const now = Math.min(playback.position(), song.buffer.duration);
	const score = judge({ hits: song.hits, state: ride.score, now, lane });
	const u = ride.u + (LANES[lane] - ride.u) * EASE;
	ride = { ...ride, score, u };
	const pen = fit(canvas);
	const ended = now >= song.buffer.duration;
	const hits = song.hits.slice(score.next);
	scene({ pen, ridges: song.ridges, hits, at: (now * RATE) / HOP, u });
	const hint = ended ? "DROP ANOTHER SONG" : "← →";
	hud({ pen, score, title: song.title, now, duration: song.buffer.duration, hint });
	if (!ended) requestAnimationFrame(frame);
}

async function load(file: File) {
	ride?.playback.stop();
	ride = undefined;
	say("DECODING…", file.name);
	const buffer = await decode({ context, file });
	say("ANALYZING…", file.name);
	const { ridges, onsets, lanes } = await analyzeOffThread(samples(buffer));
	const hits = onsets.map((onset, i) => ({ time: (onset * HOP) / RATE, lane: lanes[i] ?? 1 }));
	const title = file.name
		.replace(/\.[^.]+$/u, "")
		.replaceAll(" - ", " — ")
		.toUpperCase();
	await context.resume();
	const song = { buffer, ridges, hits, title };
	ride = { song, playback: play({ context, buffer }), score: START, lane: 1, u: LANES[1] };
	requestAnimationFrame(frame);
}

function steer(move: Record<Lane, Lane>) {
	if (ride) ride = { ...ride, lane: move[ride.lane] };
}

const open = (file: File) =>
	load(file).catch((error: unknown) => say("CAN'T READ IT", String(error)));

addEventListener("keydown", (event) => {
	if (event.key === "ArrowLeft") steer(LEFT);
	if (event.key === "ArrowRight") steer(RIGHT);
});
// Tapping a half of the screen steers; before or after a song it opens the picker.
canvas.addEventListener("pointerdown", (event) => {
	if (!ride || ride.playback.position() >= ride.song.buffer.duration) return input.click();
	steer(event.clientX < canvas.clientWidth / 2 ? LEFT : RIGHT);
});
addEventListener("resize", () => ride ?? say("DROP A SONG"));
onFile((file) => void open(file));

await loadFonts();
say("DROP A SONG");
