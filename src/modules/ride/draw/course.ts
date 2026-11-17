import { Group, Line, LineSegments, Mesh } from "three";

import type { Song } from "../song";
import { road } from "./road";
import { traffic } from "./traffic";
import { waves } from "./waves";

export function course(song: Song) {
	const group = new Group();
	group.add(road(song), waves(song));
	const hits = traffic(song);
	group.add(hits.group);
	return { group, items: hits.items };
}

export function dispose(group: Group) {
	group.traverse((object) => {
		if (!(object instanceof Mesh || object instanceof Line || object instanceof LineSegments))
			return;
		object.geometry.dispose();
		const materials = Array.isArray(object.material) ? object.material : [object.material];
		materials.forEach((material) => material.dispose());
	});
	group.removeFromParent();
}
