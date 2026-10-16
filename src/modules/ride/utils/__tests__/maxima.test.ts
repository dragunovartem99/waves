import { describe, expect, it } from "vitest";

import { maxima } from "../maxima";

describe("maxima", () => {
	it("scores a ring by the fall before it times the fall after", () => {
		expect(maxima([5, 4, 3, 2, 1, 0])[2]).toBe(2 * 3);
	});

	it("is 0 where the tilt isn't falling through", () => {
		expect(maxima([0, 1, 2, 3, 2])).toEqual([0, 0, 0, 0, 0]);
	});

	it("counts at most 42 rings each way", () => {
		const fall = Array.from({ length: 200 }, (_, i) => -i);
		expect(maxima(fall)[100]).toBe(42 * 42);
	});
});
