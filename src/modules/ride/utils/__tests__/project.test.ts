import { describe, expect, it } from "vitest";

import { project } from "../project";

describe("project", () => {
	it("centres the middle of the front ridge", () => {
		expect(project({ depth: 0, u: 0.5, value: 0 })).toEqual({ x: 0.5, y: 0.84, scale: 1 });
	});

	it("raises a point by its value, most in the centre", () => {
		const { y } = project({ depth: 0, u: 0.5, value: 1 });
		expect(y).toBeCloseTo(0.84 - 0.17, 5);
	});

	it("flattens the edges", () => {
		const edge = project({ depth: 0, u: 0, value: 1 });
		const centre = project({ depth: 0, u: 0.5, value: 1 });
		expect(0.84 - edge.y).toBeLessThan((0.84 - centre.y) / 3);
	});

	it("narrows and lifts far ridges toward the horizon", () => {
		const near = project({ depth: 0, u: 0, value: 0 });
		const far = project({ depth: 1, u: 0, value: 0 });
		expect(far.x).toBeGreaterThan(near.x);
		expect(far.y).toBeLessThan(near.y);
		expect(far.scale).toBeCloseTo(1 / 3.6, 5);
	});

	it("keeps the horizon on screen", () => {
		expect(project({ depth: 1, u: 0.5, value: 1 }).y).toBeGreaterThan(0);
	});

	it("grows ridges on a kick", () => {
		const calm = project({ depth: 0, u: 0.5, value: 1 });
		const kicked = project({ depth: 0, u: 0.5, value: 1, kick: 1 });
		expect(kicked.y).toBeLessThan(calm.y - 0.1);
	});

	it("ripples even a flat ridge on a kick", () => {
		const heights = [0.1, 0.2, 0.3].map((u) => project({ depth: 0, u, value: 0, kick: 1 }).y);
		expect(new Set(heights).size).toBe(3);
	});

	it("keeps x steady on a kick", () => {
		expect(project({ depth: 0.5, u: 0.2, value: 1, kick: 1 }).x).toBe(
			project({ depth: 0.5, u: 0.2, value: 1 }).x
		);
	});
});
