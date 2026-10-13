import { describe, expect, it } from "vitest";

import { HOP, RATE } from "@/modules/audio";

import { hits } from "../hits";

const SONG = {
	onsets: [10, 20, 30, 40],
	lanes: [0, 1, 2, 1] as const,
	strengths: [5, 50, 6, 7],
};

describe("hits", () => {
	const { pickups, blocks } = hits({ ...SONG, lanes: [...SONG.lanes] });

	it("turns the hardest quarter of onsets into blocks", () => {
		expect(blocks).toEqual([{ time: (20 * HOP) / RATE, lane: 1 }]);
	});

	it("keeps the rest as pickups, in order", () => {
		expect(pickups.map(({ lane }) => lane)).toEqual([0, 2, 1]);
	});

	it("is empty without onsets", () => {
		expect(hits({ onsets: [], lanes: [], strengths: [] })).toEqual({ pickups: [], blocks: [] });
	});
});
