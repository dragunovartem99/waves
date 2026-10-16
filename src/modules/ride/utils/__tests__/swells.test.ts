import { describe, expect, it } from "vitest";

import { swells } from "../swells";

const strengths = (runs: Record<number, number[]>) => {
	const out = Array.from({ length: 400 }, () => 0);
	Object.entries(runs).forEach(([start, values]) =>
		values.forEach((value, i) => {
			out[Number(start) + i] = value;
		})
	);
	return out;
};

describe("swells", () => {
	it("puts one spot on each run, at its strongest ring", () => {
		expect(swells(strengths({ 20: [1, 4, 2], 50: [3] }))).toEqual([
			{ ring: 21, strength: 4 },
			{ ring: 50, strength: 3 },
		]);
	});

	it("splits a run longer than it searches", () => {
		expect(swells(strengths({ 20: Array.from({ length: 200 }, () => 1) }))).toHaveLength(2);
	});
});
