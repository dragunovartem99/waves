import type { Health } from "./crash";
import { crash, HEALTHY } from "./crash";
import type { Hit, Score } from "./judge";
import { judge, START } from "./judge";
import type { Lane } from "./project";
import { LANES } from "./project";

// One ride's state; `u` is the dot's eased position, `crashed` the time of the last crash.
export type Run = {
	score: Score;
	health: Health;
	lane: Lane;
	u: number;
	crashed: number;
	ended: boolean;
};
type Tick = { run: Run; pickups: Hit[]; blocks: Hit[]; now: number; duration: number };

// Share of the gap to the target lane the dot covers per frame.
const EASE = 0.35;

export const FRESH: Run = {
	score: START,
	health: HEALTHY,
	lane: 1,
	u: LANES[1],
	crashed: -Infinity,
	ended: false,
};

// Moves a ride to `now`: settles pickups and blocks; a crash also breaks the streak. The ride
// ends when lives run out or the song does.
export function advance({ run, pickups, blocks, now, duration }: Tick): Run {
	const { lane } = run;
	const health = crash({ blocks, state: run.health, now, lane });
	const hurt = health.lives < run.health.lives;
	const judged = judge({ hits: pickups, state: run.score, now, lane });
	return {
		score: hurt ? { ...judged, streak: 0 } : judged,
		health,
		lane,
		u: run.u + (LANES[lane] - run.u) * EASE,
		crashed: hurt ? now : run.crashed,
		ended: health.lives === 0 || now >= duration,
	};
}
