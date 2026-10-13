import { describe, expect, it } from "vitest";

import { mono } from "../mono";

describe("mono", () => {
	it("averages the channels", () => {
		expect([...mono([Float32Array.from([1, 0]), Float32Array.from([0, 0.5])])]).toEqual([
			0.5, 0.25,
		]);
	});

	it("copies a single channel instead of returning it", () => {
		const channel = Float32Array.from([0.5]);
		expect(mono([channel])).not.toBe(channel);
	});
});
