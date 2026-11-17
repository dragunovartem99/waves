import {
	BufferGeometry,
	DoubleSide,
	Float32BufferAttribute,
	Group,
	Line,
	LineBasicMaterial,
	LineSegments,
	Mesh,
	MeshStandardMaterial,
} from "three";
import type { Vector3 } from "three";

import type { Song } from "../song";
import { at, forward, side, UP } from "./path";

export const WIDTH = 9;
export const LANE = 3;

function surface(centers: Float32Array) {
	const frames = centers.length / 3;
	const positions = new Float32Array(frames * 6);
	const indices: number[] = [];
	for (let frame = 0; frame < frames; frame++) {
		const center = at(centers, frame);
		const edge = side(forward(centers, frame)).multiplyScalar(WIDTH / 2);
		const left = center.clone().sub(edge);
		const right = center.clone().add(edge);
		positions.set([left.x, left.y, left.z, right.x, right.y, right.z], frame * 6);
		if (frame > 0) {
			const a = (frame - 1) * 2;
			indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
		}
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
}

function stripe(centers: Float32Array, offset: number, opacity: number) {
	const points = Array.from({ length: centers.length / 3 }, (_, frame) => {
		const direction = forward(centers, frame);
		return at(centers, frame)
			.addScaledVector(side(direction), offset)
			.addScaledVector(UP, 0.035);
	});
	const material = new LineBasicMaterial({ color: 0x8a8883, transparent: true, opacity });
	return new Line(new BufferGeometry().setFromPoints(points), material);
}

function beats(song: Song) {
	const points: Vector3[] = [];
	song.grid.forEach(({ frame, beat }) => {
		if (!beat) return;
		const center = at(song.road, frame).addScaledVector(UP, 0.045);
		const edge = side(forward(song.road, frame)).multiplyScalar(WIDTH / 2);
		points.push(center.clone().sub(edge), center.clone().add(edge));
	});
	const material = new LineBasicMaterial({ color: 0x8a8883, transparent: true, opacity: 0.09 });
	return new LineSegments(new BufferGeometry().setFromPoints(points), material);
}

export function road(song: Song) {
	const group = new Group();
	const material = new MeshStandardMaterial({
		color: 0x121316,
		roughness: 0.92,
		metalness: 0,
		side: DoubleSide,
	});
	group.add(new Mesh(surface(song.road), material));
	[-WIDTH / 2, -LANE / 2, LANE / 2, WIDTH / 2].forEach((offset) => {
		group.add(stripe(song.road, offset, Math.abs(offset) === WIDTH / 2 ? 0.4 : 0.18));
	});
	group.add(beats(song));
	return group;
}
