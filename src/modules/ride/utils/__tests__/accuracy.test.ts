import { describe, expect, it } from "vitest";

import { accuracy } from "../accuracy";
import { START } from "../judge";

const score = (caught: number) => ({ ...START, caught });
const hits = (count: number) =>
	Array.from({ length: count }, () => ({ time: 0, lane: 1 as const }));

describe("accuracy", () => {
	it("is perfect when every pickup is caught and every block dodged", () => {
		const health = { next: 4, lives: 3 };
		expect(accuracy({ score: score(6), health, pickups: hits(6), blocks: hits(4) })).toBe(1);
	});

	it("counts a crash as a miss", () => {
		const health = { next: 4, lives: 2 };
		expect(accuracy({ score: score(6), health, pickups: hits(6), blocks: hits(4) })).toBe(0.9);
	});

	it("counts hits never reached as missed", () => {
		const health = { next: 3, lives: 0 };
		expect(accuracy({ score: score(3), health, pickups: hits(6), blocks: hits(4) })).toBe(0.3);
	});

	it("is 0 for a song with no hits", () => {
		const health = { next: 0, lives: 3 };
		expect(accuracy({ score: score(0), health, pickups: hits(0), blocks: hits(0) })).toBe(0);
	});
});
