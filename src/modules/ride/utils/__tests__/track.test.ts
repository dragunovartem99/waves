import { describe, expect, it } from "vitest";

import { distance, frameAt, PACE, track } from "../track";

const LENGTH = 400;
const steady = new Float32Array(LENGTH).fill(0.5);
// Calm verse, busy chorus.
const swell = Float32Array.from({ length: LENGTH }, (_, i) => (i < LENGTH / 2 ? 0.2 : 0.9));
const still = new Float32Array(LENGTH);
const line = track({ motion: swell, kicks: still });
const at = (frame: number) => distance({ track: line, frame });
const step = (frame: number) => at(frame + 1) - at(frame);

describe("track", () => {
	it("moves PACE per frame on average", () => {
		expect(line.at(-1)).toBeCloseTo(PACE * LENGTH, 1);
	});

	it("moves evenly through steady motion", () => {
		const even = track({ motion: steady, kicks: still });
		expect(distance({ track: even, frame: 100 })).toBeCloseTo(PACE * 100, 2);
	});

	it("rides in proportion to motion", () => {
		expect(step(300) / step(100)).toBeCloseTo(0.9 / 0.2, 3);
	});

	it("shoves the same on every kick, so it stands out most in a calm part", () => {
		const kicked = track({ motion: swell, kicks: still.with(100, 1).with(300, 1) });
		const push = (frame: number) =>
			distance({ track: kicked, frame: frame + 1 }) -
			distance({ track: kicked, frame }) -
			step(frame);
		expect(push(100)).toBeCloseTo(0.25 * PACE, 4);
		expect(push(300)).toBeCloseTo(push(100), 4);
		expect(push(100) / step(100)).toBeGreaterThan(2 * (push(300) / step(300)));
	});

	it("still crawls where nothing moves, so hits there stay apart", () => {
		const paused = track({ motion: steady.with(100, 0), kicks: still });
		const crawl =
			distance({ track: paused, frame: 101 }) - distance({ track: paused, frame: 100 });
		expect(crawl).toBeCloseTo(0.33 * PACE, 4);
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
