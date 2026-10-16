// Rings counted each way from a ring.
const REACH = 42;

type Run = { tilts: number[]; i: number; step: 1 | -1; keep: (other: number) => boolean };

function run({ tilts, i, step, keep }: Run) {
	let count = 0;
	while (count < REACH && keep(tilts[i + step * (count + 1)] ?? Number.NaN)) count++;
	return count;
}

// How deep each ring sits inside a falling stretch of tilt, i.e. a swell in the music: rings
// of fall before it times rings of fall after, each up to REACH. 0 where tilt isn't falling.
export const maxima = (tilts: number[]) =>
	tilts.map((tilt, i) => {
		const before = run({ tilts, i, step: -1, keep: (other) => other > tilt });
		const after = run({ tilts, i, step: 1, keep: (other) => other < tilt });
		return before * after;
	});
