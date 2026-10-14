import { describe, expect, it } from "vitest";

import type { Hit } from "../judge";
import { reach } from "../reach";

const hit = (time: number, lane: Hit["lane"]): Hit => ({ time, lane });

describe("reach", () => {
	it("drops a pickup too quick to reach from the last one kept", () => {
		const pickups = [hit(5, 0), hit(5.1, 2), hit(5.2, 1), hit(6, 2)];
		expect(reach({ pickups, blocks: [] })).toEqual([hit(5, 0), hit(5.2, 1), hit(6, 2)]);
	});

	it("keeps quick pickups in the same lane", () => {
		const pickups = [hit(5, 1), hit(5.05, 1), hit(5.1, 1)];
		expect(reach({ pickups, blocks: [] })).toEqual(pickups);
	});

	it("drops a pickup right by a block in its lane", () => {
		const pickups = [hit(5, 1), hit(6, 1)];
		expect(reach({ pickups, blocks: [hit(5.1, 1)] })).toEqual([hit(6, 1)]);
	});

	it("keeps a pickup by a block in another lane", () => {
		const pickups = [hit(5, 0)];
		expect(reach({ pickups, blocks: [hit(5.1, 2)] })).toEqual(pickups);
	});
});
