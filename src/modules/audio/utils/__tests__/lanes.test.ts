import { describe, expect, it } from "vitest";

import { lanes } from "../lanes";

type Level = { low: number; mid: number; high: number };
type Hits = Record<number, Partial<Level>>;

const LENGTH = 40;
const BINS = 512;
const QUIET = { low: 1, mid: 1, high: 1 };

const level = ({ levels: { low, mid, high }, bin }: { levels: Level; bin: number }) =>
	bin < 6 ? low : bin < 93 ? mid : high;

const frame = (levels: Level) =>
	Float32Array.from({ length: BINS }, (_, bin) => level({ levels, bin }));

const song = (hits: Hits) =>
	Array.from({ length: LENGTH }, (_, f) => frame({ ...QUIET, ...hits[f] }));

describe("lanes", () => {
	it("puts each hit in the band that jumped", () => {
		const spectra = song({ 10: { low: 3 }, 20: { mid: 3 }, 30: { high: 3 } });
		expect(lanes({ spectra, onsets: [10, 20, 30] })).toEqual([0, 1, 2]);
	});

	it("judges a rise against the band's typical jump, not raw energy", () => {
		const loudHighs = { 5: { high: 10 }, 15: { high: 10 }, 35: { high: 10 } };
		const spectra = song({ ...loudHighs, 10: { low: 2 }, 25: { low: 2, high: 4 } });
		expect(lanes({ spectra, onsets: [25] })).toEqual([0]);
	});

	it("handles onsets at the song's edges", () => {
		const spectra = song({ 1: { mid: 3 }, 39: { high: 3 } });
		expect(lanes({ spectra, onsets: [1, 39] })).toEqual([1, 2]);
	});

	it("is empty without onsets", () => {
		expect(lanes({ spectra: song({}), onsets: [] })).toEqual([]);
	});
});
