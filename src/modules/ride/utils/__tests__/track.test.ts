import { describe, expect, it } from "vitest";

import { distance, frameAt, JOLT, PACE, track } from "../track";

const LENGTH = 400;
// Calm verse, loud chorus.
const swell = Float32Array.from({ length: LENGTH }, (_, i) => (i < LENGTH / 2 ? 0.2 : 1));
const calm = new Float32Array(LENGTH);
const line = track({ speeds: swell, kicks: calm });
const at = (frame: number) => distance({ track: line, frame });
const step = (frame: number) => at(frame + 1) - at(frame);

describe("track", () => {
	it("moves PACE per frame at full speed", () => {
		expect(step(300)).toBeCloseTo(PACE, 5);
	});

	it("rides in proportion to speed", () => {
		expect(step(100) / step(300)).toBeCloseTo(0.2, 5);
	});

	it("surges on a kick", () => {
		const kicks = Float32Array.from({ length: LENGTH }, (_, i) => Number(i === 100));
		const kicked = track({ speeds: swell, kicks });
		const jump =
			distance({ track: kicked, frame: 101 }) - distance({ track: kicked, frame: 100 });
		expect(jump).toBeCloseTo(PACE * (0.2 + JOLT), 5);
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
