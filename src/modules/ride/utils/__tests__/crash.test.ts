import { describe, expect, it } from "vitest";

import { crash, HEALTHY } from "../crash";
import type { Hit } from "../judge";

const BLOCKS: Hit[] = [
	{ time: 1, lane: 0 },
	{ time: 2, lane: 2 },
];

describe("crash", () => {
	it("waits for a block still on its way", () => {
		expect(crash({ blocks: BLOCKS, state: HEALTHY, now: 0.99, lane: 0 })).toBe(HEALTHY);
	});

	it("costs a life when a block arrives in the player's lane", () => {
		expect(crash({ blocks: BLOCKS, state: HEALTHY, now: 1, lane: 0 })).toEqual({
			next: 1,
			lives: 2,
		});
	});

	it("lets a block pass in another lane", () => {
		expect(crash({ blocks: BLOCKS, state: HEALTHY, now: 1, lane: 1 })).toEqual({
			next: 1,
			lives: 3,
		});
	});

	it("settles every overdue block at once", () => {
		expect(crash({ blocks: BLOCKS, state: HEALTHY, now: 5, lane: 1 }).next).toBe(2);
	});

	it("never drops below 0 lives", () => {
		expect(crash({ blocks: BLOCKS, state: { next: 0, lives: 0 }, now: 1, lane: 0 }).lives).toBe(
			0
		);
	});
});
