import type { Group, PerspectiveCamera } from "three";

import type { Song } from "../song";
import { distance, PACE } from "../utils/track";
import { at, FORWARD, forward } from "./path";

// Keep the player and POV fixed: only the road moves. This avoids chase-camera jitter.
export function follow(camera: PerspectiveCamera, course: Group, song: Song, frame: number) {
	const center = at(song.road, frame);
	const direction = forward(song.road, frame);
	course.quaternion.setFromUnitVectors(direction, FORWARD);
	course.position.copy(center).multiplyScalar(-1).applyQuaternion(course.quaternion);
	const speed =
		(distance({ track: song.track, frame: frame + 1 }) -
			distance({ track: song.track, frame })) /
		PACE;
	const fov = 58 + Math.min(1.5, Math.max(0, speed)) * 7;
	camera.fov += (fov - camera.fov) * 0.06;
	camera.updateProjectionMatrix();
}
