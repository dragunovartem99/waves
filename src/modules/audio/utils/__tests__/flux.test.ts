import { describe, expect, it } from "vitest";

import { flux } from "../flux";

const frame = (...magnitudes: number[]) => Float32Array.from(magnitudes);
const loud = (magnitude: number) => Math.log1p(100 * magnitude);

describe("flux", () => {
	it("is 0 for the first frame", () => {
		expect(flux([frame(1, 1)])[0]).toBe(0);
	});

	it("sums the rise across bins, log-compressed", () => {
		expect(flux([frame(0, 0), frame(1, 0.5)])[1]).toBeCloseTo(loud(1) + loud(0.5), 5);
	});

	it("ignores bins that fall", () => {
		expect(flux([frame(1, 0), frame(0, 1)])[1]).toBeCloseTo(loud(1), 5);
	});

	it("is 0 for a steady sound", () => {
		expect([...flux([frame(1, 2), frame(1, 2), frame(1, 2)])]).toEqual([0, 0, 0]);
	});

	it("lets a quiet hit register next to loud bass", () => {
		const [, hit = 0] = flux([frame(10, 0), frame(10, 0.01)]);
		expect(hit).toBeGreaterThan(0.5);
	});
});
