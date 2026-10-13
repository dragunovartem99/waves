import type { Lane } from "@/modules/audio";

type Move = Record<Lane, Lane>;
type Controls = {
	canvas: HTMLCanvasElement;
	pauseButton: HTMLButtonElement;
	steer: (move: Move) => void;
	// Space and Escape: pause a ride, or resume a paused one.
	toggle: () => void;
	pause: () => void;
};

export const LEFT: Move = { 0: 0, 1: 0, 2: 1 };
export const RIGHT: Move = { 0: 1, 1: 2, 2: 2 };

// ←/→ or tapping a half of the screen steers; leaving the tab pauses.
export function controls({ canvas, pauseButton, steer, toggle, pause }: Controls) {
	addEventListener("keydown", (event) => {
		if (event.key === "ArrowLeft") steer(LEFT);
		if (event.key === "ArrowRight") steer(RIGHT);
		if (event.key !== " " && event.key !== "Escape") return;
		event.preventDefault();
		toggle();
	});
	canvas.addEventListener("pointerdown", (event) =>
		steer(event.clientX < canvas.clientWidth / 2 ? LEFT : RIGHT)
	);
	pauseButton.addEventListener("click", pause);
	document.addEventListener("visibilitychange", () => document.hidden && pause());
}
