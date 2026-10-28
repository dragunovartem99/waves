// The ladder a ride climbs, lowest first: each rank and the accuracy it starts from.
export const RANKS = [
	{ name: "E", from: 0 },
	{ name: "D", from: 0.5 },
	{ name: "C", from: 0.65 },
	{ name: "B", from: 0.8 },
	{ name: "A", from: 0.9 },
	{ name: "S", from: 0.97 },
	{ name: "SS", from: 1 },
] as const;

// Step on the ladder an accuracy reaches: the highest rank whose threshold it meets.
export const rank = (accuracy: number) => RANKS.findLastIndex(({ from }) => accuracy >= from);
