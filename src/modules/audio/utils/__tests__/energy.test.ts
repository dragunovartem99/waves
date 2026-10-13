import { describe, expect, it } from "vitest";

import { energy } from "../energy";

const frame = (...magnitudes: number[]) => Float32Array.from(magnitudes);

describe("energy", () => {
	it("is the mean squared magnitude over the band", () => {
		const spectra = [frame(9, 1, 3, 9), frame(9, 2, 2, 9)];
		expect([...energy({ spectra, from: 1, to: 3 })]).toEqual([5, 4]);
	});

	it("ignores bins outside the band", () => {
		const spectra = [frame(100, 1, 100)];
		expect([...energy({ spectra, from: 1, to: 2 })]).toEqual([1]);
	});

	it("is empty without frames", () => {
		expect(energy({ spectra: [], from: 0, to: 2 })).toHaveLength(0);
	});
});
