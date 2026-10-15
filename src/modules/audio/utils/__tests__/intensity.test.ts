import { describe, expect, it } from "vitest";

import { intensity } from "../intensity";

const BINS = 512;
const LENGTH = 400;

const frame = ({ bass, rest }: { bass: number; rest: number }) =>
	Float32Array.from({ length: BINS }, (_, bin) => (bin < 6 ? bass : rest));
// A verse with quiet mids and highs, then a chorus where they fill in over the same bass.
const spectra = Array.from({ length: LENGTH }, (_, f) =>
	frame({ bass: 1, rest: f >= LENGTH / 2 ? 0.5 : 0.1 })
);

// Quiet, then the bass swells alone, then mids and highs fill in over a quiet bass.
const sections = intensity(
	[
		{ bass: 0.2, rest: 0.1 },
		{ bass: 1, rest: 0.1 },
		{ bass: 0.2, rest: 0.5 },
	].flatMap((level) => Array.from({ length: LENGTH / 4 }, () => frame(level)))
);
const swell = (f: number) => sections.at(f) ?? 0;

describe("intensity", () => {
	const curve = intensity(spectra);
	const at = (f: number) => curve.at(f) ?? 0;

	it("rises for a fuller chorus even when the bass stays flat", () => {
		expect(at(300)).toBeGreaterThan(at(100) + 0.25);
	});

	it("is already rising as the chorus starts, not a second later", () => {
		expect(at(LENGTH / 2)).toBeGreaterThan(at(100));
	});

	it("ranks a bass swell alone below a section where the other bands fill in", () => {
		expect(swell(280)).toBeGreaterThan(swell(130) + 0.15);
	});

	it("stays within 0–1", () => {
		expect(Math.max(...curve)).toBeLessThanOrEqual(1);
		expect(Math.min(...curve)).toBeGreaterThanOrEqual(0);
	});
});
