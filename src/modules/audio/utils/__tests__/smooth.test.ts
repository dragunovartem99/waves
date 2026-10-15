import { describe, expect, it } from "vitest";

import { settle, smooth } from "../smooth";

const values = Float32Array.from([0, 1, 1, 1]);

describe("smooth", () => {
	it("starts from the first value instead of zero", () => {
		expect(smooth({ values: Float32Array.from([4, 4]), factor: 0.1 })[0]).toBe(4);
	});

	it("moves part of the way toward each new value", () => {
		expect([...smooth({ values, factor: 0.5 })]).toEqual([0, 0.5, 0.75, 0.875]);
	});

	it("passes values through at factor 1", () => {
		expect([...smooth({ values, factor: 1 })]).toEqual([...values]);
	});
});

describe("settle", () => {
	const spike = settle({ values: Float32Array.from([0, 0, 0, 4, 0, 0, 0]), factor: 0.5 });
	const [, , before = 0, , after = 0] = spike;

	it("spreads a change to both sides, not just after it", () => {
		expect(before).toBeCloseTo(after, 1);
		expect(before).toBeGreaterThan(0);
	});

	it("peaks where the change happened", () => {
		expect(Math.max(...spike)).toBe(spike[3]);
	});
});
