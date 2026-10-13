import { describe, expect, it } from "vitest";

import { POINTS } from "../ridge";
import { ridges } from "../ridges";

const BINS = 512;

const spectrum = (level: number) => new Float32Array(BINS).fill(level);

describe("ridges", () => {
	it("stacks one ridge per frame", () => {
		expect(ridges([spectrum(1), spectrum(2)])).toHaveLength(2 * POINTS);
	});

	it("scales the loudest point to 1, keeping frames in proportion", () => {
		const all = ridges([spectrum(1), spectrum(3)]);
		expect(all[POINTS]).toBeCloseTo(1, 5);
		// a flat spectrum's ridge sits at log1p(10 · level)
		expect(all[0]).toBeCloseTo(Math.log1p(10) / Math.log1p(30), 5);
	});

	it("stays at 0 for silence", () => {
		expect(Math.max(...ridges([spectrum(0)]))).toBe(0);
	});
});
