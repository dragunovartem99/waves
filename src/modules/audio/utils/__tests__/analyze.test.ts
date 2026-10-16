import { describe, expect, it } from "vitest";

import { analyze } from "../analyze";
import { HOP } from "../frames";
import { POINTS } from "../ridge";

const RATE = 44_100;
const BURSTS = [1, 1.5, 2, 3];

// Quiet hum with short loud noise bursts.
const song = Float32Array.from({ length: RATE * 4 }, (_, i) => {
	const burst = BURSTS.some((at) => i >= at * RATE && i < at * RATE + 2000);
	return burst ? Math.sin(i * i * 0.37) : 0.01 * Math.sin(i * 0.05);
});

describe("analyze", () => {
	const { ridges, kicks, intensity } = analyze(song);
	const hops = Math.floor(song.length / HOP);
	const loudest = (from: number) => Math.max(...intensity.subarray(from, from + 4));

	it("gives an intensity and a kick per hop", () => {
		expect([intensity.length, kicks.length]).toEqual([hops, hops]);
	});

	it("gives a ridge per hop", () => {
		expect(ridges).toHaveLength(hops * POINTS);
	});

	it("is loudest at a burst", () => {
		expect(loudest(Math.round(RATE / HOP))).toBeGreaterThan(5 * loudest(10));
	});
});
