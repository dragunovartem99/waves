import { describe, expect, it } from "vitest";

import { FRESH } from "../advance";
import { aim } from "../aim";
import type { Hit } from "../judge";

const PICKUPS: Hit[] = [{ time: 2, lane: 2 }];

describe("aim", () => {
	it("heads for the next pickup's lane early", () => {
		expect(aim({ run: FRESH, pickups: PICKUPS, blocks: [], now: 0.5 })).toBe(2);
	});

	it("holds its lane when there is nothing left to catch", () => {
		expect(aim({ run: FRESH, pickups: [], blocks: [], now: 0.5 })).toBe(1);
	});

	it("holds its lane while a block is about to pass the target", () => {
		const blocks: Hit[] = [{ time: 0.55, lane: 2 }];
		expect(aim({ run: FRESH, pickups: PICKUPS, blocks, now: 0.5 })).toBe(1);
	});

	it("ignores blocks further ahead", () => {
		const blocks: Hit[] = [{ time: 1.5, lane: 2 }];
		expect(aim({ run: FRESH, pickups: PICKUPS, blocks, now: 0.5 })).toBe(2);
	});
});

describe("aim around blocks", () => {
	it("sidesteps a block arriving in both the target and its own lane", () => {
		const blocks: Hit[] = [
			{ time: 0.55, lane: 2 },
			{ time: 0.58, lane: 1 },
		];
		expect(aim({ run: FRESH, pickups: PICKUPS, blocks, now: 0.5 })).toBe(0);
	});

	it("dodges from the middle to either side, picked by the block", () => {
		const pickups: Hit[] = [{ time: 2, lane: 1 }];
		const dodge = (time: number) =>
			aim({ run: FRESH, pickups, blocks: [{ time, lane: 1 }], now: 0.5 });
		expect([dodge(0.55), dodge(0.551)]).toEqual([0, 2]);
	});

	it("dodges to a neighbour, not across", () => {
		const run = { ...FRESH, lane: 2 as const };
		const blocks: Hit[] = [{ time: 0.55, lane: 2 }];
		expect(aim({ run, pickups: [{ time: 2, lane: 2 }], blocks, now: 0.5 })).toBe(1);
	});

	it("after a dodge, stays put until the next pickup is near", () => {
		const run = { ...FRESH, health: { next: 1, lives: 3 } };
		const blocks: Hit[] = [{ time: 0.4, lane: 2 }];
		const at = (now: number) => aim({ run, pickups: PICKUPS, blocks, now });
		expect([at(0.5), at(1.8)]).toEqual([1, 2]);
	});

	it("after a catch, heads for the next pickup at once", () => {
		const run = {
			...FRESH,
			score: { next: 1, score: 10, streak: 1 },
			health: { next: 1, lives: 3 },
		};
		const pickups: Hit[] = [{ time: 0.45, lane: 1 }, ...PICKUPS];
		const blocks: Hit[] = [{ time: 0.4, lane: 2 }];
		expect(aim({ run, pickups, blocks, now: 0.5 })).toBe(2);
	});
});
