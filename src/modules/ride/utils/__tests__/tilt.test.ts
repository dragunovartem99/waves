import { describe, expect, it } from "vitest";

import { tilts } from "../tilt";

const at = (speed: number, count = 500) =>
	tilts(Array.from({ length: count }, (_, frame) => ({ frame, speed })));

describe("tilts", () => {
	it("climbs where the music is calm", () => {
		expect(at(0.1).at(-1)).toBeGreaterThan(0.6);
	});

	it("dives where it's loud", () => {
		expect(at(1).at(-1)).toBeCloseTo(-0.7, 3);
	});

	it("eases toward the curve instead of jumping", () => {
		expect(at(1, 1)[0]).toBeCloseTo(-0.7 * 0.04, 5);
	});

	it("levels out in the middle", () => {
		expect(at(0.5).at(-1)).toBeCloseTo(0, 3);
	});
});
