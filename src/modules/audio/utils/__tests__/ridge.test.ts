import { describe, expect, it } from "vitest";

import { POINTS, ridge } from "../ridge";

const BINS = 512;
// Centre of [1 2 1] / 4 applied three times: 20 / 64.
const PEAK_SHARE = 20 / 64;

const spectrum = (spikes: Record<number, number>, base = 0) =>
	Float32Array.from({ length: BINS }, (_, i) => spikes[i] ?? base);

const argmax = (values: Float32Array) => values.indexOf(Math.max(...values));

describe("ridge", () => {
	it("has a fixed number of points", () => {
		expect(ridge(spectrum({}))).toHaveLength(POINTS);
	});

	it("is flat at 0 for silence", () => {
		expect(Math.max(...ridge(spectrum({})))).toBe(0);
	});

	it("keeps a flat spectrum flat, log-compressed", () => {
		const line = ridge(spectrum({}, 1));
		expect(Math.min(...line)).toBeCloseTo(Math.log1p(10), 5);
		expect(Math.max(...line)).toBeCloseTo(Math.log1p(10), 5);
	});

	it("puts a 1 kHz tone where log spacing says", () => {
		// bin 23 ≈ 991 Hz; log position of 991 Hz between 40 Hz and 12 kHz is point ≈ 53.4
		expect(argmax(ridge(spectrum({ 23: 1 })))).toBe(53);
	});

	it("doesn't let a narrow treble line slip between points", () => {
		const line = ridge(spectrum({ 250: 1 }));
		expect(Math.max(...line)).toBeCloseTo(PEAK_SHARE * Math.log1p(10), 5);
	});

	it("puts low tones left of high ones", () => {
		expect(argmax(ridge(spectrum({ 3: 1 })))).toBeLessThan(argmax(ridge(spectrum({ 200: 1 }))));
	});
});
