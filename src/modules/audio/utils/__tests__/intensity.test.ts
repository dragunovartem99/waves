import { describe, expect, it } from "vitest";

import { intensity } from "../intensity";

const BINS = 512;
const LENGTH = 400;

// A verse with quiet mids and highs, then an equally loud chorus where they fill in.
const frame = (full: boolean) =>
	Float32Array.from({ length: BINS }, (_, bin) => (bin < 6 ? 1 : full ? 0.5 : 0.1));
const spectra = Array.from({ length: LENGTH }, (_, f) => frame(f >= LENGTH / 2));
const loudness = new Float32Array(LENGTH).fill(0.8);

describe("intensity", () => {
	const curve = intensity({ spectra, loudness });
	const at = (f: number) => curve.at(f) ?? 0;

	it("rises for a fuller chorus even when loudness stays flat", () => {
		expect(at(300)).toBeGreaterThan(at(100) + 0.25);
	});

	it("is already rising as the chorus starts, not a second later", () => {
		expect(at(LENGTH / 2)).toBeGreaterThan(at(100));
	});

	it("stays within 0–1", () => {
		expect(Math.max(...curve)).toBeLessThanOrEqual(1);
		expect(Math.min(...curve)).toBeGreaterThanOrEqual(0);
	});
});
