import { describe, expect, it } from "vitest";

import { kicks } from "../kicks";

const BINS = 512;
const LENGTH = 200;

// Bass bins 1–5 at `level`, everything else silent.
const frame = (level: number) =>
	Float32Array.from({ length: BINS }, (_, bin) => (bin >= 1 && bin < 6 ? level : 0));

// A gentle bass groove (1 ↔ 1.1 every frame) sets what a typical rise is; kicks stand above it.
const song = (beats: Record<number, number>) =>
	Array.from({ length: LENGTH }, (_, f) => frame(beats[f] ?? 1 + 0.1 * (f % 2)));

describe("kicks", () => {
	const punch = kicks(song({ 50: 3, 150: 1.3 }));

	it("ignores the groove", () => {
		expect(punch[30]).toBe(0);
	});

	it("jumps to full on a hard kick", () => {
		expect(punch[50]).toBe(1);
	});

	it("rings out after it", () => {
		expect(punch[55]).toBeGreaterThan(0.3);
		expect(punch[55]).toBeLessThan(1);
	});

	it("is a smaller punch on a softer kick", () => {
		expect(punch[150]).toBeLessThan(0.5);
	});
});
