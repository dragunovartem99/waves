import "./style.css";
import type { Analysis, Playback } from "@/modules/audio";
import { analyzeOffThread, decode, HOP, play, samples } from "@/modules/audio";
import { draw } from "@/modules/graph";

// Seconds of song on each side of the playhead in the zoomed view.
const ZOOM = 4;

const context = new AudioContext();

function $<T extends Element>(selector: string) {
	const element = document.querySelector<T>(selector);
	if (!element) throw new Error(`Missing ${selector}`);
	return element;
}

const [status, button, input] = [
	$("#status"),
	$<HTMLButtonElement>("#play"),
	$<HTMLInputElement>("#file"),
];
const [overview, zoom] = [$<HTMLCanvasElement>("#overview"), $<HTMLCanvasElement>("#zoom")];

let song: { buffer: AudioBuffer; analysis: Analysis } | undefined;
let playback: Playback | undefined;

function render() {
	if (!song) return;
	const { buffer, analysis } = song;
	const perSecond = buffer.sampleRate / HOP;
	const at = (playback?.position() ?? 0) * perSecond;
	draw({ canvas: overview, analysis, from: 0, to: analysis.envelope.length, at });
	draw({ canvas: zoom, analysis, from: at - ZOOM * perSecond, to: at + ZOOM * perSecond, at });
	if (playback && at >= analysis.envelope.length) stop();
	if (playback) requestAnimationFrame(render);
}

function stop() {
	playback?.stop();
	playback = undefined;
	button.textContent = "Play";
}

async function load(file: File) {
	stop();
	status.textContent = `Decoding ${file.name}…`;
	const buffer = await decode({ context, file });
	status.textContent = "Analyzing…";
	const started = performance.now();
	const analysis = await analyzeOffThread(samples(buffer));
	const ms = Math.round(performance.now() - started);
	const rate = (analysis.onsets.length / buffer.duration).toFixed(1);
	status.textContent = `${file.name}: ${analysis.onsets.length} onsets, ${rate}/s, analyzed in ${ms} ms`;
	song = { buffer, analysis };
	button.disabled = false;
	render();
}

function toggle() {
	if (playback || !song) return stop();
	void context.resume();
	playback = play({ context, buffer: song.buffer });
	button.textContent = "Stop";
	render();
}

const open = (file: File | undefined) =>
	file &&
	load(file).catch((error: unknown) => (status.textContent = `Can't read it: ${String(error)}`));

button.addEventListener("click", toggle);
input.addEventListener("change", () => open(input.files?.[0]));
addEventListener("dragover", (event) => event.preventDefault());
addEventListener("drop", (event) => {
	event.preventDefault();
	open(event.dataTransfer?.files[0]);
});
addEventListener("resize", render);
