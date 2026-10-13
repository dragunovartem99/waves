import { describe, expect, it } from "vitest";

import { distance, frameAt, track } from "../track";

const LENGTH = 400;
const steady = new Float32Array(LENGTH).fill(0.5);
// Quiet first half, loud second half.
const swell = Float32Array.from({ length: LENGTH }, (_, i) => (i < LENGTH / 2 ? 0.05 : 1));
const line = track(swell);
const at = (frame: number) => distance({ track: line, frame });

describe("track", () => {
	it("moves 1 per frame on average", () => {
		expect(line.at(-1)).toBeCloseTo(LENGTH, 2);
	});

	it("moves evenly through a steady song", () => {
		expect(distance({ track: track(steady), frame: 100 })).toBeCloseTo(100, 3);
	});

	it("rushes through loud parts and crawls through quiet ones", () => {
		expect(at(350) - at(300)).toBeGreaterThan(3 * (at(150) - at(100)));
	});
});

describe("distance", () => {
	it("interpolates between frames", () => {
		expect(at(10.5)).toBeCloseTo((at(10) + at(11)) / 2, 5);
	});

	it("runs on past the end at the last frame's speed", () => {
		expect(at(LENGTH + 5) - at(LENGTH)).toBeCloseTo(5 * (at(LENGTH) - at(LENGTH - 1)), 3);
	});
});

describe("frameAt", () => {
	it("inverts distance", () => {
		expect(frameAt({ track: line, distance: at(273.25) })).toBeCloseTo(273.25, 3);
	});

	it("starts at frame 0", () => {
		expect(frameAt({ track: line, distance: 0 })).toBe(0);
	});
});
