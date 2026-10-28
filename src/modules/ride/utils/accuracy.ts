import type { Health } from "./crash";
import { LIVES } from "./crash";
import type { Hit, Score } from "./judge";

type Ride = { score: Score; health: Health; pickups: Hit[]; blocks: Hit[] };

// Share of the song's hits played right, 0–1: pickups caught plus blocks dodged, over all of
// them. Hits a ride ended before reaching count as missed.
export function accuracy({ score, health, pickups, blocks }: Ride) {
	const dodged = health.next - (LIVES - health.lives);
	return (score.caught + dodged) / (pickups.length + blocks.length || 1);
}
