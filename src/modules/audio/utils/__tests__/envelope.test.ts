import { describe, expect, it } from "vitest";

import { envelope, HOP } from "../envelope";

describe("envelope", () => {
	it("gives one value per full hop", () => {
		expect(envelope(new Float32Array(HOP * 3 + 10))).toHaveLength(3);
	});

	it("is the RMS of each hop", () => {
		const samples = new Float32Array(HOP * 2);
		samples.fill(0.5, 0, HOP);
		samples.fill(-1, HOP);
		expect([...envelope(samples)]).toEqual([0.5, 1]);
	});

	it("is empty for audio shorter than a hop", () => {
		expect(envelope(new Float32Array(HOP - 1))).toHaveLength(0);
	});
});
