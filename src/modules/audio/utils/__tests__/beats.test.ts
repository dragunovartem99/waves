import { describe, expect, it } from "vitest";

import { beats } from "../beats";
import { HOP, RATE } from "../frames";

const PER_SECOND = RATE / HOP;
const LENGTH = Math.round(20 * PER_SECOND);
const BPM = 120;
const PERIOD = (60 * PER_SECOND) / BPM;

// Spikes at the given frames over a little noise.
function onsets(hits: number[]) {
	const values = Float32Array.from(
		{ length: LENGTH },
		(_, i) => 0.1 * Math.abs(Math.sin(i * 12.9898))
	);
	hits.forEach((hit) => (values[hit] = 1));
	return values;
}

const grid = Array.from({ length: Math.floor(LENGTH / PERIOD) }, (_, i) =>
	Math.round(5 + i * PERIOD)
);
const gaps = (frames: number[]) => frames.slice(1).map((frame, i) => frame - (frames[i] ?? 0));

describe("beats", () => {
	it("lands on every hit of a steady beat", () => {
		expect(beats({ flux: onsets(grid), bpm: BPM })).toEqual(expect.arrayContaining(grid));
	});

	it("keeps time past the last hit", () => {
		expect(beats({ flux: onsets(grid), bpm: BPM }).length).toBeGreaterThan(grid.length);
	});

	it("keeps time through a missing hit", () => {
		const missing = grid.filter((_, i) => i !== 10);
		expect(beats({ flux: onsets(missing), bpm: BPM })).toContain(grid[10]);
	});

	it("ignores a stray hit between beats", () => {
		const stray = Math.round(5 + 10.5 * PERIOD);
		expect(beats({ flux: onsets([...grid, stray]), bpm: BPM })).not.toContain(stray);
	});

	it("keeps gaps near one period", () => {
		const spacing = gaps(beats({ flux: onsets(grid), bpm: BPM }));
		expect(Math.max(...spacing)).toBeLessThanOrEqual(Math.ceil(PERIOD));
		expect(Math.min(...spacing)).toBeGreaterThanOrEqual(Math.floor(PERIOD));
	});

	it("is empty for an empty song", () => {
		expect(beats({ flux: new Float32Array(0), bpm: BPM })).toEqual([]);
	});
});
