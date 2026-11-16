import type { Song } from "../song";
import type { Run } from "../utils/advance";
import type { Pen } from "./canvas";
import { hud } from "./hud";
import type { World } from "./scene";

type Frame = { pen: Pen; world: World; song: Song; run: Run; now: number };

// Seconds the red flash takes to fade after a crash.
const FLASH = 0.4;

// One frame of a ride: the 3D road, then a transparent 2D HUD over it.
export function show({ pen, world, song, run, now }: Frame) {
	const { score, health, crashed, ended } = run;
	world.show({ song, run, now });
	pen.context.clearRect(0, 0, pen.width, pen.height);
	// The loop stops when the ride ends, so a flash there would freeze on screen.
	const flash = ended ? 0 : Math.max(0, 1 - (now - crashed) / FLASH);
	const { duration } = song.buffer;
	hud({ pen, score, title: song.title, now, duration, lives: health.lives, flash });
}
