import { describe, expect, it } from "vitest";

import { HOP, RATE } from "../frames";
import { tempo } from "../tempo";

const PER_SECOND = RATE / HOP;
const SECONDS = 30;

// Onset strength with a spike on every beat (and optional softer off-beats), plus a little noise.
function pulses({ bpm, offbeats = 0 }: { bpm: number; offbeats?: number }) {
	const beat = (60 * PER_SECOND) / bpm;
	const values = Float32Array.from(
		{ length: SECONDS * PER_SECOND },
		(_, i) => 0.1 * Math.abs(Math.sin(i * 12.9898))
	);
	for (let t = 0; t < values.length; t += beat) {
		values[Math.round(t)] = 1;
		values[Math.round(t + beat / 2)] = offbeats;
	}
	return values;
}

describe("tempo", () => {
	it("finds a steady beat", () => {
		expect(tempo(pulses({ bpm: 128 }))).toBeCloseTo(128, -0.5);
	});

	it("finds a fast one", () => {
		expect(tempo(pulses({ bpm: 152 }))).toBeCloseTo(152, -0.5);
	});

	it("isn't fooled into double time by off-beats", () => {
		expect(tempo(pulses({ bpm: 100, offbeats: 0.4 }))).toBeCloseTo(100, -0.5);
	});
});
