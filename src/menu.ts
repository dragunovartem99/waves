import { $ } from "./dom";

export type Action = { label: string; run: () => void };
// `keys` shows the controls line; only the start screen needs it.
type Screen = { title: string; note?: string; actions?: Action[]; keys?: boolean };

const panel = $<HTMLElement>("#menu");
const title = $("#menu-title");
const note = $("#menu-note");
const actions = $("#menu-actions");
const keys = $<HTMLElement>("#menu .keys");

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
	keys.hidden = !screen.keys;
	panel.hidden = false;
	actions.querySelector("button")?.focus();
}

export const close = () => (panel.hidden = true);
export const isOpen = () => !panel.hidden;
