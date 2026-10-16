// Longest swell searched for its peak.
const LONGEST = 111;

export type Swell = { ring: number; strength: number };

// One spot per swell, a run of rings with strength, placed on the run's strongest ring.
export function swells(strengths: number[]) {
	const out: Swell[] = [];
	for (let ring = 0; ring < strengths.length; ring++) {
		if (!((strengths[ring] ?? 0) > 0)) continue;
		let best = ring;
		let end = ring + 1;
		for (; end - ring <= LONGEST && (strengths[end] ?? 0) > 0; end++) {
			if ((strengths[end] ?? 0) > (strengths[best] ?? 0)) best = end;
		}
		out.push({ ring: best, strength: strengths[best] ?? 0 });
		ring = end - 1;
	}
	return out;
}
