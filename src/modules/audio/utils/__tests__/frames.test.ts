import { describe, expect, it } from "vitest";

import { frames, HOP } from "../frames";

describe("frames", () => {
	it("splits into full hops, dropping the remainder", () => {
		expect(frames(new Float32Array(HOP * 3 + 10)).map((frame) => frame.length)).toEqual([
			HOP,
			HOP,
			HOP,
		]);
	});

	it("is empty for audio shorter than a hop", () => {
		expect(frames(new Float32Array(HOP - 1))).toEqual([]);
	});
});
