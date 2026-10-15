import { describe, expect, it } from "vitest";

import { motion } from "../motion";
import { POINTS } from "../ridge";

const LENGTH = 200;
const ridges = (height: (f: number, k: number) => number) =>
	Float32Array.from({ length: LENGTH * POINTS }, (_, i) =>
		height(Math.floor(i / POINTS), i % POINTS)
	);
// One note rising at a time across the ridge, as a melody would, over a steady bed.
const melody = (bed: number) => motion(ridges((f, k) => bed + (k === f % POINTS ? 0.2 : 0)));
const [quiet, loud] = [melody(0.1), melody(0.6)];
const held = motion(ridges(() => 0.8));

describe("motion", () => {
	it("is zero for a ridge that holds still, however high", () => {
		expect(Math.max(...held)).toBe(0);
	});

	it("moves with a melody even when its overall level stays flat", () => {
		expect(Math.min(...quiet.subarray(20, 180))).toBeGreaterThan(0);
	});

	it("counts loud movement more than the same movement played quietly", () => {
		expect(Math.min(...loud.subarray(20, 180))).toBeGreaterThan(
			3 * Math.max(...quiet.subarray(20, 180))
		);
	});

	it("counts rises, not falls", () => {
		const falling = motion(ridges((f) => 1 - f / LENGTH));
		expect(Math.max(...falling)).toBe(0);
	});
});
