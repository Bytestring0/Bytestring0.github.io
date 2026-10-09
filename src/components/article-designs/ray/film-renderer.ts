import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { cpuCamera } from "./cpu-camera";
import { buildFilmWorld, type FilmAssets } from "./film-models";
import { sourceCanvas } from "./program-assets";
import { ease } from "./choreography";
import type { ProgramTrace } from "./comet-program";
type ProgramFrame = {
	width: number;
	height: number;
	pixels: Uint8ClampedArray;
	background: Uint8ClampedArray;
	trace: ProgramTrace;
};
const random = (i: number) => {
	const n = Math.sin(i * 127.13 + 42) * 43758.5453;
	return n - Math.floor(n);
};
export class FilmRenderer {
	renderer: T.WebGLRenderer;
	scene = new T.Scene();
	camera = new T.PerspectiveCamera(52, 16 / 9, 0.04, 220);
	worlds = new Map<number, T.Group>();
	assets: FilmAssets;
	composer: EffectComposer;
	bloom: UnrealBloomPass;
	bokeh: BokehPass;
	environment: T.WebGLRenderTarget;
	trace?: ProgramTrace;
	source: T.CanvasTexture;
	image: T.CanvasTexture;
	back: T.CanvasTexture;
	frameTexture(data?: Uint8ClampedArray, width = 960, height = 540) {
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		if (data) {
			const image = new ImageData(width, height);
			image.data.set(data);
			canvas.getContext("2d")!.putImageData(image, 0, 0);
		}
		const texture = new T.CanvasTexture(canvas);
		texture.colorSpace = T.SRGBColorSpace;
		texture.anisotropy = 4;
		return texture;
	}
	constructor(canvas: HTMLCanvasElement) {
		this.renderer = new T.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: false,
			powerPreference: "high-performance",
			preserveDrawingBuffer: true,
		});
		this.renderer.outputColorSpace = T.SRGBColorSpace;
		this.renderer.toneMapping = T.ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.1;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = T.PCFShadowMap;
		this.scene.background = new T.Color(0x050b15);
		this.scene.fog = new T.FogExp2(0x050b15, 0.008);
		const pmrem = new T.PMREMGenerator(this.renderer),
			room = new RoomEnvironment();
		this.environment = pmrem.fromScene(room, 0.035);
		this.scene.environment = this.environment.texture;
		this.scene.environmentIntensity = 0.95;
		room.dispose();
		pmrem.dispose();
		const key = new T.DirectionalLight(0xdde8ff, 4);
		key.position.set(-8, 15, 12);
		key.castShadow = true;
		key.shadow.mapSize.set(1024, 1024);
		Object.assign(key.shadow.camera, {
			left: -25,
			right: 25,
			top: 25,
			bottom: -25,
			near: 0.1,
			far: 90,
		});
		key.shadow.bias = -0.001;
		key.shadow.normalBias = 0.025;
		this.scene.add(key);
		const fill = new T.DirectionalLight(0x519ab0, 2.2);
		fill.position.set(12, 6, -10);
		this.scene.add(fill);
		const warm = new T.DirectionalLight(0xffc585, 1.5);
		warm.position.set(-12, 3, -8);
		this.scene.add(warm);
		this.scene.add(new T.HemisphereLight(0x91c2df, 0x13131c, 1.2));
		this.source = new T.CanvasTexture(sourceCanvas());
		this.source.colorSpace = T.SRGBColorSpace;
		this.image = this.frameTexture();
		this.back = this.frameTexture();
		this.assets = {
			output: this.image,
			background: this.back,
			source: this.source,
		};
		this.composer = new EffectComposer(this.renderer);
		this.composer.addPass(new RenderPass(this.scene, this.camera));
		this.bokeh = new BokehPass(this.scene, this.camera, {
			focus: 10,
			aperture: 0.000055,
			maxblur: 0.004,
		});
		this.composer.addPass(this.bokeh);
		this.bloom = new UnrealBloomPass(
			new T.Vector2(800, 450),
			0.35,
			0.5,
			1.1,
		);
		this.composer.addPass(this.bloom);
		this.composer.addPass(new OutputPass());
	}
	setProgram(data: ProgramFrame) {
		this.trace = data.trace;
		this.assets.pixel = data.trace.lanes.find(
			(l) => l.pixel[0] === data.trace.pixel[0],
		)?.bytes;
		for (const [texture, bytes] of [
			[this.image, data.pixels],
			[this.back, data.background],
		] as const) {
			const canvas = texture.image as HTMLCanvasElement;
			canvas.width = data.width;
			canvas.height = data.height;
			const image = new ImageData(data.width, data.height);
			image.data.set(bytes);
			canvas.getContext("2d")!.putImageData(image, 0, 0);
			texture.needsUpdate = true;
		}
	}
	galaxy() {
		const group = new T.Group(),
			sky = new T.Group();
		group.add(sky);
		const positions: number[] = [],
			colors: number[] = [],
			color = new T.Color();
		for (let i = 0; i < 5600; i++) {
			const arm = i % 3,
				r = Math.pow(random(i), 0.58) * 29,
				a =
					r * 0.18 +
					(arm * Math.PI * 2) / 3 +
					(random(i + 51) - 0.5) * 0.38;
			positions.push(
				Math.cos(a) * r,
				4 + (random(i + 68) - 0.5) * (1 + r * 0.09),
				-10 + Math.sin(a) * r,
			);
			color.set(
				i % 7 === 0 ? 0xffd6a2 : i % 3 === 0 ? 0x657bb5 : 0x94cbd4,
			);
			color.multiplyScalar(0.35 + random(i + 72) * 1.4);
			colors.push(color.r, color.g, color.b);
		}
		const geometry = new T.BufferGeometry();
		geometry.setAttribute(
			"position",
			new T.Float32BufferAttribute(positions, 3),
		);
		geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
		const canvas = document.createElement("canvas");
		canvas.width = canvas.height = 64;
		const c = canvas.getContext("2d")!,
			gradient = c.createRadialGradient(32, 32, 0, 32, 32, 32);
		gradient.addColorStop(0, "rgba(255,255,255,1)");
		gradient.addColorStop(0.12, "rgba(255,255,255,.8)");
		gradient.addColorStop(0.35, "rgba(255,255,255,.2)");
		gradient.addColorStop(1, "rgba(255,255,255,0)");
		c.fillStyle = gradient;
		c.fillRect(0, 0, 64, 64);
		const sprite = new T.CanvasTexture(canvas);
		const points = new T.Points(
			geometry,
			new T.PointsMaterial({
				map: sprite,
				size: 0.24,
				transparent: true,
				opacity: 0.8,
				vertexColors: true,
				depthWrite: false,
				blending: T.AdditiveBlending,
			}),
		);
		sky.add(points);
		const comet = new T.Group();
		group.add(comet);
		const path = this.trace?.path ?? [
			[0.07, 0.78],
			[0.32, 0.94],
			[0.52, 0.05],
			[0.75, 0.36],
		];
		const curve = new T.CatmullRomCurve3(
			path.map(
				([x, y]) =>
					new T.Vector3((x - 0.5) * 17, 4 + (0.5 - y) * 9.56, -1),
			),
		);
		const frenet = curve.computeFrenetFrames(200, false),
			verts: number[] = [],
			uv: number[] = [],
			indices: number[] = [];
		for (let i = 0; i <= 200; i++) {
			const u = i / 200,
				p = curve.getPointAt(u),
				r = 0.022 + u ** 5 * 2.15;
			for (let j = 0; j <= 48; j++) {
				const a = (j * Math.PI) / 24,
					q = p
						.clone()
						.addScaledVector(frenet.normals[i], Math.cos(a) * r)
						.addScaledVector(
							frenet.binormals[i],
							Math.sin(a) * r * 0.6,
						);
				verts.push(q.x, q.y, q.z);
				uv.push(j / 48, u);
				if (i < 200 && j < 48) {
					const k = i * 49 + j;
					indices.push(k, k + 49, k + 1, k + 1, k + 49, k + 50);
				}
			}
		}
		const g = new T.BufferGeometry();
		g.setAttribute("position", new T.Float32BufferAttribute(verts, 3));
		g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
		g.setIndex(indices);
		g.computeVertexNormals();
		const mat = new T.MeshPhysicalMaterial({
			color: 0xcfebef,
			transmission: 0.96,
			thickness: 0.55,
			ior: 1.4,
			roughness: 0.08,
			metalness: 0,
			dispersion: 0.12,
			iridescence: 0.35,
			iridescenceIOR: 1.25,
			clearcoat: 1,
			side: T.DoubleSide,
		});
		comet.add(new T.Mesh(g, mat));
		const head = new T.Mesh(new T.SphereGeometry(2.15, 96, 64), mat);
		head.position.copy(curve.getPointAt(1));
		head.scale.z = 0.6;
		comet.add(head);
		for (let strand = 0; strand < 9; strand++) {
			const nodes = Array.from({ length: 140 }, (_, i) => {
				const u = i / 139,
					p = curve.getPointAt(u),
					f = Math.floor(u * 200),
					a = (strand * Math.PI * 2) / 9,
					r = 0.025 + u ** 5 * 2.16;
				return p
					.addScaledVector(frenet.normals[f], Math.cos(a) * r)
					.addScaledVector(
						frenet.binormals[f],
						Math.sin(a) * r * 0.6,
					);
			});
			comet.add(
				new T.Mesh(
					new T.TubeGeometry(
						new T.CatmullRomCurve3(nodes),
						180,
						0.007,
						6,
						false,
					),
					new T.MeshBasicMaterial({
						color: strand % 3 ? 0x82baca : 0xffcba2,
						transparent: true,
						opacity: 0.38,
					}),
				),
			);
		}
		const borderMaterial = new T.MeshStandardMaterial({
			color: 0x256675,
			emissive: 0x326d79,
			emissiveIntensity: 1.4,
			metalness: 0.8,
			roughness: 0.23,
		});
		const borders = new T.InstancedMesh(
			new RoundedBoxGeometry(0.823, 0.473, 0.05, 2, 0.035),
			borderMaterial,
			144,
		);
		group.add(borders);
		const dummy = new T.Object3D();
		const fragments = new T.Group();
		group.add(fragments);
		const pieces: T.Mesh[] = [];
		for (let y = 0; y < 9; y++)
			for (let x = 0; x < 16; x++) {
				const g = new T.PlaneGeometry(0.8, 0.45),
					uv = g.attributes.uv as T.BufferAttribute;
				for (let i = 0; i < uv.count; i++)
					uv.setXY(
						i,
						(x + uv.getX(i)) / 16,
						(8 - y + uv.getY(i)) / 9,
					);
				const m = new T.Mesh(
					g,
					new T.MeshBasicMaterial({
						map: this.image,
						side: T.DoubleSide,
					}),
				);
				m.userData.tile = [x, y];
				pieces.push(m);
				fragments.add(m);
			}
		group.userData.update = (t: number) => {
			sky.rotation.y = (t - 151.163) * 0.009;
			points.material.opacity =
				t < 157.523 ? ease(151.163, 154.343, t) * 0.85 : 0.7;
			comet.visible = t >= 202.083 && t < 230.943;
			comet.scale.setScalar(Math.max(0.01, ease(202.083, 209.363, t)));
			comet.rotation.y = Math.sin((t - 202.083) * 0.075) * 0.08;
			fragments.visible = t >= 230.943;
			borders.visible = fragments.visible;
			const u = ease(230.943, 241.863, t);
			pieces.forEach((p, i) => {
				const [x, y] = p.userData.tile,
					a = i * 2.399963 + (1 - u) * 2;
				p.position.set(
					(x - 7.5) * 0.8 * u +
						Math.cos(a) * (12 + random(i) * 7) * (1 - u),
					4 +
						(4 - y) * 0.45 * u +
						Math.sin(a) * (7 + random(i + 9) * 4) * (1 - u),
					-5 + (random(i + 91) - 0.5) * 14 * (1 - u),
				);
				p.rotation.set(
					(1 - u) * (random(i) - 0.5) * 2,
					(1 - u) * (random(i + 4) - 0.5) * 2,
					(1 - u) * a,
				);
				p.scale.setScalar(0.88 + 0.12 * u);
				dummy.position.copy(p.position);
				dummy.position.z -= 0.035;
				dummy.rotation.copy(p.rotation);
				dummy.scale.copy(p.scale);
				dummy.updateMatrix();
				borders.setMatrixAt(i, dummy.matrix);
			});
			borders.instanceMatrix.needsUpdate = true;
			borderMaterial.emissiveIntensity = 1.8 * (1 - u) + 0.15;
		};
		return group;
	}
	resize(width: number, height: number, scale: number) {
		this.renderer.setPixelRatio(
			Math.min(1.5, devicePixelRatio) * Math.max(0.55, scale),
		);
		this.renderer.setSize(width, height, false);
		this.composer.setSize(width, height);
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
	}
	draw(t: number, width: number, height: number, still = false) {
		const rig = cpuCamera(t, width / height);
		let world = this.worlds.get(rig.world);
		if (!world) {
			world =
				rig.world === 9
					? this.galaxy()
					: buildFilmWorld(rig.world, this.assets);
			this.worlds.set(rig.world, world);
			this.scene.add(world);
		}
		for (const [id, group] of this.worlds) group.visible = id === rig.world;
		world.userData.update?.(t);
		this.camera.position.set(...rig.eye);
		this.camera.up.set(0, 1, 0);
		this.camera.lookAt(new T.Vector3(...rig.target));
		this.camera.rotateZ(rig.roll);
		this.camera.fov = T.MathUtils.radToDeg(2 * Math.atan(0.5 / rig.lens));
		this.camera.updateProjectionMatrix();
		(this.bokeh.uniforms as Record<string, { value: number }>).focus.value =
			this.camera.position.distanceTo(new T.Vector3(...rig.target));
		this.bokeh.enabled = !still && width >= 700;
		this.bloom.strength = rig.world === 9 ? 0.38 : 0.23;
		this.scene.environmentIntensity = rig.world === 9 ? 1.3 : 1.15;
		this.renderer.toneMappingExposure =
			rig.world === 8 ? 0.9 : rig.world === 9 ? 1.13 : 1.22;
		// Short shutter dip only on scale changes, with no whole-scene beat zoom.
		const fade = 1 - rig.cut * 0.35;
		this.renderer.toneMappingExposure *= fade;
		this.composer.render();
	}
	dispose() {
		const geometries = new Set<T.BufferGeometry>(),
			materials = new Set<T.Material>(),
			textures = new Set<T.Texture>();
		this.scene.traverse((o) => {
			if (o instanceof T.Mesh || o instanceof T.Points) {
				geometries.add(o.geometry);
				for (const m of Array.isArray(o.material)
					? o.material
					: [o.material]) {
					materials.add(m);
					for (const value of Object.values(m))
						if (value instanceof T.Texture) textures.add(value);
				}
			}
		});
		geometries.forEach((g) => g.dispose());
		materials.forEach((m) => m.dispose());
		textures.forEach((t) => t.dispose());
		this.source.dispose();
		this.image.dispose();
		this.back.dispose();
		this.environment.dispose();
		this.bokeh.dispose();
		this.bloom.dispose();
		this.composer.dispose();
		this.renderer.dispose();
	}
}
