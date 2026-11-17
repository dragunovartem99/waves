import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";

const vectors = (points: number[][]) => points.map(([x = 0, y = 0, z = 0]) => new Vector3(x, y, z));

function body(material: MeshStandardMaterial) {
	const points = vectors([
		[-0.65, 0.25, -1.7],
		[0.65, 0.25, -1.7],
		[-0.9, 0.27, 1.4],
		[0.9, 0.27, 1.4],
		[-0.6, 0.46, -1.65],
		[0.6, 0.46, -1.65],
		[-0.9, 0.64, 0.7],
		[0.9, 0.64, 0.7],
		[-0.76, 0.65, 1.35],
		[0.76, 0.65, 1.35],
	]);
	return new Mesh(new ConvexGeometry(points), material);
}

function cabin() {
	const material = new MeshStandardMaterial({
		color: 0x101216,
		metalness: 0.7,
		roughness: 0.2,
		flatShading: true,
	});
	const points = vectors([
		[-0.67, 0.58, -0.75],
		[0.67, 0.58, -0.75],
		[-0.68, 0.62, 0.85],
		[0.68, 0.62, 0.85],
		[-0.5, 1.02, -0.15],
		[0.5, 1.02, -0.15],
		[-0.52, 1.01, 0.5],
		[0.52, 1.01, 0.5],
	]);
	return new Mesh(new ConvexGeometry(points), material);
}

export function car(color = 0x08090b) {
	const group = new Group();
	const paint = new MeshStandardMaterial({
		color,
		emissive: color,
		emissiveIntensity: 0.3,
		metalness: 0.65,
		roughness: 0.25,
		flatShading: true,
	});
	group.add(body(paint), cabin());
	const rearMaterial = new MeshStandardMaterial({ color: 0x8f2118, roughness: 0.55 });
	[-1, 1].forEach((x) => {
		const rear = new Mesh(new BoxGeometry(0.44, 0.07, 0.045), rearMaterial);
		rear.position.set(x * 0.47, 0.53, 1.39);
		group.add(rear);
	});
	return group;
}
