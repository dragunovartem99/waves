import { describe, expect, it } from "vitest";

import { FRESH } from "../advance";
import { aim } from "../aim";
import type { Hit } from "../judge";

const PICKUPS: Hit[] = [{ time: 2, lane: 2 }];
const NEAR = 1.8;

const at = (now: number) => aim({ run: FRESH, pickups: PICKUPS, blocks: [], now });
const dodge = (time: number) =>
	aim({ run: FRESH, pickups: PICKUPS, blocks: [{ time, lane: 1 }], now: 0.5 });

describe("aim", () => {
	it("holds its lane until the next pickup is near, then moves to it", () => {
		expect([at(0.5), at(NEAR)]).toEqual([1, 2]);
	});

	it("holds its lane when there is nothing left to catch", () => {
		expect(aim({ run: FRESH, pickups: [], blocks: [], now: 0.5 })).toBe(1);
	});

	it("holds its lane while a block is about to pass the target", () => {
		const blocks: Hit[] = [{ time: 1.85, lane: 2 }];
		expect(aim({ run: FRESH, pickups: PICKUPS, blocks, now: NEAR })).toBe(1);
	});

	it("ignores blocks further ahead", () => {
		const blocks: Hit[] = [{ time: 1.95, lane: 2 }];
		expect(aim({ run: FRESH, pickups: PICKUPS, blocks, now: NEAR })).toBe(2);
	});
});

describe("aim around blocks", () => {
	it("sidesteps a block arriving in both the target and its own lane", () => {
		const blocks: Hit[] = [
			{ time: 1.85, lane: 2 },
			{ time: 1.88, lane: 1 },
		];
		expect(aim({ run: FRESH, pickups: PICKUPS, blocks, now: NEAR })).toBe(0);
	});

	it("dodges from the middle to either side, picked by the block", () => {
		expect([dodge(0.55), dodge(0.551)]).toEqual([0, 2]);
	});

	it("dodges to a neighbour, not across", () => {
		const run = { ...FRESH, lane: 2 as const };
		const blocks: Hit[] = [{ time: 0.55, lane: 2 }];
		expect(aim({ run, pickups: PICKUPS, blocks, now: 0.5 })).toBe(1);
	});
});
