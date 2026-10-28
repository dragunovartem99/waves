import { describe, expect, it } from "vitest";

import type { Hit } from "../judge";
import { judge, START } from "../judge";

const HITS: Hit[] = [
	{ time: 1, lane: 0 },
	{ time: 2, lane: 2 },
	{ time: 2, lane: 1 },
];

describe("judge", () => {
	it("waits for a hit still on its way", () => {
		expect(judge({ hits: HITS, state: START, now: 0.5, lane: 0 })).toBe(START);
	});

	it("scores a hit caught in its lane, slightly early", () => {
		const state = judge({ hits: HITS, state: START, now: 0.95, lane: 0 });
		expect(state).toEqual({ next: 1, score: 10, streak: 1, caught: 1 });
	});

	it("multiplies points by the streak", () => {
		const state = judge({
			hits: HITS,
			state: { next: 1, score: 10, streak: 1, caught: 1 },
			now: 2,
			lane: 2,
		});
		expect(state).toEqual({ next: 2, score: 30, streak: 2, caught: 2 });
	});

	it("still gives a late lane switch its window", () => {
		expect(judge({ hits: HITS, state: START, now: 1.05, lane: 1 }).next).toBe(0);
	});

	it("misses a hit once its window passes, resetting the streak", () => {
		const state = judge({
			hits: HITS,
			state: { next: 0, score: 40, streak: 3, caught: 3 },
			now: 1.1,
			lane: 1,
		});
		expect(state).toEqual({ next: 1, score: 40, streak: 0, caught: 3 });
	});

	it("settles every overdue hit at once", () => {
		expect(judge({ hits: HITS, state: START, now: 5, lane: 0 }).next).toBe(3);
	});

	it("stays put after the last hit", () => {
		const done = { next: 3, score: 0, streak: 0, caught: 0 };
		expect(judge({ hits: HITS, state: done, now: 9, lane: 0 })).toBe(done);
	});
});
