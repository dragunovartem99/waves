import { HOP, RATE } from "@/modules/audio";

import type { Song } from "../song";
import type { Run } from "../utils/advance";
import type { Pen } from "./canvas";
import { hud } from "./hud";
import { scene } from "./scene";

type Frame = { pen: Pen; song: Song; run: Run; now: number };

// Radians per second the kick ripple travels across the ridges.
const RIPPLE = 9;
// Seconds the red flash takes to fade after a crash.
const FLASH = 0.4;

// One frame of a ride: the field, then the HUD over it.
export function show({ pen, song, run, now }: Frame) {
	const { score, health, u, crashed, ended } = run;
	const { ridges, track, grid, kicks, title } = song;
	const at = (now * RATE) / HOP;
	const [pickups, blocks] = [song.pickups.slice(score.next), song.blocks.slice(health.next)];
	const kick = kicks[Math.round(at)] ?? 0;
	scene({ pen, ridges, track, grid, kick, phase: now * RIPPLE, pickups, blocks, at, u });
	// The loop stops when the ride ends, so a flash there would freeze on screen.
	const flash = ended ? 0 : Math.max(0, 1 - (now - crashed) / FLASH);
	const { duration } = song.buffer;
	hud({ pen, score, title, now, duration, lives: health.lives, flash });
}
