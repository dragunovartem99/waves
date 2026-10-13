import { describe, expect, it } from "vitest";

import { analyze } from "../analyze";
import { HOP } from "../frames";

const RATE = 44_100;
const BURSTS = [1, 1.5, 2, 3];

// Quiet hum with short loud noise bursts: a click track the analysis should find.
const song = Float32Array.from({ length: RATE * 4 }, (_, i) => {
	const burst = BURSTS.some((at) => i >= at * RATE && i < at * RATE + 2000);
	return burst ? Math.sin(i * i * 0.37) : 0.01 * Math.sin(i * 0.05);
});

describe("analyze", () => {
	const { envelope, onsets } = analyze(song);

	it("gives one envelope value per hop", () => {
		expect(envelope).toHaveLength(Math.floor(song.length / HOP));
	});

	it("finds an onset at each burst", () => {
		expect(onsets.map((frame) => ((frame * HOP) / RATE).toFixed(1))).toEqual(
			BURSTS.map((at) => at.toFixed(1))
		);
	});
});
