import { describe, expect, it } from "vitest";

import { HOP, RATE } from "@/modules/audio";

import { hits } from "../hits";

const PER_SECOND = RATE / HOP;
// Speed per frame swelling and fading every `period` seconds after `calm` seconds of quiet.
const song = ({ seconds = 60, period = 2, calm = 0 } = {}) =>
	Float32Array.from({ length: Math.round(seconds * PER_SECOND) }, (_, f) => {
		const t = f / PER_SECOND;
		return t < calm ? 0.1 : 0.55 + 0.45 * Math.sin((2 * Math.PI * t) / period);
	});

describe("hits", () => {
	const { pickups, blocks } = hits(song());
	const all = [...pickups, ...blocks];

	it("puts something on every swell", () => {
		expect(all.length).toBeGreaterThanOrEqual(25);
	});

	it("makes both pickups and blocks", () => {
		expect([pickups.length > 0, blocks.length > 0]).toEqual([true, true]);
	});

	it("uses every lane", () => {
		expect(new Set(all.map(({ lane }) => lane)).size).toBe(3);
	});

	it("lays the same track for the same song", () => {
		expect(hits(song())).toEqual({ pickups, blocks });
	});

	it("waits for the music to swell", () => {
		const late = hits(song({ calm: 20 }));
		expect([...late.pickups, ...late.blocks].every(({ time }) => time >= 20)).toBe(true);
	});

	it("is empty where nothing swells", () => {
		expect(hits(new Float32Array(30 * PER_SECOND).fill(0.5))).toEqual({
			pickups: [],
			blocks: [],
		});
	});
});
