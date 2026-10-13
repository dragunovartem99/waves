// Index of the first sorted value that `before` doesn't accept.
function search({ sorted, before }: { sorted: Float32Array; before: (value: number) => boolean }) {
	let [low, high] = [0, sorted.length];
	while (low < high) {
		const middle = (low + high) >> 1;
		if (before(sorted[middle] ?? 0)) low = middle + 1;
		else high = middle;
	}
	return low;
}

// Each value's place in the song, 0–1: a song's own scale, whatever its mastering. Ties share
// the middle of their run, so a feature that never changes sits at a neutral 0.5.
export function rank(values: Float32Array) {
	const sorted = values.toSorted();
	return values.map((value) => {
		const below = search({ sorted, before: (other) => other < value });
		const upTo = search({ sorted, before: (other) => other <= value });
		return (below + upTo) / 2 / (sorted.length || 1);
	});
}
