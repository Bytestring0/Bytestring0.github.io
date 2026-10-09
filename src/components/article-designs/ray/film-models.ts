import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { memoryScene } from "./comet-program";
import { ease, transport } from "./choreography";
export type FilmAssets = {
	output: T.Texture;
	background: T.Texture;
	source: T.Texture;
};
type Vec = [number, number, number];
const v = (p: Vec) => new T.Vector3(...p);
const rand = (i: number) => {
	const s = Math.sin(i * 127.13 + 42) * 43758.5453;
	return s - Math.floor(s);
};
const metal = new T.MeshStandardMaterial({
	color: 0x34414e,
	metalness: 0.91,
	roughness: 0.25,
});
const black = new T.MeshStandardMaterial({
	color: 0x121820,
	metalness: 0.58,
	roughness: 0.33,
});
const chrome = new T.MeshStandardMaterial({
	color: 0xbecbd6,
	metalness: 1,
	roughness: 0.18,
});
const gold = new T.MeshStandardMaterial({
	color: 0xb28a46,
	metalness: 0.92,
	roughness: 0.23,
});
const pcb = new T.MeshStandardMaterial({
	color: 0x163c3b,
	metalness: 0.35,
	roughness: 0.55,
});
const ceramic = new T.MeshStandardMaterial({
	color: 0x364151,
	metalness: 0.15,
	roughness: 0.27,
});
const glass = new T.MeshPhysicalMaterial({
	color: 0xc9e6f5,
	transmission: 0.92,
	thickness: 0.2,
	roughness: 0.07,
	metalness: 0,
	ior: 1.48,
	dispersion: 0.06,
});
const glow = (color: number, strength = 2) =>
	new T.MeshStandardMaterial({
		color,
		emissive: color,
		emissiveIntensity: strength,
		roughness: 0.3,
		metalness: 0.1,
	});
const blue = glow(0x68cfe6, 2.5),
	amber = glow(0xffbd6c, 2.8),
	violet = glow(0x8974da, 1.7);
const boltGeo = new T.CylinderGeometry(0.055, 0.055, 0.035, 12);
const particleGeo = new T.SphereGeometry(0.08, 12, 8);
function mesh<M extends T.Material>(
	root: T.Object3D,
	geo: T.BufferGeometry,
	mat: M,
	pos: Vec = [0, 0, 0],
) {
	const m = new T.Mesh(geo, mat);
	m.position.set(...pos);
	m.castShadow = true;
	m.receiveShadow = true;
	root.add(m);
	return m;
}
function block(
	root: T.Object3D,
	size: Vec,
	pos: Vec,
	mat = metal,
	radius = 0.05,
) {
	return mesh(
		root,
		new RoundedBoxGeometry(
			...size,
			3,
			Math.min(radius, ...size.map((x) => x / 3)),
		),
		mat,
		pos,
	);
}
function ring(
	root: T.Object3D,
	radius: number,
	tube: number,
	pos: Vec,
	mat = chrome,
) {
	return mesh(root, new T.TorusGeometry(radius, tube, 12, 128), mat, pos);
}
function cable(
	root: T.Object3D,
	points: Vec[],
	radius = 0.025,
	mat = gold,
	segments = 100,
) {
	const curve = new T.CatmullRomCurve3(points.map(v));
	const m = mesh(
		root,
		new T.TubeGeometry(curve, segments, radius, 8, false),
		mat,
	);
	return { curve, mesh: m };
}
function instances(
	root: T.Object3D,
	geo: T.BufferGeometry,
	mat: T.Material,
	poses: { p: Vec; s?: Vec; r?: Vec }[],
) {
	const m = new T.InstancedMesh(geo, mat, poses.length),
		dummy = new T.Object3D();
	poses.forEach((o, i) => {
		dummy.position.set(...o.p);
		dummy.scale.set(...(o.s ?? [1, 1, 1]));
		dummy.rotation.set(...(o.r ?? [0, 0, 0]));
		dummy.updateMatrix();
		m.setMatrixAt(i, dummy.matrix);
	});
	m.castShadow = true;
	m.receiveShadow = true;
	root.add(m);
	return m;
}
function screws(root: T.Object3D, points: Vec[], side = false) {
	return instances(
		root,
		boltGeo,
		chrome,
		points.map((p) => ({ p, r: side ? [Math.PI / 2, 0, 0] : [0, 0, 0] })),
	);
}
function ground(root: T.Group, w = 80, h = 60) {
	const m = mesh(
		root,
		new T.PlaneGeometry(w, h),
		new T.MeshStandardMaterial({
			color: 0x111b27,
			metalness: 0.55,
			roughness: 0.31,
		}),
		[0, -0.85, 0],
	);
	m.rotation.x = -Math.PI / 2;
}
function traceTexture() {
	const c = document.createElement("canvas");
	c.width = c.height = 1024;
	const x = c.getContext("2d")!;
	x.fillStyle = "#173932";
	x.fillRect(0, 0, 1024, 1024);
	for (let i = 0; i < 180; i++) {
		const a = rand(i) * 1024,
			b = rand(i + 19) * 1024;
		x.strokeStyle = i % 7 === 0 ? "#b29351" : "#275749";
		x.lineWidth = i % 7 === 0 ? 2.3 : 0.7;
		x.beginPath();
		x.moveTo(a, b);
		x.lineTo(a + 80, b);
		x.lineTo(a + 110, b + 30);
		x.lineTo(a + 110, b + 90);
		x.stroke();
	}
	x.fillStyle = "#bca476";
	for (let i = 0; i < 480; i++) {
		x.beginPath();
		x.arc(rand(i + 11) * 1024, rand(i + 37) * 1024, 2, 0, Math.PI * 2);
		x.fill();
	}
	const texture = new T.CanvasTexture(c);
	texture.colorSpace = T.SRGBColorSpace;
	texture.anisotropy = 4;
	return texture;
}
function makeOptics(assets: FilmAssets) {
	const root = new T.Group(),
		body = new T.Group();
	root.add(body);
	body.position.y = 4;
	// Lathed lens barrel: seven optical seats, knurling, flanges and retaining rings.
	const profile = [
		[2.92, -1.6],
		[3.25, -1.6],
		[3.25, -1.3],
		[3.07, -1.24],
		[3.07, -0.8],
		[3.26, -0.72],
		[3.26, -0.48],
		[3.07, -0.4],
		[3.07, 0.4],
		[3.22, 0.48],
		[3.22, 0.66],
		[3.08, 0.7],
		[3.08, 1.15],
		[3.34, 1.25],
		[3.34, 1.55],
		[2.92, 1.55],
	].map(([r, z]) => new T.Vector2(r, z));
	const barrel = mesh(
		body,
		new T.LatheGeometry(profile, 128),
		black,
		[0, 0, 2.2],
	);
	barrel.rotation.x = Math.PI / 2;
	for (let i = 0; i < 9; i++)
		ring(body, 3.12, 0.03, [0, 0, 0.65 + i * 0.33], i % 3 ? metal : chrome);
	const knurls = Array.from({ length: 128 }, (_, i) => ({
		p: [
			Math.cos((i * Math.PI) / 64) * 3.27,
			Math.sin((i * Math.PI) / 64) * 3.27,
			2.75,
		] as Vec,
		r: [0, 0, (i * Math.PI) / 64] as Vec,
		s: [0.04, 0.055, 0.36] as Vec,
	}));
	instances(body, new T.BoxGeometry(1, 1, 1), metal, knurls);
	const lenses: T.Mesh[] = [];
	for (let i = 0; i < 4; i++) {
		const l = mesh(
			body,
			new T.SphereGeometry(2.8 - i * 0.08, 96, 48),
			glass,
			[0, 0, 1 + i * 0.55],
		);
		l.scale.z = 0.1;
		lenses.push(l);
	}
	const blades: T.Mesh[] = [];
	for (let i = 0; i < 9; i++) {
		const shape = new T.Shape();
		shape.moveTo(-0.3, -0.25);
		shape.quadraticCurveTo(1.6, -0.5, 2.5, 0.8);
		shape.quadraticCurveTo(1.5, 1.2, -0.3, 0.35);
		shape.closePath();
		const b = mesh(
			body,
			new T.ExtrudeGeometry(shape, {
				depth: 0.024,
				bevelEnabled: true,
				bevelSegments: 2,
				steps: 1,
				bevelSize: 0.02,
				bevelThickness: 0.01,
			}),
			metal,
			[0, 0, 2],
		);
		blades.push(b);
	}
	const sensor = new T.Group();
	body.add(sensor);
	sensor.position.z = -1.15;
	block(sensor, [6.5, 4.2, 0.22], [0, 0, 0], pcb, 0.12);
	block(sensor, [5.8, 3.26, 0.1], [0, 0, 0.18], gold, 0.05);
	const screen = mesh(
		sensor,
		new T.PlaneGeometry(5.5, 3.094),
		new T.MeshBasicMaterial({ map: assets.background, color: 0xafd7ed }),
		[0, 0, 0.245],
	);
	const pads = Array.from({ length: 120 }, (_, i) => ({
		p: [((i % 30) - 14.5) * 0.21, i < 60 ? -1.84 : 1.84, 0.2] as Vec,
		s: [0.1, 0.14, 0.04] as Vec,
	}));
	instances(sensor, new T.BoxGeometry(1, 1, 1), gold, pads);
	const pins = Array.from({ length: 4 }, (_, i) => ({
		p: [(i - 1.5) * 1.5, -2.4, -0.1] as Vec,
		s: [0.9, 0.45, 0.28] as Vec,
	}));
	instances(sensor, new RoundedBoxGeometry(1, 1, 1, 2, 0.1), black, pins);
	screws(
		sensor,
		[
			[-3, 1.9, 0.2],
			[3, 1.9, 0.2],
			[-3, -1.9, 0.2],
			[3, -1.9, 0.2],
		],
		true,
	);
	const signal = cable(
		body,
		[
			[-2, -0.5, 5],
			[0, 0, 3],
			[1, 0.7, -1.3],
		],
		0.025,
		amber,
	);
	const token = mesh(body, new T.SphereGeometry(0.1, 24, 16), amber);
	root.userData.update = (t: number) => {
		const burst = ease(16.623, 23.5, t) * (1 - ease(25, 27.9, t));
		lenses.forEach((l, i) => {
			l.position.z = 1 + i * 0.55 + burst * i * 1.05;
		});
		barrel.material = black;
		blades.forEach((b, i) => {
			const a = (i * Math.PI * 2) / 9;
			b.rotation.z = a + 0.35 * Math.sin(t * 0.22);
			b.position.x = Math.cos(a) * (0.55 + 0.25 * Math.sin(t * 0.3));
			b.position.y = Math.sin(a) * (0.55 + 0.25 * Math.sin(t * 0.3));
		});
		token.position.copy(
			signal.curve.getPoint(
				(transport(t).phase + (transport(t).index % 4)) / 4,
			),
		);
		screen.material.color.setScalar(0.45 + 0.55 * burst);
	};
	return root;
}
function makeFiber() {
	const root = new T.Group();
	root.position.y = 4;
	// A real cable cross-section: jacket, shielding, six fibre bundles and a
	// central strength member, followed by a long braided optical channel.
	const jacket = mesh(
		root,
		new T.CylinderGeometry(3.65, 3.65, 2.6, 96, 1, true),
		black,
		[0, 0, -6],
	);
	jacket.rotation.x = Math.PI / 2;
	ring(root, 3.64, 0.12, [0, 0, -4.7], metal);
	ring(root, 3.3, 0.045, [0, 0, -4.64], chrome);
	const paths: T.CatmullRomCurve3[] = [];
	for (let strand = 0; strand < 24; strand++) {
		const points: Vec[] = Array.from({ length: 80 }, (_, i) => {
			const z = -8 + i * 0.24,
				a = (strand * Math.PI) / 12 + i * 0.047,
				r = 1.55 + (strand % 4) * 0.24;
			return [Math.cos(a) * r, Math.sin(a) * r, z];
		});
		const mat = strand % 6 === 0 ? amber : strand % 3 === 0 ? blue : glass;
		paths.push(cable(root, points, 0.045, mat, 192).curve);
	}
	const packets = instances(
		root,
		particleGeo,
		amber,
		Array.from({ length: 72 }, () => ({ p: [0, 0, 0] })),
	);
	const dummy = new T.Object3D();
	root.userData.update = (t: number) => {
		for (let i = 0; i < 72; i++) {
			const u = (t * 0.16 + i / 72) % 1;
			dummy.position.copy(paths[i % paths.length].getPoint(u));
			dummy.scale.setScalar(i % 7 ? 0.7 : 1.3);
			dummy.updateMatrix();
			packets.setMatrixAt(i, dummy.matrix);
		}
		packets.instanceMatrix.needsUpdate = true;
	};
	return root;
}
function makeMicrophone() {
	const root = new T.Group();
	root.position.y = 4;
	const housing = mesh(
		root,
		new T.CylinderGeometry(3.4, 3.4, 1.5, 96, 1, true),
		chrome,
	);
	housing.rotation.x = Math.PI / 2;
	for (let i = 0; i < 6; i++)
		ring(root, 2.9 + i * 0.08, 0.025, [0, 0, 0.76], i % 2 ? gold : metal);
	const membrane = mesh(
		root,
		new T.CircleGeometry(2.83, 128),
		new T.MeshStandardMaterial({
			color: 0x7c8c94,
			metalness: 0.85,
			roughness: 0.26,
			side: T.DoubleSide,
		}),
		[0, 0, 0.8],
	);
	const positions = membrane.geometry.attributes
			.position as T.BufferAttribute,
		original = positions.array.slice();
	const pores = Array.from({ length: 650 }, (_, i) => {
		const a = rand(i) * Math.PI * 2,
			r = Math.sqrt(rand(i + 5)) * 2.65;
		return {
			p: [Math.cos(a) * r, Math.sin(a) * r, 0.81] as Vec,
			s: [0.012, 0.012, 0.008] as Vec,
		};
	});
	instances(root, new T.SphereGeometry(1, 4, 3), black, pores);
	cable(
		root,
		[
			[0, -3, 0],
			[0, -3.7, -1],
			[2, -4, -2],
			[3, -3.5, -3],
		],
		0.12,
		black,
	);
	root.userData.update = (t: number) => {
		const clock = transport(t);
		for (let i = 0; i < positions.count; i++) {
			const x = original[i * 3],
				y = original[i * 3 + 1],
				r = Math.hypot(x, y);
			positions.setZ(
				i,
				Math.sin(r * 3.5 - t * 4) *
					(1 - r / 2.83) *
					clock.impact *
					0.12,
			);
		}
		positions.needsUpdate = true;
		membrane.geometry.computeVertexNormals();
	};
	return root;
}
function makeVault(assets: FilmAssets) {
	const root = new T.Group();
	ground(root);
	const carousel = new T.Group();
	root.add(carousel);
	carousel.position.y = 4;
	const plates: T.Group[] = [];
	for (let i = 0; i < 13; i++) {
		const plate = new T.Group();
		carousel.add(plate);
		plates.push(plate);
		const frame = new T.Shape();
		frame.moveTo(-4.4, -2.55);
		frame.lineTo(4.4, -2.55);
		frame.lineTo(4.4, 2.55);
		frame.lineTo(-4.4, 2.55);
		frame.closePath();
		const hole = new T.Path();
		hole.moveTo(-4.17, -2.32);
		hole.lineTo(-4.17, 2.32);
		hole.lineTo(4.17, 2.32);
		hole.lineTo(4.17, -2.32);
		hole.closePath();
		frame.holes.push(hole);
		mesh(
			plate,
			new T.ExtrudeGeometry(frame, {
				depth: 0.075,
				bevelEnabled: true,
				bevelSize: 0.04,
				bevelThickness: 0.04,
				bevelSegments: 3,
			}),
			i === 6 ? gold : metal,
		);
		if (i === 6) {
			mesh(
				plate,
				new T.PlaneGeometry(8.25, 4.64),
				new T.MeshBasicMaterial({
					map: assets.background,
					side: T.DoubleSide,
				}),
				[0, 0, 0.02],
			);
			const mem = memoryScene(1);
			cable(
				plate,
				mem.path.map(
					([x, y]) =>
						[(x - 0.5) * 8.25, (0.5 - y) * 4.64, 0.06] as Vec,
				),
				0.018,
				amber,
				160,
			);
		}
		screws(
			plate,
			[
				[-4.28, -2.43, 0.13],
				[-4.28, 2.43, 0.13],
				[4.28, -2.43, 0.13],
				[4.28, 2.43, 0.13],
			],
			true,
		);
	}
	for (let i = 0; i < 2; i++)
		cable(
			root,
			[
				[i ? 4.6 : -4.6, 1, -7],
				[i ? 4.6 : -4.6, 1, 7],
			],
			0.14,
			chrome,
		);
	root.userData.update = (t: number) => {
		const seal = ease(27.983, 38.903, t);
		plates.forEach((p, i) => {
			p.position.z = (i - 6) * (0.42 + 1.1 * (1 - seal));
			p.position.x = (i - 6) * 0.08 * (1 - seal);
			p.rotation.y = (i - 6) * 0.025 * (1 - seal);
		});
		carousel.rotation.y = t > 114 ? -0.12 + Math.sin(t * 0.09) * 0.05 : 0;
	};
	return root;
}
function makeDataCenter() {
	const root = new T.Group();
	ground(root, 70, 90);
	const rackGeometry = new RoundedBoxGeometry(2.8, 9.2, 3.5, 3, 0.12),
		bayGeometry = new RoundedBoxGeometry(2.35, 0.58, 0.12, 2, 0.03);
	const racks: { p: Vec }[] = [],
		bays: { p: Vec }[] = [],
		fans: { p: Vec; s: Vec; r: Vec }[] = [],
		leds: { p: Vec; s: Vec }[] = [];
	for (let row = 0; row < 2; row++)
		for (let j = 0; j < 7; j++) {
			const x = row ? 8 : -8,
				z = (j - 3) * 4.8;
			racks.push({ p: [x, 4.2, z] });
			for (let bay = 0; bay < 13; bay++) {
				const y = -0.1 + bay * 0.65;
				bays.push({ p: [x, y, z + 1.81] });
				for (let k = 0; k < 4; k++)
					leds.push({
						p: [x + 0.75 + k * 0.1, y + 0.12, z + 1.9],
						s: [0.024, 0.036, 0.012],
					});
				for (let fan = 0; fan < 2; fan++)
					fans.push({
						p: [x - 0.7 + fan * 0.75, y, z + 1.91],
						s: [0.18, 0.18, 0.18],
						r: [0, 0, 0],
					});
			}
		}
	instances(root, rackGeometry, black, racks);
	instances(root, bayGeometry, metal, bays);
	instances(root, new T.TorusGeometry(1, 0.13, 8, 32), black, fans);
	instances(root, new T.BoxGeometry(1, 1, 1), blue, leds);
	const rails = Array.from({ length: 22 }, (_, i) => ({
		p: [0, 10, (i - 11) * 1.7] as Vec,
		s: [19, 0.06, 0.06] as Vec,
	}));
	instances(root, new T.BoxGeometry(1, 1, 1), metal, rails);
	const tracks: T.CatmullRomCurve3[] = [];
	for (let i = 0; i < 18; i++) {
		const offset = (i - 9) * 0.15;
		tracks.push(
			cable(
				root,
				[
					[-8, 6.5, -13 + offset],
					[-4, 9, -7 + offset],
					[0, 9.5, offset],
					[4, 9, 7 + offset],
					[8, 6.5, 13 + offset],
				],
				0.026,
				i % 3 ? glass : blue,
				160,
			).curve,
		);
	}
	const packets = instances(
			root,
			particleGeo,
			amber,
			Array.from({ length: 108 }, () => ({ p: [0, 0, 0] })),
		),
		dummy = new T.Object3D();
	root.userData.update = (t: number) => {
		for (let i = 0; i < 108; i++) {
			dummy.position.copy(
				tracks[i % 18].getPoint((t * 0.12 + i / 108) % 1),
			);
			dummy.scale.setScalar(0.7);
			dummy.updateMatrix();
			packets.setMatrixAt(i, dummy.matrix);
		}
		packets.instanceMatrix.needsUpdate = true;
	};
	return root;
}
function makeNeural() {
	const root = new T.Group();
	root.position.y = 4;
	const positions: Vec[] = [],
		segments: Vec[][] = [];
	// A branching memory manifold: curved dendrites, glass axons and a sparse
	// attention path. No rectangular wall of cells or onscreen formula labels.
	for (let i = 0; i < 150; i++) {
		const a = i * 2.399963,
			r = 1.2 + Math.sqrt(i / 150) * 5.7;
		positions.push([
			Math.cos(a) * r,
			Math.sin(a) * r * 0.62,
			(rand(i + 18) - 0.5) * 12,
		]);
	}
	instances(
		root,
		new T.SphereGeometry(0.11, 20, 12),
		glass,
		positions.map((p) => ({ p, s: [1.2, 1.2, 1.2] })),
	);
	for (let i = 0; i < 150; i++) {
		const p = positions[i],
			next = positions[(i + 13) % 150];
		const middle: Vec = [
			(p[0] + next[0]) * 0.42,
			(p[1] + next[1]) * 0.42,
			(p[2] + next[2]) * 0.5,
		];
		segments.push([p, middle, next]);
	}
	const curves = segments
		.slice(0, 100)
		.map((p, i) => cable(root, p, 0.014, i % 5 ? violet : blue, 48).curve);
	const packets = instances(
			root,
			particleGeo,
			amber,
			Array.from({ length: 100 }, () => ({ p: [0, 0, 0] })),
		),
		dummy = new T.Object3D();
	const path = memoryScene(1).path.map(
		([x, y]) => [(x - 0.5) * 10, (0.5 - y) * 5.625, 0] as Vec,
	);
	const memory = cable(root, path, 0.06, glass, 200),
		edge = cable(root, path, 0.012, amber, 200);
	root.userData.update = (t: number) => {
		const sleep = t >= 129 && t < 136.183;
		root.rotation.z = Math.sin(t * 0.055) * 0.06;
		const growth =
			t < 114 ? ease(92.543, 110.743, t) : ease(132.543, 139.803, t);
		memory.mesh.geometry.setDrawRange(
			0,
			Math.floor((growth * memory.mesh.geometry.index!.count) / 6) * 6,
		);
		edge.mesh.geometry.setDrawRange(
			0,
			Math.floor((growth * edge.mesh.geometry.index!.count) / 6) * 6,
		);
		packets.visible = !sleep;
		for (let i = 0; i < 100; i++) {
			dummy.position.copy(curves[i].getPoint((t * 0.09 + i / 100) % 1));
			dummy.scale.setScalar(i % 9 ? 0.4 : 1);
			dummy.updateMatrix();
			packets.setMatrixAt(i, dummy.matrix);
		}
		packets.instanceMatrix.needsUpdate = true;
	};
	return root;
}
function makeCavity() {
	const root = new T.Group();
	root.position.y = 4;
	for (let i = 0; i < 15; i++) {
		const r = 2.6 + i * 0.06;
		ring(root, r, 0.026, [0, 0, (i - 7) * 0.28], i % 3 ? chrome : gold);
	}
	const memory = mesh(root, new T.IcosahedronGeometry(1.4, 5), glass);
	const paths: T.CatmullRomCurve3[] = [];
	for (let i = 0; i < 7; i++)
		paths.push(
			cable(
				root,
				Array.from({ length: 120 }, (_, j) => {
					const a = (j * Math.PI) / 60;
					return [
						Math.cos(a) * 3.4,
						Math.sin(a) * 3.4,
						Math.sin(a * 3 + i) * 0.4,
					] as Vec;
				}),
				0.018,
				i % 2 ? blue : glass,
				192,
			).curve,
		);
	root.userData.update = (t: number) => {
		memory.rotation.y = t * 0.14;
		memory.rotation.z = Math.sin(t * 0.2) * 0.15;
		root.rotation.z = Math.sin(t * 0.05) * 0.1;
	};
	return root;
}
function makeDie() {
	const root = new T.Group();
	ground(root, 45, 40);
	const boardMat = pcb.clone();
	boardMat.map = traceTexture();
	block(root, [29, 0.32, 25], [0, -0.5, 0], boardMat, 0.25);
	block(root, [25.5, 0.25, 23.5], [0, -0.16, 1], black, 0.16);
	block(root, [23.8, 0.12, 21.8], [0, 0.05, 1], gold, 0.09);
	const dieMat = new T.MeshPhysicalMaterial({
		color: 0x192c38,
		metalness: 0.64,
		roughness: 0.26,
		clearcoat: 1,
		clearcoatRoughness: 0.12,
	});
	block(root, [23.3, 0.18, 21.3], [0, 0.21, 1], dieMat, 0.06);
	const locations = [
		[-7, 5, 6, 8],
		[-1.5, 2, 5.3, 3.6],
		[4, 1, 3.2, 4],
		[6, 5, 6, 3.6],
		[7, -4.5, 6.6, 5],
		[-3.4, -4.8, 4, 3.2],
		[0.8, -6.8, 4.2, 2.4],
	];
	const cells: { p: Vec; s: Vec }[] = [],
		vias: { p: Vec }[] = [],
		paths: Vec[][] = [];
	locations.forEach(([x, z, w, h], index) => {
		block(
			root,
			[w, 0.07, h],
			[x, 0.34, z],
			index % 3 ? black : ceramic,
			0.015,
		);
		for (let row = 0; row < Math.floor(h / 0.25); row++)
			for (let col = 0; col < Math.floor(w / 0.3); col++)
				cells.push({
					p: [
						x - w / 2 + col * 0.3 + 0.16,
						0.39,
						z - h / 2 + row * 0.25 + 0.13,
					],
					s: [0.22, 0.035, 0.13],
				});
		for (let lane = 0; lane < 10; lane++) {
			const off = lane * 0.05;
			paths.push([
				[x - w * 0.45, 0.44, z - h * 0.4 + off],
				[x + w * 0.2, 0.44, z - h * 0.4 + off],
				[x + w * 0.2, 0.44, z + h * 0.4],
				[x + w * 0.45, 0.44, z + h * 0.4],
			]);
		}
	});
	instances(root, new T.BoxGeometry(1, 1, 1), gold, cells);
	for (let x = -11; x < 12; x += 0.75)
		for (let z = -9; z < 12; z += 0.75) vias.push({ p: [x, 0.32, z] });
	instances(
		root,
		new T.CylinderGeometry(0.025, 0.025, 0.03, 8),
		chrome,
		vias,
	);
	paths.forEach((p, i) => cable(root, p, 0.011, i % 5 ? chrome : gold, 12));
	const routes = [
		[
			[-7, 0.58, 3],
			[-4, 0.58, 3],
			[-4, 0.58, 2],
			[-1.5, 0.58, 2],
		],
		[
			[4, 0.58, 1],
			[4, 0.58, 5],
			[6, 0.58, 5],
		],
		[
			[6, 0.58, 5],
			[10.6, 0.58, 5],
			[10.6, 0.58, -4.5],
			[7, 0.58, -4.5],
		],
		[
			[7, 0.58, -4.5],
			[4, 0.58, -4.5],
			[4, 0.58, -6.8],
			[0.8, 0.58, -6.8],
		],
	] as Vec[][];
	const tracks = routes.map((p) => cable(root, p, 0.025, blue, 50).curve);
	const packets = instances(
			root,
			new RoundedBoxGeometry(0.18, 0.06, 0.11, 2, 0.02),
			amber,
			Array.from({ length: 24 }, () => ({ p: [0, 0, 0] })),
		),
		dummy = new T.Object3D();
	root.userData.update = (t: number) => {
		for (let i = 0; i < 24; i++) {
			dummy.position.copy(
				tracks[Math.floor(i / 6)].getPoint((t * 0.4 + i / 6) % 1),
			);
			dummy.updateMatrix();
			packets.setMatrixAt(i, dummy.matrix);
		}
		packets.instanceMatrix.needsUpdate = true;
	};
	return root;
}
function makeAssembly() {
	const root = new T.Group();
	ground(root);
	const board = new T.Group();
	root.add(board);
	board.position.y = 4;
	const mat = pcb.clone();
	mat.map = traceTexture();
	const layers: T.Mesh[] = [];
	for (let i = 0; i < 5; i++)
		layers.push(
			block(
				board,
				[10, 0.055, 6],
				[0, (i - 2) * 0.5, 0],
				i % 2 ? gold : mat,
				0.07,
			),
		);
	const parts: T.Mesh[] = [];
	for (let i = 0; i < 18; i++) {
		const x = ((i % 6) - 2.5) * 1.45,
			z = (Math.floor(i / 6) - 1) * 1.5;
		const p = block(
			board,
			[0.8, 0.21, 0.85],
			[x, 3 + rand(i), z],
			black,
			0.07,
		);
		p.userData.base = [x, 0.2, z];
		parts.push(p);
		for (let j = 0; j < 4; j++)
			block(
				board,
				[0.065, 0.075, 0.24],
				[x + (j - 1.5) * 0.17, 0.13, z + 0.53],
				gold,
				0.015,
			);
	}
	[
		cable(
			root,
			[
				[-6, 1, -5],
				[-6, 1, 5],
			],
			0.09,
			chrome,
		),
		cable(
			root,
			[
				[6, 1, -5],
				[6, 1, 5],
			],
			0.09,
			chrome,
		),
	];
	const arm = block(root, [12, 0.3, 0.4], [0, 8, 0], metal, 0.09);
	block(arm, [0.65, 1.5, 0.65], [0, -0.8, 0], chrome, 0.08);
	root.userData.update = (t: number) => {
		const u = ease(157.523, 172.543, t);
		layers.forEach(
			(p, i) => (p.position.y = (i - 2) * (0.08 + (1 - u) * 0.5)),
		);
		parts.forEach((p, i) => {
			p.position.y =
				0.3 +
				(1 - ease(158 + i * 0.4, 163 + i * 0.4, t)) * (3 + rand(i));
		});
		arm.position.z = Math.sin(t * 0.25) * 2.6;
		board.rotation.y = Math.sin(t * 0.08) * 0.04;
	};
	return root;
}
function makeGlobe() {
	const root = new T.Group();
	root.position.y = 4;
	const core = mesh(
		root,
		new T.SphereGeometry(4.5, 96, 64),
		new T.MeshPhysicalMaterial({
			color: 0x103c5a,
			roughness: 0.32,
			metalness: 0.6,
			clearcoat: 1,
		}),
	);
	const dots: { p: Vec; s: Vec }[] = [],
		surface: T.Vector3[] = [];
	for (let i = 0; i < 2000; i++) {
		const y = 1 - i / 999.5,
			a = i * 2.399963,
			r = Math.sqrt(1 - y * y),
			p: Vec = [Math.cos(a) * r * 4.56, y * 4.56, Math.sin(a) * r * 4.56];
		if (rand(i) > 0.48) dots.push({ p, s: [0.022, 0.022, 0.022] });
		if (i % 80 === 0) surface.push(v(p));
	}
	instances(root, new T.SphereGeometry(1, 6, 4), blue, dots);
	const tracks: T.CatmullRomCurve3[] = [];
	for (let i = 0; i < surface.length - 1; i++) {
		const a = surface[i],
			b = surface[(i + 7) % surface.length],
			middle = a.clone().add(b).normalize().multiplyScalar(7.2);
		tracks.push(
			cable(
				root,
				[
					a.toArray() as Vec,
					middle.toArray() as Vec,
					b.toArray() as Vec,
				],
				0.012,
				i % 3 ? blue : amber,
				96,
			).curve,
		);
	}
	const tokens = instances(
			root,
			particleGeo,
			amber,
			tracks.map(() => ({ p: [0, 0, 0] })),
		),
		dummy = new T.Object3D();
	root.userData.update = (t: number) => {
		root.rotation.y = (t - 172.543) * 0.065;
		core.rotation.y = -t * 0.02;
		tracks.forEach((p, i) => {
			dummy.position.copy(p.getPoint((t * 0.14 + i / tracks.length) % 1));
			dummy.scale.setScalar(0.6);
			dummy.updateMatrix();
			tokens.setMatrixAt(i, dummy.matrix);
		});
		tokens.instanceMatrix.needsUpdate = true;
	};
	return root;
}
function makePixelChamber(assets: FilmAssets) {
	const root = new T.Group();
	root.position.y = 4;
	block(root, [11.4, 6.7, 0.18], [0, 0, 0], black, 0.12);
	const cells: { p: Vec; s: Vec }[] = [],
		traces: Vec[][] = [];
	for (let y = 0; y < 18; y++)
		for (let x = 0; x < 32; x++)
			for (let c = 0; c < 3; c++)
				cells.push({
					p: [
						(x - 15.5) * 0.34 + (c - 1) * 0.095,
						(y - 8.5) * 0.34,
						0.18,
					],
					s: [0.069, 0.255, 0.025],
				});
	instances(root, new RoundedBoxGeometry(1, 1, 1, 2, 0.08), black, cells);
	for (let i = 0; i < 32; i++)
		traces.push([
			[(i - 15.5) * 0.34, -3.2, -0.2],
			[(i - 15.5) * 0.34, -4.2, -0.2],
			[(i - 15.5) * 0.34 * 0.6, -4.2, -2.3],
			[(i - 15.5) * 0.34 * 0.6, -2, -2.3],
		]);
	traces.forEach((p) => cable(root, p, 0.017, gold, 32));
	const screen = mesh(
		root,
		new T.PlaneGeometry(10.88, 6.12),
		new T.MeshBasicMaterial({
			map: assets.output,
			transparent: true,
			opacity: 0,
		}),
		[0, 0, 0.22],
	);
	root.userData.update = (t: number) => {
		screen.material.opacity = ease(241.8, 245.263, t);
	};
	return root;
}
function makeMonitor(assets: FilmAssets) {
	const root = new T.Group();
	ground(root, 100, 90);
	const display = new T.Group();
	root.add(display);
	display.position.set(0, 6, -20);
	block(display, [16.3, 9.4, 0.48], [0, 0, 0], black, 0.18);
	block(display, [15.93, 9.03, 0.08], [0, 0, 0.28], metal, 0.08);
	mesh(
		display,
		new T.PlaneGeometry(15.7, 8.83),
		new T.MeshBasicMaterial({ map: assets.output }),
		[0, 0, 0.335],
	);
	const screen = display.children[2] as T.Mesh<
		T.PlaneGeometry,
		T.MeshBasicMaterial
	>;
	for (let i = 0; i < 65; i++)
		block(
			display,
			[0.055, 0.28, 0.04],
			[(i - 32) * 0.18, -4.5, -0.27],
			metal,
			0.018,
		);
	block(root, [0.7, 3.4, 0.5], [0, 0.6, -20.2], chrome, 0.15);
	block(root, [5, 0.2, 3], [0, -0.65, -19.8], metal, 0.17);
	const socket = block(root, [5.2, 0.28, 5.7], [18, -0.2, -15], pcb, 0.1);
	block(socket, [3.6, 0.6, 3.8], [0, 0.35, 0], black, 0.1);
	for (let i = 0; i < 24; i++)
		block(
			socket,
			[0.085, 0.12, 0.32],
			[((i % 12) - 5.5) * 0.22, 0.18, i < 12 ? 2.1 : -2.1],
			gold,
			0.01,
		);
	const cord = cable(
		root,
		[
			[18, 0.15, -15],
			[14, 0.1, -19],
			[8, 0.1, -23],
			[1, 0.1, -23],
			[0, 1, -20.5],
		],
		0.13,
		black,
		128,
	);
	const pulse = mesh(root, new T.SphereGeometry(0.12, 24, 16), amber);
	root.userData.update = (t: number) => {
		screen.material.map = t >= 252.063 ? assets.output : assets.source;
		screen.material.color.setScalar(t >= 252.063 ? 1 : 0.22);
		pulse.position.copy(cord.curve.getPoint(((t - 245.263) / 6.8) % 1));
		pulse.visible = t < 252.063;
	};
	return root;
}
export function buildFilmWorld(world: number, assets: FilmAssets) {
	if (world === 5) return makeOptics(assets);
	if (world === 10) return makeFiber();
	if (world === 11) return makeMicrophone();
	if (world === 8) return makeVault(assets);
	if (world === 6) return makeDataCenter();
	if (world === 7) return makeNeural();
	if (world === 12) return makeCavity();
	if (world === 1) return makeDie();
	if (world === 13) return makeAssembly();
	if (world === 14) return makeGlobe();
	if (world === 16 || world === 3) return makePixelChamber(assets);
	if (world === 0) return makeMonitor(assets);
	return new T.Group();
}
