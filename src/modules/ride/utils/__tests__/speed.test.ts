import { describe, expect, it } from "vitest";

import { speeds } from "../speed";

// Mean 1, peak 4: the baseline is twice the mean, 2.
const song = Float32Array.from([0, 0.5, 1, 1, 0.5, 1, 4, 0, 1, 1]);

describe("speeds", () => {
	const out = speeds(song);

	it("rides flat out from twice the mean intensity up", () => {
		expect(out[6]).toBe(1);
	});

	it("scales below that", () => {
		expect(out[2]).toBeCloseTo(0.5, 5);
	});

	it("never stops, even in silence", () => {
		expect(out[0]).toBeCloseTo(0.1, 5);
	});
});
