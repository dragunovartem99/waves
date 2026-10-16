import type { Hit } from "./judge";
import type { Lane } from "./project";

export type Health = { next: number; lives: number };
type Turn = { blocks: Hit[]; state: Health; now: number; lane: Lane };

export const LIVES = 3;
export const HEALTHY: Health = { next: 0, lives: LIVES };

// Settles every block that reached the front ridge by `now`: in its lane costs a life. No
// window here — a block counts the instant it arrives, so dodging late is too late.
export function crash(turn: Turn): Health {
	const { blocks, state, now, lane } = turn;
	const block = blocks[state.next];
	if (!block || block.time > now) return state;
	const lives = block.lane === lane ? state.lives - 1 : state.lives;
	return crash({ ...turn, state: { next: state.next + 1, lives: Math.max(0, lives) } });
}
