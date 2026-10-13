import { describe, expect, it } from "vitest";

import { peaks } from "../peaks";

const LENGTH = 50;

const signal = ({ base, spikes }: { base: number; spikes: Record<number, number> }) =>
	Float32Array.from({ length: LENGTH }, (_, i) => spikes[i] ?? base);

describe("peaks", () => {
	it("finds spikes over a steady level", () => {
		expect(peaks(signal({ base: 2, spikes: { 10: 9, 30: 8 } }))).toEqual([10, 30]);
	});

	it("ignores tiny bumps far below the song's hits", () => {
		expect(peaks(signal({ base: 0, spikes: { 10: 0.05, 30: 50 } }))).toEqual([30]);
	});

	it("ignores a spike that barely tops a busy passage", () => {
		expect(peaks(signal({ base: 10, spikes: { 10: 12 } }))).toEqual([]);
	});

	it("takes the first frame of a flat top", () => {
		expect(peaks(signal({ base: 0, spikes: { 10: 5, 11: 5 } }))).toEqual([10]);
	});

	it("skips the slope up to a peak", () => {
		expect(peaks(signal({ base: 0, spikes: { 9: 3, 10: 6, 11: 3 } }))).toEqual([10]);
	});
});
