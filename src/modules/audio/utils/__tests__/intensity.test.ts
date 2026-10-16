import { describe, expect, it } from "vitest";

import { intensity } from "../intensity";

const BINS = 512;

const frame = (level: (bin: number) => number) =>
	Float32Array.from({ length: BINS }, (_, bin) => level(bin));
const at = (level: (bin: number) => number) => intensity([frame(level)])[0] ?? 0;
// Level 1 in bins from–to only.
const band =
	({ from, to }: { from: number; to: number }) =>
	(bin: number) =>
		Number(bin >= from && bin < to);

describe("intensity", () => {
	it("is 0 in silence", () => {
		expect(at(() => 0)).toBe(0);
	});

	it("sums the square root of each band's level", () => {
		expect(at(() => 0.25)).toBeCloseTo(12 * 0.5, 5);
	});

	it("counts highs as much as lows", () => {
		expect(at(band({ from: 1, to: 43 }))).toBeCloseTo(at(band({ from: 463, to: 505 })), 5);
	});
});
