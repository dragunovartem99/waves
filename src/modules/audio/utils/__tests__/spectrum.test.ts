import { describe, expect, it } from "vitest";

import { spectrum } from "../spectrum";

const SIZE = 64;
const analyze = spectrum(SIZE);

const wave = (bin: number) =>
	Float32Array.from({ length: SIZE }, (_, i) => Math.sin((2 * Math.PI * bin * i) / SIZE));

// Plain O(n²) DFT of the same Hann-windowed frame, as the reference.
function dft(frame: Float32Array) {
	const windowed = frame.map((x, i) => x * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / SIZE)));
	return Array.from({ length: SIZE / 2 }, (_, k) => {
		const angles = [...windowed].map((_x, i) => (-2 * Math.PI * k * i) / SIZE);
		const re = angles.reduce((sum, angle, i) => sum + (windowed[i] ?? 0) * Math.cos(angle), 0);
		const im = angles.reduce((sum, angle, i) => sum + (windowed[i] ?? 0) * Math.sin(angle), 0);
		return Math.hypot(re, im);
	});
}

const round = (values: Iterable<number>) => [...values].map((value) => value.toFixed(4));

const peak = (magnitudes: Float32Array) => magnitudes.indexOf(Math.max(...magnitudes));

describe("spectrum", () => {
	it("gives half as many bins as samples", () => {
		expect(analyze(new Float32Array(SIZE))).toHaveLength(SIZE / 2);
	});

	it("peaks at the frequency of a pure tone", () => {
		expect(peak(analyze(wave(5)))).toBe(5);
		expect(peak(analyze(wave(20)))).toBe(20);
	});

	it("matches a plain DFT on noise", () => {
		const noise = Float32Array.from({ length: SIZE }, (_, i) => Math.sin(i * i * 0.37));
		expect(round(analyze(noise))).toEqual(round(dft(noise)));
	});

	it("is silent for silence", () => {
		expect(analyze(new Float32Array(SIZE)).every((magnitude) => magnitude === 0)).toBe(true);
	});
});
