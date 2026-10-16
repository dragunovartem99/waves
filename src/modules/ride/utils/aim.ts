import type { Run } from "./advance";
import type { Hit } from "./judge";
import type { Lane } from "./project";

type Sight = { run: Run; pickups: Hit[]; blocks: Hit[]; now: number };

// Seconds ahead a lane must be clear of unsettled blocks: they hit the instant they arrive,
// so this has to outlast the gap to the next frame.
const AHEAD = 0.1;
// Seconds before a pickup when the bot moves to its lane.
const SOON = 0.3;
// Lanes to sidestep into, nearest first.
const NEAR: Record<Lane, Lane[]> = { 0: [1, 2], 1: [0, 2], 2: [1, 0] };

// From the middle either side will do; the block's arrival picks one, so dodges vary
// without making this impure.
const sides = (lane: Lane, block?: Hit) =>
	lane === 1 && Math.round((block?.time ?? 0) * 1000) % 2 ? NEAR[1].toReversed() : NEAR[lane];

// Autopilot: holds its lane until the next pickup is SOON, then moves to it, unless a block is
// about to arrive there; then holds or sidesteps to the nearest clear lane.
export function aim({ run, pickups, blocks, now }: Sight): Lane {
	const pickup = pickups[run.score.next];
	const goal = pickup && pickup.time - now <= SOON ? pickup.lane : run.lane;
	const coming = blocks.slice(run.health.next).filter(({ time }) => time <= now + AHEAD);
	const clear = (lane: Lane) => !coming.some((block) => block.lane === lane);
	const order = [goal, run.lane, ...sides(run.lane, coming[0])];
	return order.find((lane) => clear(lane)) ?? run.lane;
}
