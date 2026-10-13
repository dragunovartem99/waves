import { describe, expect, it } from "vitest";

import { distance, frameAt, PACE, track } from "../track";

const LENGTH = 400;
const steady = new Float32Array(LENGTH).fill(0.5);
// Quiet first half, loud second half.
const swell = Float32Array.from({ length: LENGTH }, (_, i) => (i < LENGTH / 2 ? 0.05 : 1));
const still = new Float32Array(LENGTH);
const line = track({ envelope: swell, kicks: still });
const at = (frame: number) => distance({ track: line, frame });

describe("track", () => {
	it("moves PACE per frame on average", () => {
		expect(line.at(-1)).toBeCloseTo(PACE * LENGTH, 1);
	});

	it("moves evenly through a steady song", () => {
		const even = track({ envelope: steady, kicks: still });
		expect(distance({ track: even, frame: 100 })).toBeCloseTo(PACE * 100, 2);
	});

	it("jolts forward on a kick", () => {
		const kicked = track({ envelope: steady, kicks: still.with(100, 1) });
		const step = (frame: number) =>
			distance({ track: kicked, frame: frame + 1 }) - distance({ track: kicked, frame });
		expect(step(100)).toBeGreaterThan(1.8 * step(50));
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
