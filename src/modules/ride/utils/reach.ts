import type { Hit } from "./judge";

type Field = { pickups: Hit[]; blocks: Hit[] };

// Seconds a hand needs per lane it moves, and seconds a pickup must keep from a block in its
// lane, so catching it never leaves you in the block's way.
const STEP = 0.15;
const CLOSE = 0.2;

// Drops pickups no hand could catch: right by a block in their lane, or too quick a move from
// the last pickup kept.
export function reach({ pickups, blocks }: Field) {
	const clear = ({ time, lane }: Hit) =>
		!blocks.some((block) => block.lane === lane && Math.abs(block.time - time) < CLOSE);
	return pickups
		.filter((hit) => clear(hit))
		.reduce<Hit[]>((kept, hit) => {
			const last = kept.at(-1);
			const quick = last && hit.time - last.time < Math.abs(hit.lane - last.lane) * STEP;
			return quick ? kept : kept.concat(hit);
		}, []);
}
