import { Group, Mesh, MeshStandardMaterial, TorusGeometry } from "three";
import type { Object3D } from "three";

import { HOP, RATE } from "@/modules/audio";

import type { Song } from "../song";
import type { Hit } from "../utils/judge";
import { distance } from "../utils/track";
import { car } from "./car";
import { pose } from "./path";
import { LANE } from "./road";

export type Traffic = {
	object: Object3D;
	distance: number;
	kind: "pickup" | "block";
	index: number;
	hit: Hit;
	gone: boolean;
};

function pickup() {
	const group = new Group();
	const material = new MeshStandardMaterial({
		color: 0xf1efe9,
		metalness: 0.2,
		roughness: 0.35,
	});
	[0.52, 0.35].forEach((radius) => {
		group.add(new Mesh(new TorusGeometry(radius, 0.045, 8, 32), material));
	});
	return group;
}

export function traffic(song: Song) {
	const group = new Group();
	const items: Traffic[] = [];
	const token = pickup();
	song.pickups.forEach((hit, index) => {
		const frame = (hit.time * RATE) / HOP;
		const object = token.clone();
		pose(object, song.road, frame, (hit.lane - 1) * LANE, 0.85);
		group.add(object);
		items.push({
			object,
			distance: distance({ track: song.track, frame }),
			kind: "pickup",
			index,
			hit,
			gone: false,
		});
	});
	const obstacle = car(0xa82318);
	obstacle.scale.setScalar(0.85);
	song.blocks.forEach((hit, index) => {
		const frame = (hit.time * RATE) / HOP;
		const object = obstacle.clone();
		pose(object, song.road, frame, (hit.lane - 1) * LANE, 0.03);
		group.add(object);
		items.push({
			object,
			distance: distance({ track: song.track, frame }),
			kind: "block",
			index,
			hit,
			gone: false,
		});
	});
	return { group, items };
}
