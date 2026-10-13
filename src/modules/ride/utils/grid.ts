import { distance } from "./track";

export type Ridge = { frame: number; distance: number; beat: boolean };
type Song = { beats: number[]; track: Float32Array };

// Quarter-beat ridges between beats, dropped where the track crawls so ridges never crowd.
const STEPS = 4;
// Least track distance between ridges: at most ~14 visible, even where the track crawls.
const GAP = 9;

// Where ridges sit: one on every beat, so each ridge reaching the player lands in time, plus
// in-between ones wherever there's room for them.
export function grid({ beats, track }: Song): Ridge[] {
	const ridge = ({ frame, beat }: { frame: number; beat: boolean }) => ({
		frame,
		beat,
		distance: distance({ track, frame }),
	});
	return beats.flatMap((frame, i) => {
		const start = ridge({ frame, beat: true });
		const next = beats[i + 1];
		if (next === undefined) return [start];
		const end = distance({ track, frame: next });
		const steps = Array.from({ length: STEPS - 1 }, (_, k) =>
			ridge({ frame: frame + ((k + 1) * (next - frame)) / STEPS, beat: false })
		);
		return steps.reduce(
			(kept, step) => {
				const room =
					step.distance - (kept.at(-1)?.distance ?? 0) >= GAP &&
					end - step.distance >= GAP / 2;
				return room ? kept.concat(step) : kept;
			},
			[start]
		);
	});
}
