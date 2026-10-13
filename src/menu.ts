import { $ } from "./dom";

export type Action = { label: string; run: () => void };
type Screen = { title: string; note?: string; actions?: Action[] };

const panel = $<HTMLElement>("#menu");
const title = $("#menu-title");
const note = $("#menu-note");
const actions = $("#menu-actions");

function button({ label, run }: Action) {
	const element = document.createElement("button");
	element.type = "button";
	element.textContent = label;
	element.addEventListener("click", run);
	return element;
}

// The one overlay for every stop in the game: start, loading, pause, the end of a ride.
export function menu(screen: Screen) {
	title.textContent = screen.title;
	note.textContent = screen.note ?? "";
	actions.replaceChildren(...(screen.actions ?? []).map((action) => button(action)));
	panel.hidden = false;
	actions.querySelector("button")?.focus();
}

export const close = () => (panel.hidden = true);
export const isOpen = () => !panel.hidden;
