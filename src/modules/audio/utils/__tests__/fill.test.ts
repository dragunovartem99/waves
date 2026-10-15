import { describe, expect, it } from "vitest";

import { fill } from "../fill";

const beats = [10, 30, 50, 70];
const full = new Float32Array(100).fill(1);
const quiet = new Float32Array(100);
// The music stops after frame 40.
const stopping = Float32Array.from({ length: 100 }, (_, f) => (f < 40 ? 1 : 0));

describe("fill", () => {
	it("adds a mark on beats without an onset", () => {
		expect(fill({ onsets: [10, 51], beats, bpm: 120, intensity: full, motion: full })).toEqual([
			10, 30, 51, 70,
		]);
	});

	it("keeps onsets between beats", () => {
		expect(fill({ onsets: [20], beats, bpm: 120, intensity: full, motion: full })).toEqual([
			10, 20, 30, 50, 70,
		]);
	});

	it("adds off-beats to full sections of slow songs", () => {
		expect(fill({ onsets: beats, beats, bpm: 90, intensity: full, motion: full })).toEqual([
			10, 20, 30, 40, 50, 60, 70,
		]);
	});

	it("leaves quiet sections of slow songs on the beat", () => {
		expect(fill({ onsets: beats, beats, bpm: 90, intensity: quiet, motion: full })).toEqual(
			beats
		);
	});

	it("is empty without onsets or beats", () => {
		expect(fill({ onsets: [], beats: [], bpm: 120, intensity: full, motion: full })).toEqual(
			[]
		);
	});

	it("adds no marks where nothing sounds", () => {
		expect(fill({ onsets: [], beats, bpm: 120, intensity: full, motion: stopping })).toEqual([
			10, 30,
		]);
	});
});
