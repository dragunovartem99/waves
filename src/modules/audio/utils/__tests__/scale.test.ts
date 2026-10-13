import { describe, expect, it } from "vitest";

import { scale } from "../scale";

const values = (...items: number[]) => Float32Array.from(items);

describe("scale", () => {
	it("is the mean of the positive rises", () => {
		// rises per frame: 2, 2, 4, 4, 0, 0
		expect(scale(values(0, 2, 0, 4, 0, 0))).toBe(3);
	});

	it("ignores falls", () => {
		// rises per frame: 0, -5, 4, 4
		expect(scale(values(5, 0, 0, 4))).toBe(4);
	});

	it("is 1 for a band that never rises", () => {
		expect(scale(values(3, 3, 3))).toBe(1);
	});

	it("is 1 without values", () => {
		expect(scale(new Float32Array(0))).toBe(1);
	});
});
