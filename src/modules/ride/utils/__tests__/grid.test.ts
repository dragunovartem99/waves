import { describe, expect, it } from "vitest";

import { grid } from "../grid";
import { track } from "../track";

const LENGTH = 400;
const beats = Array.from({ length: 10 }, (_, i) => 20 + i * 36);
const ride = (level: number) => track(new Float32Array(LENGTH).fill(level));

describe("grid", () => {
	it("puts a ridge on every beat", () => {
		const beatFrames = grid({ beats, track: ride(0.5) })
			.filter(({ beat }) => beat)
			.map(({ frame }) => frame);
		expect(beatFrames).toEqual(beats);
	});

	it("fills each beat with quarter steps when there's room", () => {
		expect(grid({ beats, track: ride(0.5) })).toHaveLength(
			beats.length + 3 * (beats.length - 1)
		);
	});

	it("keeps ridges in order along the track", () => {
		const distances = grid({ beats, track: ride(0.5) }).map(({ distance }) => distance);
		expect(distances).toEqual(distances.toSorted((a, b) => a - b));
	});

	it("thins out quarter steps where they'd crowd", () => {
		const tight = Array.from({ length: 10 }, (_, i) => 20 + i * 12);
		expect(grid({ beats: tight, track: ride(0.5) }).length).toBeLessThan(
			tight.length + 3 * (tight.length - 1)
		);
	});

	it("is empty without beats", () => {
		expect(grid({ beats: [], track: ride(0.5) })).toEqual([]);
	});
});
