import type { Lane } from "@/modules/ride";

type Move = Record<Lane, Lane>;
type Controls = {
	canvas: HTMLCanvasElement;
	pauseButton: HTMLButtonElement;
	steer: (move: Move) => void;
	// Escape and the pause button: pause a ride, or resume a paused one.
	toggle: () => void;
	pause: () => void;
	slow: (down: boolean) => void;
};

export const LEFT: Move = { 0: 0, 1: 0, 2: 1 };
export const RIGHT: Move = { 0: 1, 1: 2, 2: 2 };

// ←/→ or tapping a half of the screen steers; holding Space slows time; leaving the tab pauses.
export function controls({ canvas, pauseButton, steer, toggle, pause, slow }: Controls) {
	addEventListener("keydown", (event) => {
		if (event.key === "ArrowLeft") steer(LEFT);
		if (event.key === "ArrowRight") steer(RIGHT);
		if (event.key === " ") {
			event.preventDefault();
			if (!event.repeat) slow(true);
			return;
		}
		if (event.key !== "Escape") return;
		event.preventDefault();
		toggle();
	});
	addEventListener("keyup", (event) => {
		if (event.key !== " ") return;
		event.preventDefault();
		slow(false);
	});
	addEventListener("blur", () => slow(false));
	canvas.addEventListener("pointerdown", (event) =>
		steer(event.clientX < canvas.clientWidth / 2 ? LEFT : RIGHT)
	);
	pauseButton.addEventListener("click", toggle);
	document.addEventListener("visibilitychange", () => document.hidden && pause());
}
