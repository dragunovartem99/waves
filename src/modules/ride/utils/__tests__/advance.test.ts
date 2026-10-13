import { describe, expect, it } from "vitest";

import { advance, FRESH } from "../advance";

const pickups = [{ time: 1, lane: 1 as const }];
const blocks = [{ time: 2, lane: 1 as const }];
const tick = { pickups, blocks, duration: 10 };
const streaking = { ...FRESH, score: { next: 0, score: 50, streak: 4 } };

describe("advance", () => {
	it("scores a pickup in the player's lane", () => {
		expect(advance({ ...tick, run: FRESH, now: 1 }).score).toEqual({
			next: 1,
			score: 10,
			streak: 1,
		});
	});

	it("takes a life and the streak on a crash, and remembers when", () => {
		const run = advance({
			...tick,
			run: { ...streaking, score: { next: 1, score: 50, streak: 4 } },
			now: 2,
		});
		expect([run.health.lives, run.score.streak, run.crashed]).toEqual([2, 0, 2]);
	});

	it("dodges a block from another lane", () => {
		expect(advance({ ...tick, run: { ...FRESH, lane: 0 }, now: 2 }).health.lives).toBe(3);
	});

	it("ends when the last life goes", () => {
		const run = { ...FRESH, health: { next: 0, lives: 1 } };
		expect(advance({ ...tick, run, now: 2 }).ended).toBe(true);
	});

	it("ends with the song", () => {
		expect(advance({ ...tick, run: { ...FRESH, lane: 0 }, now: 10 }).ended).toBe(true);
	});

	it("eases the dot toward its lane", () => {
		const { u } = advance({ ...tick, run: { ...FRESH, lane: 2 }, now: 0 });
		expect(u).toBeGreaterThan(0.5);
		expect(u).toBeLessThan(0.7);
	});
});
