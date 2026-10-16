import { describe, expect, it } from "vitest";

import { rings, RINGS } from "../rings";

describe("rings", () => {
	it("lays RINGS per frame at full speed", () => {
		expect(rings(new Float32Array(100).fill(1)).length).toBeCloseTo(100 * RINGS, -0.5);
	});

	it("lays fewer where the ride is slow", () => {
		expect(rings(new Float32Array(100).fill(0.5)).length).toBeCloseTo(50 * RINGS, -0.5);
	});

	it("carries the top speed since the last ring", () => {
		const [first] = rings(Float32Array.from([0.125, 0.375, 0.25]));
		expect(first).toEqual({ frame: 2, speed: 0.375 });
	});

	it("is empty for an empty song", () => {
		expect(rings(new Float32Array(0))).toEqual([]);
	});
});
