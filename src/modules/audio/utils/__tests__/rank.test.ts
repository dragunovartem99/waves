import { describe, expect, it } from "vitest";

import { rank } from "../rank";

const ranks = (...values: number[]) => [...rank(Float32Array.from(values))];

describe("rank", () => {
	it("places each value among the rest", () => {
		expect(ranks(30, 10, 20, 40)).toEqual([0.625, 0.125, 0.375, 0.875]);
	});

	it("puts ties in the middle of their run", () => {
		expect(ranks(5, 5, 5, 5)).toEqual([0.5, 0.5, 0.5, 0.5]);
	});

	it("ignores the scale", () => {
		expect(ranks(0.5, 0.75, 1)).toEqual(ranks(1, 50, 1000));
	});

	it("is empty without values", () => {
		expect(ranks()).toHaveLength(0);
	});
});
