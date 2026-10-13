import { describe, expect, it } from "vitest";

import { fill } from "../fill";

const beats = [10, 30, 50, 70];
const full = new Float32Array(100).fill(1);
const quiet = new Float32Array(100);

describe("fill", () => {
	it("adds a mark on beats without an onset", () => {
		expect(fill({ onsets: [10, 51], beats, bpm: 120, intensity: full })).toEqual([
			10, 30, 51, 70,
		]);
	});

	it("keeps onsets between beats", () => {
		expect(fill({ onsets: [20], beats, bpm: 120, intensity: full })).toEqual([
			10, 20, 30, 50, 70,
		]);
	});

	it("adds off-beats to full sections of slow songs", () => {
		expect(fill({ onsets: beats, beats, bpm: 90, intensity: full })).toEqual([
			10, 20, 30, 40, 50, 60, 70,
		]);
	});

	it("leaves quiet sections of slow songs on the beat", () => {
		expect(fill({ onsets: beats, beats, bpm: 90, intensity: quiet })).toEqual(beats);
	});

	it("is empty without onsets or beats", () => {
		expect(fill({ onsets: [], beats: [], bpm: 120, intensity: full })).toEqual([]);
	});
});
