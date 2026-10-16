import { describe, expect, it } from "vitest";

import { random } from "../random";

const draw = (seed: number) => Array.from({ length: 100 }, random(seed));

describe("random", () => {
	it("repeats for the same seed", () => {
		expect(draw(42)).toEqual(draw(42));
	});

	it("differs between seeds", () => {
		expect(draw(42)).not.toEqual(draw(43));
	});

	it("stays within 0–1", () => {
		expect(Math.min(...draw(7))).toBeGreaterThanOrEqual(0);
		expect(Math.max(...draw(7))).toBeLessThan(1);
	});
});
