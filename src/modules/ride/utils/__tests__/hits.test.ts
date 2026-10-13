import { describe, expect, it } from "vitest";

import { HOP, RATE } from "@/modules/audio";

import { hits } from "../hits";

const PER_SECOND = RATE / HOP;
// 20 onsets a second apart, strengths cycling 1–5, so every fifth one is the hardest around.
const onsets = Array.from({ length: 20 }, (_, i) => Math.round((i + 1) * PER_SECOND));
const lanes = onsets.map(() => 1 as const);
const strengths = onsets.map((_, i) => (i % 5) + 1);
const song = (level: number) => ({
	onsets,
	lanes,
	strengths,
	intensity: new Float32Array(25 * PER_SECOND).fill(level),
});
const seconds = (frame: number) => (frame * HOP) / RATE;

describe("hits", () => {
	it("splits every onset into a pickup or a block", () => {
		const { pickups, blocks } = hits(song(0.5));
		expect(pickups.length + blocks.length).toBe(onsets.length);
	});

	it("puts more blocks in full music than in sparse", () => {
		expect(hits(song(1)).blocks.length).toBeGreaterThan(hits(song(0)).blocks.length);
	});

	it("makes blocks of the locally hardest hits", () => {
		const strongest = onsets
			.filter((_, i) => strengths[i] === 5)
			.map((frame) => seconds(frame));
		expect(hits(song(0.5)).blocks.map(({ time }) => time)).toEqual(
			expect.arrayContaining(strongest)
		);
	});

	it("never makes blocks of weak hits", () => {
		const weak = onsets.filter((_, i) => i % 5 < 2).map((frame) => seconds(frame));
		const blocked = new Set(hits(song(1)).blocks.map(({ time }) => time));
		expect(weak.filter((time) => blocked.has(time))).toEqual([]);
	});

	it("keeps each onset's time and lane", () => {
		const first = { time: seconds(Math.round(PER_SECOND)), lane: 1 };
		expect(hits(song(0.5)).pickups[0]).toEqual(first);
	});

	it("is empty without onsets", () => {
		const silence = { onsets: [], lanes: [], strengths: [], intensity: new Float32Array(0) };
		expect(hits(silence)).toEqual({ pickups: [], blocks: [] });
	});
});

describe("hits grace", () => {
	it("has no blocks in the first 3 seconds", () => {
		const { blocks } = hits(song(1));
		expect(blocks.every(({ time }) => time >= 3)).toBe(true);
	});
});

describe("hits fairness", () => {
	// Three equally hard hits in three lanes, 0.1 s apart: the third would wall off every lane.
	const close = [0, 1, 2].map((i) => Math.round((5 + 0.1 * i) * PER_SECOND));
	const wall = {
		onsets: close,
		lanes: [0, 1, 2] as const,
		strengths: [5, 5, 5],
		intensity: new Float32Array(10 * PER_SECOND).fill(1),
	};

	it("never blocks all three lanes at once", () => {
		const { blocks } = hits({ ...wall, lanes: [...wall.lanes] });
		expect(new Set(blocks.map(({ lane }) => lane)).size).toBeLessThan(3);
	});
});
