import { HOP, RATE } from "./frames";
import { POINTS } from "./ridge";
import { settle } from "./smooth";

// Seconds that count as one movement: a run of notes, not a single hit.
const SPAN = 0.3;
const FACTOR = HOP / RATE / SPAN;

const line = ({ ridges, f }: { ridges: Float32Array; f: number }) =>
	ridges.subarray(f * POINTS, (f + 1) * POINTS);

// How much frame f's ridge rose over the previous one, times its height squared, so loud
// movement counts more than quiet. Ridge points are log-spaced: every octave counts alike.
function climb({ ridges, f }: { ridges: Float32Array; f: number }) {
	if (f === 0) return 0;
	const [before, now] = [line({ ridges, f: f - 1 }), line({ ridges, f })];
	const rise = now.reduce((sum, value, k) => sum + Math.max(0, value - (before[k] ?? 0)), 0);
	const height = now.reduce((sum, value) => sum + value, 0) / POINTS;
	return rise * height ** 2;
}

// How much the landscape moves per frame: melodies, stabs and hits move it, held notes don't.
export function motion(ridges: Float32Array) {
	const rises = Float32Array.from({ length: ridges.length / POINTS }, (_, f) =>
		climb({ ridges, f })
	);
	return settle({ values: rises, factor: FACTOR });
}
