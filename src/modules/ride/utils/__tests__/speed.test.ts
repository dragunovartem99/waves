import { describe, expect, it } from "vitest";

import { rides, speeds } from "../speed";

// Mean 1, peak 4: the baseline is twice the mean, 2.
const song = Float32Array.from([0, 0.5, 1, 1, 0.5, 1, 4, 0, 1, 1]);

describe("speeds", () => {
	const out = speeds(song);

	it("rides flat out from twice the mean intensity up", () => {
		expect(out[6]).toBe(1);
	});

	it("scales below that", () => {
		expect(out[2]).toBeCloseTo(0.5, 5);
	});

	it("never stops, even in silence", () => {
		expect(out[0]).toBeCloseTo(0.1, 5);
	});
});

describe("rides", () => {
	// A slow climb from 1 to 2: the loudest fifth starts at 1.8.
	const climb = Float32Array.from({ length: 101 }, (_, i) => 1 + i / 100);
	const out = rides(climb);

	it("rides the loudest fifth flat out", () => {
		expect(out[80]).toBe(1);
		expect(out[100]).toBe(1);
	});

	it("scales below that", () => {
		expect(out[0]).toBeCloseTo(1 / 1.8, 5);
	});

	it("ignores how loud the song is mastered", () => {
		const louder = rides(climb.map((value) => value * 3));
		expect(louder.every((value, i) => Math.abs(value - Number(out[i])) < 1e-6)).toBe(true);
	});
});
