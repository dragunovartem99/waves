import { rank, RANKS } from "@/modules/ride";

import { $ } from "./dom";

export type Action = { label: string; run: () => void };
// `keys` shows the controls line; only the start screen needs it. `result` fills the stats and
// the rank meter; only the end of a ride has one.
type Screen = {
	title: string;
	note?: string;
	actions?: Action[];
	keys?: boolean;
	result?: { score: number; accuracy: number };
};

const panel = $<HTMLElement>("#menu");
const title = $("#menu-title");
const note = $("#menu-note");
const actions = $("#menu-actions");
const keys = $<HTMLElement>("#menu .keys");
const meter = $<HTMLElement>("#menu-rank");
const scale = $<HTMLElement>("#menu-rank .scale");
const reading = $("#menu-rank .reading");
const points = $("#menu-rank .score");
// Matches the CSS: pixels per percent on the ruler, and how long it slides.
const PERCENT = 10;
const SLIDE = 1600;
let timer = 0;

function button({ label, run }: Action) {
	const element = document.createElement("button");
	element.type = "button";
	element.textContent = label;
	element.addEventListener("click", run);
	return element;
}

// Rank names on the ruler, each at the accuracy it starts from.
const marks = () =>
	RANKS.map(({ name, from }) =>
		Object.assign(document.createElement("span"), {
			textContent: name,
			style: `left: ${100 * from * PERCENT}px`,
		})
	);

// Slides the ruler from 0 to the accuracy in one glide; when it settles, the rank reached lights
// up. Only a perfect ride reads 100. Any new screen cancels a slide still running.
function measure(accuracy?: number) {
	clearTimeout(timer);
	meter.hidden = accuracy === undefined;
	const labels = marks();
	scale.replaceChildren(...labels);
	scale.style.transition = "none";
	scale.style.transform = "";
	reading.classList.remove("shown");
	if (accuracy === undefined) return;
	const percent = Math.floor(100 * accuracy);
	const reached = rank(accuracy);
	reading.textContent = `${percent}%`;
	// Applies the reset before the slide, so it starts from 0 every time.
	void scale.offsetWidth;
	scale.style.transition = "";
	scale.style.transform = `translateX(${-percent * PERCENT}px)`;
	timer = window.setTimeout(() => {
		labels[reached]?.classList.add("reached");
		reading.classList.add("shown");
	}, SLIDE);
}

// The one overlay for every stop in the game: start, loading, pause, the end of a ride.
export function menu(screen: Screen) {
	title.textContent = screen.title;
	note.textContent = screen.note ?? "";
	actions.replaceChildren(...(screen.actions ?? []).map((action) => button(action)));
	keys.hidden = !screen.keys;
	// Shown first: a hidden ruler wouldn't animate its slide.
	panel.hidden = false;
	points.textContent = String(screen.result?.score ?? 0).padStart(5, "0");
	measure(screen.result?.accuracy);
	actions.querySelector("button")?.focus();
}

export const close = () => (panel.hidden = true);
export const isOpen = () => !panel.hidden;
