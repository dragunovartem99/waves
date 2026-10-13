type Buffers = { re: Float64Array; im: Float64Array; cos: Float64Array; sin: Float64Array };

const hann = (size: number) =>
	Float64Array.from({ length: size }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size));

const twiddles = ({ size, wave }: { size: number; wave: (angle: number) => number }) =>
	Float64Array.from({ length: size / 2 }, (_, k) => wave((-2 * Math.PI * k) / size));

// rev(i) = rev(i / 2) / 2, plus the top bit when i is odd.
function bitReversal(size: number) {
	const order = new Uint32Array(size);
	for (let i = 1; i < size; i++) order[i] = ((order[i >> 1] ?? 0) >> 1) | ((i & 1) * (size >> 1));
	return order;
}

// In place with plain locals on purpose: this is the hot loop, run on thousands of frames per
// song, and copies or destructured tuples (allocations) made it several times slower.
function butterflies({ re, im, cos, sin }: Buffers) {
	const size = re.length;
	for (let half = 1; half < size; half *= 2) {
		const stride = size / (2 * half);
		for (let start = 0; start < size; start += 2 * half) {
			for (let k = 0; k < half; k++) {
				const a = start + k;
				const b = a + half;
				const wr = cos[k * stride] ?? 0;
				const wi = sin[k * stride] ?? 0;
				const br = re[b] ?? 0;
				const bi = im[b] ?? 0;
				const tr = br * wr - bi * wi;
				const ti = br * wi + bi * wr;
				const ar = re[a] ?? 0;
				const ai = im[a] ?? 0;
				re[a] = ar + tr;
				im[a] = ai + ti;
				re[b] = ar - tr;
				im[b] = ai - ti;
			}
		}
	}
}

// Magnitude spectrum via iterative radix-2 Cooley–Tukey; `size` must be a power of two.
// Built per size so the window and tables are computed once, not on every frame.
export function spectrum(size: number) {
	const window = hann(size);
	const order = bitReversal(size);
	const cos = twiddles({ size, wave: Math.cos });
	const sin = twiddles({ size, wave: Math.sin });
	return (frame: Float32Array) => {
		const re = Float64Array.from(order, (from) => (frame[from] ?? 0) * (window[from] ?? 0));
		const im = new Float64Array(size);
		butterflies({ re, im, cos, sin });
		return Float32Array.from({ length: size / 2 }, (_, k) =>
			Math.hypot(re[k] ?? 0, im[k] ?? 0)
		);
	};
}
