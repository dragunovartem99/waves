import { Group, Mesh, MeshStandardMaterial, TorusGeometry } from "three";
import type { Object3D } from "three";

import { HOP, RATE } from "@/modules/audio";

import type { Song } from "../song";
import type { Run } from "../utils/advance";
import type { Hit } from "../utils/judge";
import { distance } from "../utils/track";
import { car } from "./car";
import { pose } from "./path";
import { LANE } from "./road";

const COLLECT = 0.1;

export type Traffic = {
	object: Object3D;
	distance: number;
	kind: "pickup" | "block";
	index: number;
	hit: Hit;
	gone: boolean;
	collectedAt?: number;
	material?: MeshStandardMaterial;
};

function pickup(geometry: TorusGeometry) {
	const group = new Group();
	const material = new MeshStandardMaterial({
		color: 0xf1efe9,
		emissive: 0xf1efe9,
		emissiveIntensity: 0.35,
		metalness: 0.2,
		roughness: 0.35,
		transparent: true,
	});
	group.add(new Mesh(geometry, material));
	return { group, material };
}

export function update(item: Traffic, run: Run, now: number) {
	const caught =
		item.kind === "pickup" &&
		item.index < run.score.next &&
		item.hit.lane === run.lane &&
		Math.abs(item.hit.time - now) <= 0.08;
	const crashed =
		item.kind === "block" &&
		item.index < run.health.next &&
		item.hit.lane === run.lane &&
		run.crashed === now;
	if (caught && item.collectedAt === undefined) item.collectedAt = now;
	if (crashed) item.gone = true;
	if (item.collectedAt === undefined) return;
	const progress = Math.min(1, (now - item.collectedAt) / COLLECT);
	const wobble = Math.sin(progress * Math.PI) * 0.06;
	item.object.scale.set(1 + progress * 0.35 + wobble, 1 + progress * 0.2 - wobble, 1);
	if (item.material) item.material.opacity = (1 - progress) ** 2;
	if (progress === 1) item.gone = true;
}

export function traffic(song: Song) {
	const group = new Group();
	const items: Traffic[] = [];
	const geometry = new TorusGeometry(0.48, 0.055, 8, 32);
	song.pickups.forEach((hit, index) => {
		const frame = (hit.time * RATE) / HOP;
		const { group: object, material } = pickup(geometry);
		pose(object, song.road, frame, (hit.lane - 1) * LANE, 0.85);
		group.add(object);
		items.push({
			object,
			material,
			distance: distance({ track: song.track, frame }),
			kind: "pickup",
			index,
			hit,
			gone: false,
		});
	});
	const obstacle = car(0xd9342b);
	obstacle.scale.setScalar(0.95);
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
