import { HOP, RATE } from "./frames";

export const POINTS = 96;
const LOW = 40;
const HIGH = 12_000;
const BIN_HZ = RATE / HOP;
const COMPRESSION = 10;
const PASSES = 3;

// Fractional FFT bin of ridge point k (may be fractional itself, for range edges).
const bin = (k: number) => (LOW * (HIGH / LOW) ** (k / (POINTS - 1))) / BIN_HZ;

const at = ({ magnitudes, i }: { magnitudes: Float32Array; i: number }) => magnitudes[i] ?? 0;

// Bass points sit between bins, so interpolate; treble points span many bins, so take the max
// or a narrow hi-hat line would slip between samples.
function sample({ magnitudes, k }: { magnitudes: Float32Array; k: number }) {
	const first = Math.ceil(bin(k - 0.5));
	const last = Math.floor(bin(k + 0.5));
	if (last >= first) return Math.max(...magnitudes.subarray(first, last + 1));
	const position = bin(k);
	const i = Math.floor(position);
	const t = position - i;
	return at({ magnitudes, i }) * (1 - t) + at({ magnitudes, i: i + 1 }) * t;
}

const blur = (values: Float32Array) =>
	values.map((value, i) => ((values[i - 1] ?? value) + 2 * value + (values[i + 1] ?? value)) / 4);

// One spectrum as a ridge line: log-spaced 40 Hz–12 kHz, log-compressed, softened.
export function ridge(magnitudes: Float32Array) {
	const values = Float32Array.from({ length: POINTS }, (_, k) =>
		Math.log1p(COMPRESSION * sample({ magnitudes, k }))
	);
	return Array.from({ length: PASSES }).reduce<Float32Array>((line) => blur(line), values);
}
