import type { Hit } from "./judge";
import type { Lane } from "./project";

type Hits = { pickups: Hit[]; blocks: Hit[] };
export type Route = { pickups: Lane[]; blocks: Lane[] };
type Scheduled = { lane: Lane; index: number };
type Moment = { time: number; pickups: Scheduled[]; blocks: Scheduled[] };
type Choice = { lane: Lane; cost: number };

const ORDER: Lane[] = [0, 1, 2];
const SWITCH = 0.2;
const MISS = 100;
const CRASH = 1000;

// Merge simultaneous hits into moments, retaining each hit's index for the finished route.
function moments({ pickups, blocks }: Hits): Moment[] {
	const events = [
		...pickups.map(({ time, lane }, index) => ({ time, lane, index, pickup: true })),
		...blocks.map(({ time, lane }, index) => ({ time, lane, index, pickup: false })),
	].toSorted((a, b) => a.time - b.time);
	return events.reduce<Moment[]>((planned, { time, lane, index, pickup }) => {
		let moment = planned.at(-1);
		if (!moment || moment.time !== time) {
			moment = { time, pickups: [], blocks: [] };
			planned.push(moment);
		}
		(pickup ? moment.pickups : moment.blocks).push({ lane, index });
		return planned;
	}, []);
}

const penalty = ({ pickups, blocks }: Moment, lane: Lane) =>
	(blocks.some((hit) => hit.lane === lane) ? CRASH : 0) +
	(pickups.length > 0 && !pickups.some((hit) => hit.lane === lane) ? MISS : 0);

// Simply minimize distance across the road, with a small switch charge to prevent zigzags.
const movement = (from: Lane, to: Lane) => Math.abs(from - to) + (from === to ? 0 : SWITCH);

// For each event and previous lane, memoize the cheapest route through the rest of the song.
function plan(list: Moment[], start: Lane): Lane[] {
	const cache = new Map<string, Choice>();
	function best(index: number, previous: Lane): Choice {
		const moment = list[index];
		if (!moment) return { lane: previous, cost: 0 };
		const key = `${index}:${previous}`;
		const cached = cache.get(key);
		if (cached) return cached;
		const choice = ORDER.map((lane) => ({
			lane,
			cost: penalty(moment, lane) + movement(previous, lane) + best(index + 1, lane).cost,
		})).reduce((cheapest, option) => (option.cost < cheapest.cost ? option : cheapest));
		cache.set(key, choice);
		return choice;
	}
	let previous = start;
	return list.map((_, index) => {
		const lane = best(index, previous).lane;
		previous = lane;
		return lane;
	});
}

// One global plan for the whole song, aligned with the original pickup and block arrays.
export function route(hits: Hits, start: Lane = 1): Route {
	const list = moments(hits);
	const lanes = plan(list, start);
	const planned: Route = { pickups: [], blocks: [] };
	list.forEach(({ pickups, blocks }, index) => {
		const lane = lanes[index] ?? start;
		pickups.forEach((hit) => (planned.pickups[hit.index] = lane));
		blocks.forEach((hit) => (planned.blocks[hit.index] = lane));
	});
	return planned;
}
