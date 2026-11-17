import { BufferGeometry, Group, Line, LineBasicMaterial } from "three";

import { POINTS } from "@/modules/audio";

import type { Song } from "../song";
import { at, forward, side, UP } from "./path";
import { WIDTH } from "./road";

function value(song: Song, frame: number, band: number) {
	const from = frame * POINTS + band * 24;
	let sum = 0;
	for (let i = 0; i < 24; i++) sum += song.ridges[from + i] ?? 0;
	return sum / 24;
}

export function waves(song: Song) {
	const group = new Group();
	[-1, 1].forEach((direction) => {
		[0, 1, 2].forEach((band) => {
			const points = Array.from({ length: song.road.length / 3 }, (_, frame) => {
				const heading = forward(song.road, frame);
				const offset = direction * (WIDTH / 2 + 0.8 + band * 0.35);
				return at(song.road, frame)
					.addScaledVector(side(heading), offset)
					.addScaledVector(UP, 0.18 + value(song, frame, band) * 1.1);
			});
			const material = new LineBasicMaterial({
				color: 0xf1efe9,
				transparent: true,
				opacity: 0.24 - band * 0.04,
			});
			group.add(new Line(new BufferGeometry().setFromPoints(points), material));
		});
	});
	return group;
}
