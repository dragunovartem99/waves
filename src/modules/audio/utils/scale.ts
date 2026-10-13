import { rise } from "./rise";

// A band's typical jump: mean of its positive rises over the song. 1 when it never rises, so it
// is always safe to divide by.
export function scale(values: Float32Array) {
	const rises = [...values.keys()].map((f) => rise({ values, f })).filter((value) => value > 0);
	return rises.length > 0 ? rises.reduce((sum, value) => sum + value, 0) / rises.length : 1;
}
