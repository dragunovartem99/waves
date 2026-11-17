import { rings } from "./rings";
import { speeds } from "./speed";
import { tilts } from "./tilt";

type Source = { intensity: Float32Array; track: Float32Array };

// AudioSurf's virtual tilt finally becomes visible geometry. Centers are XYZ per audio frame;
// Z follows the existing ride distance so hits keep their current timing.
const RELIEF = 1.3;
const SMOOTHING = 6;

// Ease changes of grade before integrating them into height, rounding hill joints without
// adding bumps to the finished road. Broader climbs and dives keep their amplitude.
function soften(slopes: number[]) {
	for (let pass = 0; pass < SMOOTHING; pass++) {
		slopes = slopes.map((current, ring, all) => {
			if (ring === 0 || ring === all.length - 1) return current;
			return ((all[ring - 1] ?? 0) + 2 * current + (all[ring + 1] ?? 0)) / 4;
		});
	}
	return slopes;
}

export function road({ intensity, track }: Source) {
	const ringList = rings(speeds(intensity));
	const slopes = soften(tilts(ringList));
	const centers = new Float32Array(track.length * 3);
	let ring = 0;
	let x = 0;
	let y = 0;
	for (let frame = 0; frame < track.length; frame++) {
		while ((ringList[ring + 1]?.frame ?? Infinity) <= frame) ring++;
		const distance = track[frame] ?? 0;
		if (frame > 0) {
			const step = distance - (track[frame - 1] ?? distance);
			const slope = slopes[ring] ?? 0;
			const heading = Math.sin(distance / 105) * 0.42 + Math.sin(distance / 43) * 0.08;
			x += Math.sin(heading) * step;
			y -= Math.sin(slope) * step * RELIEF;
		}
		centers.set([x, y, -distance], frame * 3);
	}
	return centers;
}
