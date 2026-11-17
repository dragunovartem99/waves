import { BufferGeometry, Group, Line, LineBasicMaterial } from "three";

import { POINTS } from "@/modules/audio";

import type { Song } from "../song";
import { at, forward, side, UP } from "./path";
import { WIDTH } from "./road";

const LAYERS = 18;

function value(song: Song, frame: number, layer: number) {
	const f = Math.max(0, Math.min(song.ridges.length / POINTS - 1, frame));
	const from = f * POINTS + Math.floor((layer * POINTS) / LAYERS);
	const to = f * POINTS + Math.floor(((layer + 1) * POINTS) / LAYERS);
	let sum = 0;
	for (let i = from; i < to; i++) sum += song.ridges[i] ?? 0;
	return sum / (to - from);
}

function energy(song: Song, frame: number, layer: number) {
	return (
		(value(song, frame - 1, layer) +
			2 * value(song, frame, layer) +
			value(song, frame + 1, layer)) /
		4
	);
}

export function waves(song: Song) {
	const group = new Group();
	[-1, 1].forEach((direction) => {
		for (let layer = 0; layer < LAYERS; layer++) {
			const points = Array.from({ length: song.road.length / 3 }, (_, frame) => {
				const heading = forward(song.road, frame);
				const offset = direction * (WIDTH / 2 + 0.65 + layer * 0.32);
				const height =
					0.08 + layer * 0.075 + energy(song, frame, layer) * (2.7 + layer * 0.1);
				return at(song.road, frame)
					.addScaledVector(side(heading), offset)
					.addScaledVector(UP, height);
			});
			const material = new LineBasicMaterial({
				color: 0xd8d5ce,
				transparent: true,
				opacity: 0.22 * (1 - (layer / LAYERS) * 0.65),
			});
			group.add(new Line(new BufferGeometry().setFromPoints(points), material));
		}
	});
	return group;
}
