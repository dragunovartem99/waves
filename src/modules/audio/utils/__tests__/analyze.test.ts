import { describe, expect, it } from "vitest";

import { analyze } from "../analyze";
import { HOP } from "../frames";
import { POINTS } from "../ridge";

const RATE = 44_100;
const BURSTS = [1, 1.5, 2, 3];

// Quiet hum with short loud noise bursts: a click track the analysis should find.
const song = Float32Array.from({ length: RATE * 4 }, (_, i) => {
	const burst = BURSTS.some((at) => i >= at * RATE && i < at * RATE + 2000);
	return burst ? Math.sin(i * i * 0.37) : 0.01 * Math.sin(i * 0.05);
});

describe("analyze", () => {
	const { envelope, onsets, strengths, lanes, ridges } = analyze(song);

	it("gives one envelope value per hop", () => {
		expect(envelope).toHaveLength(Math.floor(song.length / HOP));
	});

	it("finds an onset at each burst", () => {
		expect(onsets.map((frame) => ((frame * HOP) / RATE).toFixed(1))).toEqual(
			BURSTS.map((at) => at.toFixed(1))
		);
	});

	it("gives a lane and a strength per onset", () => {
		expect([lanes.length, strengths.length]).toEqual([onsets.length, onsets.length]);
	});

	it("gives a ridge per hop", () => {
		expect(ridges).toHaveLength(envelope.length * POINTS);
	});
});
