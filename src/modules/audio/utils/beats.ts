import { HOP, RATE } from "./frames";

type Song = { flux: Float32Array; bpm: number };

// How hard a beat gap that strays from the tempo is punished: high keeps the grid steady,
// low lets it chase every hit.
const TIGHTNESS = 100;

const spread = (values: Float32Array) => {
	const mean = values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
	return (
		Math.sqrt(
			values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length || 1)
		) || 1
	);
};

// Best earlier beat to come from, about one period back, or -1 if starting fresh scores more.
function previous({ scores, t, period }: { scores: Float32Array; t: number; period: number }) {
	let [best, from] = [0, -1];
	for (
		let tau = Math.max(0, t - Math.round(2 * period));
		tau <= t - Math.round(period / 2);
		tau++
	) {
		const score = (scores[tau] ?? 0) - TIGHTNESS * Math.log((t - tau) / period) ** 2;
		if (score > best) [best, from] = [score, tau];
	}
	return { best, from };
}

// Beat frames by dynamic programming (Ellis 2007): each frame scores its own onset strength plus
// the best beat about one period earlier, so beats lock onto hits but keep the tempo through
// gaps. The best-scoring frame in the last period is traced back to the start.
export function beats({ flux, bpm }: Song) {
	const period = (60 * RATE) / HOP / bpm;
	const strength = spread(flux);
	const scores = new Float32Array(flux.length);
	const links = new Int32Array(flux.length).fill(-1);
	flux.forEach((value, t) => {
		const { best, from } = previous({ scores, t, period });
		scores[t] = value / strength + best;
		links[t] = from;
	});
	const tail = Math.max(0, flux.length - Math.round(period));
	let t = [...scores.keys()]
		.slice(tail)
		.reduce((top, i) => ((scores[i] ?? 0) > (scores[top] ?? 0) ? i : top), tail);
	const out: number[] = [];
	while (t >= 0 && flux.length > 0) {
		out.push(t);
		t = links[t] ?? -1;
	}
	return out.toReversed();
}
