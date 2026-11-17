import { AdditiveBlending, Color, Sprite, SpriteMaterial } from "three";
import type { Group } from "three";

import type { Lane } from "../utils/project";

const COLOR = new Color(0xff3010);
const BRIGHT = 4;

export function indicators(player: Group) {
	const lamps = [-1, 1].map((side) => {
		const material = new SpriteMaterial({
			color: COLOR.clone().multiplyScalar(BRIGHT),
			transparent: true,
			opacity: 1,
			blending: AdditiveBlending,
			depthWrite: false,
			fog: false,
			toneMapped: false,
		});
		const lamp = new Sprite(material);
		lamp.position.set(side * 0.47, 0.53, 1.44);
		lamp.scale.set(0.44, 0.07, 1);
		lamp.visible = false;
		player.add(lamp);
		return lamp;
	});
	return (lane?: Lane) => {
		lamps.forEach((lamp) => {
			lamp.visible = lane !== undefined;
		});
	};
}
