import { describe, expect, it } from "vitest";

import { FRESH } from "../advance";
import { aim } from "../aim";
import type { Hit } from "../judge";
import type { Lane } from "../project";
import { route } from "../route";

const PICKUPS: Hit[] = [{ time: 2, lane: 2 }];
const at = (now: number, blocks: Hit[] = []) => custom(PICKUPS, blocks, now);
const custom = (pickups: Hit[], blocks: Hit[], now: number, lane: Lane = 1, next = 0) =>
	aim({
		run: { ...FRESH, lane, score: { ...FRESH.score, next } },
		pickups,
		blocks,
		route: route({ pickups, blocks }, lane),
		now,
	});

describe("aim approaches pickups", () => {
	it("holds its lane until the approach, then moves to the pickup", () => {
		expect([at(0.5), at(1.3)]).toEqual([1, 2]);
	});

	it("allows more time for a two-lane approach", () => {
		expect(custom(PICKUPS, [], 1, 0)).toBe(2);
	});

	it("holds its lane when there is nothing left to catch", () => {
		expect(custom([], [], 0.5)).toBe(1);
	});

	it("does not return to the middle between pickups in the same lane", () => {
		const pickups: Hit[] = [
			{ time: 2, lane: 2 },
			{ time: 3, lane: 2 },
		];
		expect(custom(pickups, [], 2.1, 2, 1)).toBe(2);
	});

	it("lingers briefly after a pickup before the next turn", () => {
		const pickups: Hit[] = [
			{ time: 2, lane: 2 },
			{ time: 3, lane: 0 },
		];
		expect(custom(pickups, [], 2.05, 2, 1)).toBe(2);
		expect(custom(pickups, [], 2.21, 2, 1)).toBe(0);
	});

	it("does not linger when the next pickup immediately follows", () => {
		const pickups: Hit[] = [
			{ time: 2, lane: 2 },
			{ time: 2.1, lane: 0 },
		];
		expect(custom(pickups, [], 2.05, 2, 1)).toBe(0);
	});
});

describe("aim plans around blocks", () => {
	it("looks beyond the immediate collision window", () => {
		expect(at(1.75, [{ time: 1.9, lane: 2 }])).toBe(1);
	});

	it("chooses a dodge that also sets up the next pickup", () => {
		expect(at(1.2, [{ time: 1.8, lane: 1 }])).toBe(2);
	});

	it("chooses the side that needs fewer future moves", () => {
		const blocks: Hit[] = [
			{ time: 1.5, lane: 1 },
			{ time: 2.5, lane: 0 },
		];
		expect(custom([], blocks, 1)).toBe(2);
	});

	it("breaks an otherwise equal dodge deterministically", () => {
		expect(custom([], [{ time: 0.55, lane: 1 }], 0.5)).toBe(0);
	});

	it("uses the seventh event to choose the first dodge", () => {
		const blocks: Hit[] = [
			{ time: 1, lane: 1 },
			{ time: 2, lane: 1 },
			{ time: 3, lane: 1 },
			{ time: 4, lane: 1 },
			{ time: 5, lane: 1 },
			{ time: 6, lane: 1 },
			{ time: 7, lane: 0 },
		];
		expect(custom([], blocks, 0.5)).toBe(2);
	});

	it("prioritizes a safe lane over an impossible pickup", () => {
		expect(at(1.5, [{ time: 2, lane: 2 }])).toBe(1);
	});
});
