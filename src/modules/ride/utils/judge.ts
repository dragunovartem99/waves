import type { Lane } from "@/modules/audio";

export type Hit = { time: number; lane: Lane };
export type Score = { next: number; score: number; streak: number };
type Turn = { hits: Hit[]; state: Score; now: number; lane: Lane };

// Seconds either side of a hit's time that still count as catching it.
const WINDOW = 0.08;
const POINTS = 10;

export const START: Score = { next: 0, score: 0, streak: 0 };

const caught = ({ next, score, streak }: Score) => ({
	next: next + 1,
	score: score + POINTS * (streak + 1),
	streak: streak + 1,
});

const missed = ({ next, score }: Score) => ({ next: next + 1, score, streak: 0 });

// Settles every hit that reached the front ridge by `now`, in order: in its lane within the
// window scores, past the window misses. The song never stops; a miss only resets the streak.
export function judge(turn: Turn): Score {
	const { hits, state, now, lane } = turn;
	const hit = hits[state.next];
	if (!hit) return state;
	const inLane = hit.lane === lane && Math.abs(hit.time - now) <= WINDOW;
	if (!inLane && hit.time >= now - WINDOW) return state;
	return judge({ ...turn, state: inLane ? caught(state) : missed(state) });
}
