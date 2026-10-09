// The CPU software renderer used by the film. Four pixels share a loop group;
// this is a vector-operation illustration, not a claim about JS machine code.
import { recoverSignal, type SignalTrace } from "./signal-program";
export type RGB = [number, number, number];
export type Lane = {
	pixel: [number, number];
	distance: number;
	coverage: number;
	normal: [number, number];
	background: RGB;
	through: RGB;
	color: RGB;
	bytes: RGB;
};
export type ProgramTrace = {
	signal: SignalTrace;
	pixel: [number, number];
	lanes: Lane[];
	skip: boolean;
	width: number;
	height: number;
	path: [number, number][];
	stars: [number, number][];
};
type WorkingLane = Lane & {
	uv: [number, number];
	depth: number;
	along: number;
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
	const u = clamp((v - a) / (b - a));
	return u * u * (3 - 2 * u);
};
const hash = (x: number, y: number) => {
	const n = Math.sin(x * 127.1 + y * 311.7 + 42) * 43758.5453;
	return n - Math.floor(n);
};
export function memoryScene(aspect: number) {
	const path: [number, number][] = Array.from({ length: 81 }, (_, i) => {
		const t = i / 80,
			s = 1 - t;
		return [
			(s * s * s * 0.07 +
				3 * s * s * t * 0.32 +
				3 * s * t * t * 0.52 +
				t * t * t * 0.75) *
				aspect,
			s * s * s * 0.78 +
				3 * s * s * t * 0.94 +
				3 * s * t * t * 0.05 +
				t * t * t * 0.36,
		];
	});
	const strokes = [
		[
			[0, 1],
			[0, 0],
			[0.58, 0],
			[0.72, 0.15],
			[0.65, 0.42],
			[0, 0.45],
		],
		[
			[0.35, 0.45],
			[0.75, 1],
		],
		[
			[0.95, 1],
			[1.3, 0],
			[1.65, 1],
		],
		[
			[1.1, 0.59],
			[1.49, 0.59],
		],
		[
			[1.86, 0],
			[2.2, 0.43],
			[2.55, 0],
		],
		[
			[2.2, 0.43],
			[2.2, 1],
		],
	];
	const stars: [number, number][] = [];
	for (const stroke of strokes)
		for (let j = 1; j < stroke.length; j++) {
			const a = stroke[j - 1],
				b = stroke[j],
				count = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 7);
			for (let k = 0; k <= count; k++) {
				const u = k / count;
				stars.push([
					(0.105 + (a[0] + (b[0] - a[0]) * u) * 0.105) * aspect,
					0.29 + (a[1] + (b[1] - a[1]) * u) * 0.18,
				]);
			}
		}
	return { path, stars };
}
export function renderMemory(width = 960, height = 540) {
	const aspect = width / height,
		memory = memoryScene(aspect),
		retrieval = recoverSignal(memory.path.map(([x, y]) => [x / aspect, y])),
		path = retrieval.path.map(
			([x, y]) => [x * aspect, y] as [number, number],
		),
		stars = memory.stars,
		pixels = new Uint8ClampedArray(width * height * 4),
		background = new Uint8ClampedArray(pixels.length),
		field = new Uint8ClampedArray(pixels.length);
	const encode = (rgb: RGB): RGB =>
		rgb.map((v) =>
			Math.round(
				Math.pow(1 - Math.exp(-Math.max(0, v) * 1.3), 1 / 2.2) * 255,
			),
		) as RGB;
	function sampleStars(x: number, y: number): RGB {
		const cloud = Math.pow(
			0.5 + 0.5 * Math.sin(x * 2.7 + y * 3.1 + Math.sin(y * 4.3)),
			3,
		);
		const rgb: RGB = [
			0.003 + cloud * 0.006,
			0.008 + cloud * 0.014,
			0.023 + cloud * 0.027,
		];
		for (let layer = 0; layer < 3; layer++) {
			const scale = layer === 0 ? 18 : layer === 1 ? 39 : 77,
				gx = Math.floor(x * scale),
				gy = Math.floor(y * scale);
			for (let oy = -1; oy <= 1; oy++)
				for (let ox = -1; ox <= 1; ox++) {
					const sx = gx + ox,
						sy = gy + oy,
						n = hash(sx + layer * 11, sy);
					if (n < 0.88) continue;
					const dx =
							(x * scale - sx - 0.15 - hash(sx, sy + 9) * 0.7) /
							scale,
						dy =
							(y * scale - sy - 0.15 - hash(sx + 7, sy) * 0.7) /
							scale;
					const radius =
							(layer === 0
								? 0.0014
								: layer === 1
									? 0.0008
									: 0.00045) *
							(1 + n),
						d2 = dx * dx + dy * dy;
					if (d2 > radius * radius * 35) continue;
					const light =
						Math.exp(-d2 / (radius * radius)) * (0.3 + n * 0.5);
					rgb[0] += light * (n > 0.9 ? 1 : 0.65);
					rgb[1] += light * 0.82;
					rgb[2] += light;
				}
		}
		if (x < aspect * 0.43 && y > 0.25 && y < 0.53) {
			for (const [sx, sy] of stars) {
				const dx = x - sx,
					dy = y - sy,
					d2 = dx * dx + dy * dy;
				if (d2 > 0.0002) continue;
				const core = Math.exp(-d2 / 0.000004) * 0.7,
					glow = Math.exp(-d2 / 0.00006) * 0.035;
				rgb[0] += core * 0.65 + glow * 0.4;
				rgb[1] += core * 0.85 + glow * 0.8;
				rgb[2] += core + glow;
			}
		}
		return rgb;
	}

	// Background pass precedes the transparent-comet pass; it remains visible
	// while later image tiles are being computed.
	const backgroundLinear = new Float32Array(width * height * 3);
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x++) {
			const bg = sampleStars((x + 0.5) / height, (y + 0.5) / height),
				index = y * width + x;
			backgroundLinear.set(bg, index * 3);
			background.set([...encode(bg), 255], index * 4);
		}
	function pixel(x: number, y: number): WorkingLane {
		const px = (x + 0.5) / height,
			py = (y + 0.5) / height;
		let distance = 1e9,
			nx = 0,
			ny = 0,
			along = 0;
		for (let i = 1; i < path.length; i++) {
			const a = path[i - 1],
				b = path[i],
				vx = b[0] - a[0],
				vy = b[1] - a[1],
				u = clamp(
					((px - a[0]) * vx + (py - a[1]) * vy) / (vx * vx + vy * vy),
				);
			const dx = px - a[0] - vx * u,
				dy = py - a[1] - vy * u,
				len = Math.hypot(dx, dy),
				t = (i - 1 + u) / 80,
				width = 0.0015 + Math.pow(t, 5) * 0.185,
				sd = len - width;
			if (sd < distance) {
				distance = sd;
				nx = dx / Math.max(len, 1e-8);
				ny = dy / Math.max(len, 1e-8);
				along = t;
			}
		}
		const k = (y * width + x) * 3,
			bg: RGB = [
				backgroundLinear[k],
				backgroundLinear[k + 1],
				backgroundLinear[k + 2],
			];
		const coverage = 1 - smooth(-1 / height, 1 / height, distance),
			depth = Math.sqrt(
				clamp(-distance / (0.002 + Math.pow(along, 5) * 0.185)),
			);
		return {
			pixel: [x, y],
			distance,
			coverage,
			normal: [nx, ny],
			background: bg,
			through: bg,
			color: bg,
			bytes: encode(bg),
			uv: [px, py],
			depth,
			along,
		};
	}
	function shade(lane: WorkingLane) {
		const { distance, coverage, depth, along, background: bg } = lane,
			[px, py] = lane.uv,
			[nx, ny] = lane.normal;
		const offset = depth * (0.012 + along * 0.035),
			through = sampleStars(px + nx * offset, py + ny * offset);
		const rim = Math.exp(-Math.abs(distance) * height * 0.32),
			fresnel = Math.pow(1 - depth, 4) * 0.11;
		const strand =
			Math.pow(
				0.5 + 0.5 * Math.cos(distance * height * 0.32 + along * 27),
				22,
			) *
			Math.pow(along, 2) *
			0.035;
		const gold = clamp(nx * 0.55 - ny * 0.4 + 0.5),
			glass = through.map(
				(v, i) =>
					v * (0.92 + depth * 0.08) +
					(rim * 0.65 + fresnel + strand) *
						[0.2 + gold * 0.8, 0.72 - gold * 0.19, 1 - gold * 0.75][
							i
						],
			) as RGB;
		const color = bg.map(
			(v, i) => v * (1 - coverage) + glass[i] * coverage,
		) as RGB;
		lane.through = through;
		lane.color = color;
		lane.bytes = encode(color);
	}
	let selected: Lane[] | undefined;
	for (let y = 0; y < height; y++)
		for (let x = 0; x < width; x += 4) {
			const lanes = [0, 1, 2, 3].map((l) => pixel(x + l, y));
			// The branch shown in the film: background-only groups skip glass.
			if (!lanes.every((l) => l.coverage === 0)) lanes.forEach(shade);
			for (const lane of lanes) {
				const index = (y * width + lane.pixel[0]) * 4;
				pixels.set([...lane.bytes, 255], index);
				background.set([...encode(lane.background), 255], index);
				field.set(
					[
						Math.round(lane.coverage * 255),
						Math.round((lane.normal[0] * 0.5 + 0.5) * 255),
						Math.round((lane.normal[1] * 0.5 + 0.5) * 255),
						255,
					],
					index,
				);
			}
			if (
				!selected &&
				x > width * 0.65 &&
				y > height * 0.15 &&
				lanes.some((l) => l.coverage > 0.15 && l.coverage < 0.85)
			)
				selected = lanes;
		}
	const lanes = selected!;
	const marked = lanes.find((l) => l.coverage > 0.15 && l.coverage < 0.85)!;
	const trace: ProgramTrace = {
		signal: retrieval.trace,
		pixel: marked.pixel,
		lanes,
		skip: lanes.every((l) => l.coverage === 0),
		width,
		height,
		path: path.map((p) => [p[0] / aspect, p[1]]),
		stars: stars.map((p) => [p[0] / aspect, p[1]]),
	};
	return { width, height, pixels, background, field, trace };
}
