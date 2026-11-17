import { Vector3 } from "three";
import type { Object3D } from "three";

export const FORWARD = new Vector3(0, 0, -1);
export const UP = new Vector3(0, 1, 0);

export function at(road: Float32Array, frame: number) {
	const last = road.length / 3 - 1;
	const f = Math.max(0, Math.min(last, frame));
	const i = Math.floor(f);
	const j = Math.min(last, i + 1);
	const t = f - i;
	const point = (axis: number) => {
		const a = road[i * 3 + axis] ?? 0;
		const b = road[j * 3 + axis] ?? a;
		return a + (b - a) * t;
	};
	return new Vector3(point(0), point(1), point(2));
}

export function forward(road: Float32Array, frame: number) {
	return at(road, frame + 1)
		.sub(at(road, frame - 1))
		.normalize();
}

export function side(direction: Vector3) {
	return new Vector3(-direction.z, 0, direction.x).normalize();
}

// Match an object outside the course to the road's final, camera-adjusted orientation.
export function align(object: Object3D, course: Object3D, road: Float32Array, frame: number) {
	object.quaternion
		.setFromUnitVectors(FORWARD, forward(road, frame))
		.premultiply(course.quaternion);
}

export function pose(object: Object3D, road: Float32Array, frame: number, lane = 0, lift = 0) {
	const direction = forward(road, frame);
	object.position.copy(at(road, frame)).addScaledVector(side(direction), lane);
	object.position.y += lift;
	object.quaternion.setFromUnitVectors(FORWARD, direction);
}
