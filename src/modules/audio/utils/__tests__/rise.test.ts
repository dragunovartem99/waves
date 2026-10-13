import { describe, expect, it } from "vitest";

import { rise } from "../rise";

const values = (...items: number[]) => Float32Array.from(items);

describe("rise", () => {
	it("is the peak at or after f minus the low before it", () => {
		expect(rise({ values: values(1, 3, 2, 8), f: 2 })).toBe(7);
	});

	it("catches a peak one frame late", () => {
		expect(rise({ values: values(1, 1, 1, 6), f: 2 })).toBe(5);
	});

	it("is negative when the band falls", () => {
		expect(rise({ values: values(5, 5, 2, 1), f: 2 })).toBe(-3);
	});

	it("is 0 for a flat song start", () => {
		expect(rise({ values: values(4, 4), f: 0 })).toBe(0);
	});

	it("reads only x[f] past the song's end", () => {
		expect(rise({ values: values(1, 1, 3), f: 2 })).toBe(2);
	});
});
