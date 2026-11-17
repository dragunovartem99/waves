import {
	ACESFilmicToneMapping,
	Color,
	DirectionalLight,
	Fog,
	HemisphereLight,
	PerspectiveCamera,
	Scene,
	SRGBColorSpace,
	WebGLRenderer,
} from "three";
import type { Group } from "three";

import { HOP, RATE } from "@/modules/audio";

import type { Song } from "../song";
import type { Run } from "../utils/advance";
import { distance } from "../utils/track";
import { follow } from "./camera";
import { car } from "./car";
import { course, dispose } from "./course";
import { align } from "./path";
import { LANE } from "./road";
import { indicators } from "./signals";
import { update } from "./traffic";
import type { Traffic } from "./traffic";

type Frame = { song: Song; run: Run; now: number };
const VIEW = 150;
const WARNING = 1;

export class World {
	private renderer: WebGLRenderer;
	private scene = new Scene();
	private camera = new PerspectiveCamera(58, 1, 0.1, VIEW + 40);
	private course?: Group;
	private player = car();
	private indicate = indicators(this.player);
	private traffic: Traffic[] = [];
	private song?: Song;
	private now = 0;
	private width = 0;
	private height = 0;

	constructor(canvas: HTMLCanvasElement) {
		this.renderer = new WebGLRenderer({ canvas, antialias: true });
		this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
		this.renderer.outputColorSpace = SRGBColorSpace;
		this.renderer.toneMapping = ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 0.95;
		this.scene.background = new Color(0x000000);
		this.scene.fog = new Fog(0x000000, 48, VIEW);
		this.scene.add(new HemisphereLight(0xd8d8d2, 0x000000, 1.5));
		const light = new DirectionalLight(0xffffff, 2.5);
		light.position.set(-6, 12, 8);
		light.target.position.set(0, 0, -12);
		this.camera.position.set(0, 5.8, 10.5);
		this.camera.lookAt(0, 0.5, -22);
		this.scene.add(light, light.target, this.player);
	}

	private resize() {
		const { clientWidth: width, clientHeight: height } = this.renderer.domElement;
		if (width === this.width && height === this.height) return;
		this.width = width;
		this.height = height;
		this.renderer.setSize(width, height, false);
		this.camera.aspect = width / Math.max(1, height);
		this.camera.updateProjectionMatrix();
	}

	show({ song, run, now }: Frame) {
		if (song !== this.song || now < this.now) {
			if (this.course) dispose(this.course);
			const next = course(song);
			this.song = song;
			this.course = next.group;
			this.traffic = next.items;
			this.scene.add(next.group);
		}
		this.now = now;
		this.resize();
		const frame = (now * RATE) / HOP;
		this.player.position.set((run.u - 0.5) * LANE * 5, 0.04, 0);
		const block = song.blocks.find(
			(candidate, index) =>
				index >= run.health.next &&
				candidate.lane === run.lane &&
				candidate.time >= now &&
				candidate.time - now <= WARNING
		);
		this.indicate(block?.lane);
		if (this.course) {
			follow(this.camera, this.course, song, frame);
			align(this.player, this.course, song.road, frame);
		}
		const travelled = distance({ track: song.track, frame });
		this.traffic.forEach((item) => {
			const ahead = item.distance - travelled;
			update(item, run, now);
			item.object.visible =
				!item.gone && (item.collectedAt !== undefined || (ahead > -5 && ahead < VIEW));
		});
		this.renderer.render(this.scene, this.camera);
	}
}
