import { describe, expect, it } from "vitest";

import { envelope } from "../envelope";

describe("envelope", () => {
	it("is the RMS of each frame", () => {
		const frames = [new Float32Array(4).fill(0.5), new Float32Array(4).fill(-1)];
		expect([...envelope(frames)]).toEqual([0.5, 1]);
	});

	it("is empty without frames", () => {
		expect(envelope([])).toHaveLength(0);
	});
});
