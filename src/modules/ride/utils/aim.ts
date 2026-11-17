import type { Run } from "./advance";
import type { Hit } from "./judge";
import type { Lane } from "./project";
import type { Route } from "./route";

type Sight = {
	run: Run;
	pickups: Hit[];
	blocks: Hit[];
	route: Route;
	now: number;
};

const BASE = 0.55;
const PER_LANE = 0.25;
const REST = 0.2;
const MIN_LEAD = 0.15;

// Follow the route calculated for the whole song. After a hit, settle briefly before turning; on
// tightly spaced hits, MIN_LEAD overrides that rest so the next maneuver still starts in time.
export function aim({ run, pickups, blocks, route, now }: Sight): Lane {
	const pickup = pickups[run.score.next];
	const block = blocks[run.health.next];
	const toPickup = !!pickup && (!block || pickup.time <= block.time);
	const next = toPickup ? pickup : block;
	const goal = toPickup ? route.pickups[run.score.next] : route.blocks[run.health.next];
	if (!next || goal === undefined) return run.lane;
	const lead = BASE + Math.abs(goal - run.lane) * PER_LANE;
	const settled = Math.max(
		pickups[run.score.next - 1]?.time ?? -Infinity,
		blocks[run.health.next - 1]?.time ?? -Infinity
	);
	const ready = Math.min(settled + REST, next.time - MIN_LEAD);
	return now >= Math.max(next.time - lead, ready) ? goal : run.lane;
}
