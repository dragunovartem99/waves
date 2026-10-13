type At = { values: Float32Array; f: number };

// How much a band jumped at frame f. Two frames each side, since onset peaks can land a frame
// early or late; reads past the song's edges fall back to x[f].
export function rise({ values, f }: At) {
	const at = (i: number) => values[i] ?? values[f] ?? 0;
	return Math.max(at(f), at(f + 1)) - Math.min(at(f - 1), at(f - 2));
}
