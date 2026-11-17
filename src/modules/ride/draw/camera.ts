import type { Group, PerspectiveCamera } from "three";

import type { Song } from "../song";
import { distance, PACE } from "../utils/track";
import { at, FORWARD, forward } from "./path";

// Damp slopes instead of matching them: hills stay visible without pitching the POV
// through the road's full climb or dive.
const PITCH = 0.55;
const EASE = 0.08;
export function follow(camera: PerspectiveCamera, course: Group, song: Song, frame: number) {
	const center = at(song.road, frame);
	const direction = forward(song.road, frame);
	direction.y *= PITCH;
	direction.normalize();
	const target = course.quaternion.clone().setFromUnitVectors(direction, FORWARD);
	course.quaternion.slerp(target, EASE);
	course.position.copy(center).multiplyScalar(-1).applyQuaternion(course.quaternion);
	const speed =
		(distance({ track: song.track, frame: frame + 1 }) -
			distance({ track: song.track, frame })) /
		PACE;
	const boost = Math.min(1.5, Math.max(0, speed));
	const fov = 58 + boost * 7;
	const gap = 10.5 + boost * 2.5;
	camera.fov += (fov - camera.fov) * 0.025;
	camera.position.z += (gap - camera.position.z) * 0.04;
	camera.updateProjectionMatrix();
}
