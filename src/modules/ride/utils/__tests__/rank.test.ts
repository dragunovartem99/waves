import { describe, expect, it } from "vitest";

import { rank, RANKS } from "../rank";

const name = (accuracy: number) => RANKS[rank(accuracy)]?.name;

describe("rank", () => {
	it("starts at the bottom", () => {
		expect(name(0)).toBe("E");
	});

	it("reaches a rank exactly at its threshold", () => {
		expect(name(0.8)).toBe("B");
		expect(name(0.7999)).toBe("C");
	});

	it("saves the top for a perfect ride", () => {
		expect(name(0.99)).toBe("S");
		expect(name(1)).toBe("SS");
	});
});
