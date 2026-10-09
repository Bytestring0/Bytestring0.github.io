import { project, type CpuCamera, type V3 } from "./cpu-camera";
import { ease, transport } from "./choreography";
import type { ProgramTrace } from "./program-assets";
const blue = "#91e4ff",
	gold = "#ffca83",
	purple = "#cc9aff",
	rose = "#ff719b";
const hash = (i: number) => {
	const x = Math.sin(i * 127.13 + 42) * 43758.5453;
	return x - Math.floor(x);
};
export function drawSignalScene(
	c: CanvasRenderingContext2D,
	t: number,
	w: number,
	h: number,
	rig: CpuCamera,
	tr?: ProgramTrace,
) {
	if (!tr) return;
	const clock = transport(t),
		signal = tr.signal,
		show = 1 - rig.cut;
	const point = (p: V3) => project(p, rig, w, h);
	const stroke = (points: V3[], color = blue, alpha = 0.5, width = 1) => {
		c.globalAlpha = alpha * show;
		c.strokeStyle = color;
		c.lineWidth = width;
		c.beginPath();
		let started = false;
		for (const p of points) {
			const q = point(p);
			if (!q) {
				started = false;
				continue;
			}
			if (started) c.lineTo(q.x, q.y);
			else {
				c.moveTo(q.x, q.y);
				started = true;
			}
		}
		c.stroke();
		c.globalAlpha = 1;
	};
	const dot = (p: V3, color = blue, radius = 0.065, alpha = 1) => {
		const s = point(p);
		if (!s || s.x < 0 || s.x > w || s.y < 0 || s.y > h) return;
		c.globalAlpha = show * alpha;
		c.fillStyle = color;
		const r = Math.max(0.5, Math.min(8, s.scale * radius));
		c.beginPath();
		c.arc(s.x, s.y, r, 0, Math.PI * 2);
		c.fill();
		c.globalAlpha = 1;
	};
	const label = (text: string, p: V3, color = blue, size = 12) => {
		const s = point(p);
		if (!s || s.x < 25 || s.x > w - 25 || s.y < 75 || s.y > h - 110) return;
		c.globalAlpha = show;
		c.fillStyle = color;
		c.textAlign = "center";
		c.font = `500 ${Math.min(size, Math.max(10, w * 0.027))}px Consolas,monospace`;
		c.shadowColor = "#020913";
		c.shadowBlur = 8;
		c.fillText(text, s.x, s.y);
		c.shadowBlur = 0;
		c.globalAlpha = 1;
	};
	const curve = (path: V3[], phase: number) => {
		const u = Math.max(0, Math.min(0.9999, phase)) * (path.length - 1),
			a = path[Math.floor(u)],
			b = path[Math.floor(u) + 1];
		return a.map((v, i) => v + (b[i] - v) * (u - Math.floor(u))) as V3;
	};
	const payload = (path: V3[], u: number, color = gold, alpha = 1) => {
		const q = point(curve(path, u)),
			tail = point(curve(path, Math.max(0, u - 0.025)));
		if (!q) return;
		c.globalAlpha = show * alpha;
		c.fillStyle = color;
		const r = Math.max(2, Math.min(9, q.scale * 0.12));
		c.fillRect(q.x - r, q.y - r * 0.6, r * 2, r * 1.2);
		if (tail) {
			c.strokeStyle = color;
			c.lineWidth = r * 0.7;
			c.globalAlpha *= 0.3;
			c.beginPath();
			c.moveTo(tail.x, tail.y);
			c.lineTo(q.x, q.y);
			c.stroke();
		}
		c.globalAlpha = 1;
	};
	const trail = (z = 0, scale = 8): V3[] =>
		tr.path.map(([x, y]) => [
			(x - 0.5) * scale,
			4 + (0.5 - y) * scale * 0.5625,
			z,
		]);
	// A single immutable record survives the scene changes and replication.
	c.globalAlpha = 0.55 * show;
	c.fillStyle = blue;
	c.font = "10px Consolas,monospace";
	c.textAlign = "left";
	c.fillText(`MEMORY / ${signal.id}`, Math.max(22, w * 0.04), h - 81);
	c.globalAlpha = 1;
	if (rig.world === 5) {
		const path = trail(t < 16.623 ? 8 : -0.18, 5.5);
		stroke(path, gold, 0.65, 1.8);
		if (t < 16.623) {
			const progress = ease(4.07, 16.623, t);
			stroke(
				path.slice(0, Math.max(2, Math.floor(progress * path.length))),
				blue,
				0.8,
				2,
			);
			for (let i = 0; i < 6; i++) {
				const object = path[Math.round((i / 5) * (path.length - 1))],
					x = (i - 2.5) * 0.6;
				stroke(
					[
						object,
						[x, 4, 3],
						[object[0] * -0.58, 4 - (object[1] - 4) * 0.58, -0.18],
					],
					gold,
					0.12,
					1,
				);
			}
			label("OPTICS", [0, 7.7, 3], gold, 13);
		} else {
			signal.samples.forEach(([x, y], i) => {
				const p: V3 = [(x - 0.5) * 5.5, 4 + (0.5 - y) * 3.09375, -0.17];
				dot(p, i % 3 ? blue : gold, 0.08);
				if (i % 4 === 0)
					label(
						String(Math.round(x * 1023)),
						[p[0], p[1] + 0.35, p[2]],
						gold,
						10,
					);
			});
			const a = (clock.index % 16) + clock.phase;
			for (let i = 0; i < 16; i++) {
				const p = signal.samples[i];
				const route: V3[] = [
					[(p[0] - 0.5) * 5.5, 4 + (0.5 - p[1]) * 3.09375, -0.17],
					[((i % 4) - 1.5) * 1.3, 1.6, -1.2],
				];
				stroke(route, blue, 0.1);
				payload(route, ((a + i) / 16) % 1, gold, 0.6);
			}
			label(
				t > 56 ? "TIMESTAMP / RESAMPLE" : "SENSOR → ADC",
				[0, 7.2, -0.2],
				blue,
				14,
			);
			label("10 BIT × 16", [0, 1, -0.2], gold, 12);
		}
		return;
	}
	if (rig.world === 8) {
		const sealed = t < 42.083 ? 1 - ease(31.623, 38.903, t) : 1;
		stroke(trail(0.08), gold, 0.25 + 0.65 * sealed, 1.6);
		label("ARCHIVE / " + signal.id, [0, 7.1, 0.08], gold, 13);
		const copies = t > 157.523 ? ease(157.523, 169.083, t) : 0;
		for (let i = 0; i < 9; i++) {
			const z = (i - 4) * 1.15;
			if (i === 4) continue;
			const alpha = t > 157.523 ? copies * 0.3 : 0.05;
			stroke(trail(z + 0.04), blue, alpha, 1.1);
			if (t > 157.523 && i % 2 === 0) {
				const route: V3[] = [
					[0, 4, 0.1],
					[5.2, 4, 0.1],
					[5.2, 4, z],
					[0, 4, z],
				];
				stroke(route, gold, 0.15);
				payload(
					route,
					(((clock.index % 4) + clock.phase) / 4 + i / 9) % 1,
					gold,
					0.75,
				);
			}
		}
		if (t > 114 && t < 129) {
			// A missing packet casts a long geometrical shadow, without erasing
			// the archived record: the lyric's pain remains rather than resetting.
			const shadow = trail(0.05).map(
				([x, y, z]) => [x + 3, 1.5, z - 8 - (y - 4) * 2] as V3,
			);
			stroke(shadow, rose, 0.18, 8);
			label("RECORD RETAINED", [0, 1.1, 0], rose, 12);
		} else if (t > 157)
			label("NEW DEVICE / SAME MEMORY", [0, 1, 0], blue, 12);
		else label(t < 38.903 ? "SEALING" : "PERSISTENT", [0, 1, 0], blue, 12);
		return;
	}
	if (rig.world === 6) {
		const chorus = t >= 85.263 && t < 99.823,
			complete = t > 172.36;
		const node = (i: number): V3 => [
			Math.cos((i * Math.PI) / 3) * 9,
			4.2,
			Math.sin((i * Math.PI) / 3) * 9,
		];
		const route = (i: number, j: number): V3[] =>
			Array.from({ length: 33 }, (_, k) => {
				const u = k / 32,
					a = node(i),
					b = node(j),
					arch = Math.sin(u * Math.PI) * (chorus ? 7 : 3.2);
				return [
					a[0] * (1 - u) + b[0] * u,
					4.2 + arch,
					a[2] * (1 - u) + b[2] * u,
				] as V3;
			});
		const links = chorus ? 6 : complete ? 4 : 2;
		for (let j = 0; j < links; j++) {
			const path = route(j, (j + 3) % 6),
				broken = t < 56.183 && j === 0;
			stroke(
				path,
				broken ? rose : blue,
				chorus ? 0.42 : 0.22,
				chorus ? 1.6 : 1,
			);
			for (let i = 0; i < (chorus ? 12 : 5); i++) {
				const u =
					(((clock.index % 8) + clock.phase) / 8 +
						i / (chorus ? 12 : 5)) %
					1;
				if (broken && u > 0.46 && u < 0.65) continue;
				payload(
					path,
					u,
					broken ? rose : chorus ? gold : blue,
					broken && u > 0.65 ? 0.15 : 0.95,
				);
			}
			if (broken) label("4 / 16 LOST", curve(path, 0.5), rose, 13);
		}
		for (let i = 0; i < 6; i++)
			label(
				[
					"CAPTURE",
					"RELAY 01",
					"CACHE",
					"RETRIEVAL",
					"RETURN",
					"DISPLAY",
				][i],
				node(i),
				i === 0 ? gold : blue,
				11,
			);
		if (t >= 71.163 && t < 85.263) {
			const hops = Math.floor((t - 71.163) / 3.64),
				p = node(hops % 6);
			for (let i = 0; i < 3; i++) {
				const radius = 0.5 + ((clock.phase + i / 3) % 1) * 2.2;
				stroke(
					Array.from({ length: 49 }, (_, j) => [
						p[0] + Math.cos((j * Math.PI) / 24) * radius,
						0.2,
						p[2] + Math.sin((j * Math.PI) / 24) * radius,
					]),
					gold,
					0.18 * (1 - clock.phase),
					1,
				);
			}
			label("ROUTE RECOVERED", [0, 2.8, 0], gold, 14);
		} else
			label(
				chorus
					? "ALL ROUTES / OPEN"
					: complete
						? "MEMORY → MESSAGE"
						: "SEARCH / MISSING SIGNAL",
				[0, 2.8, 0],
				gold,
				14,
			);
		return;
	}
	if (rig.world === 7) {
		const sleeping = t >= 129.083 && t < 136.183,
			reveal = t >= 136.183 || (t >= 99.823 && t < 114.343);
		const z = (i: number) => (i - 2) * 3.2;
		const layerNames = [
			"MASKED INPUT",
			"ENCODING",
			"MEMORY BANK",
			"ATTENTION",
			"RESTORED PATH",
		];
		for (let i = 0; i < 5; i++) {
			label(layerNames[i], [0, 7.5, z(i)], i === 4 ? gold : purple, 11);
			const inPlane: V3[] = signal.samples.map(([x, y]) => [
				(x - 0.5) * 7.7,
				4 + (0.5 - y) * 4.33,
				z(i) + 0.08,
			]);
			stroke(
				inPlane,
				i === 4 ? gold : purple,
				sleeping ? 0.08 : i === 4 && reveal ? 0.75 : 0.2,
				1.6,
			);
			for (let j = 0; j < 16; j++) {
				if (i === 0 && !signal.received[j]) continue;
				dot(
					inPlane[j],
					i === 4 ? gold : blue,
					0.08,
					sleeping ? 0.15 : 0.85,
				);
				if (i < 4) {
					const destination: V3 = [
							inPlane[j][0],
							inPlane[j][1],
							z(i + 1) + 0.08,
						],
						route: V3[] = [inPlane[j], destination];
					stroke(route, purple, 0.08);
					payload(
						route,
						(((clock.index % 4) + clock.phase) / 4 + j / 16) % 1,
						i === 3 ? gold : blue,
						sleeping ? 0.08 : 0.65,
					);
				}
			}
		}
		if (reveal) {
			signal.candidates.forEach((path, i) => {
				const p: V3[] = path.map(([x, y]) => [
					(x - 0.5) * 7.7,
					4 + (0.5 - y) * 4.33,
					-3.1,
				]);
				stroke(
					p,
					i === signal.selected ? gold : rose,
					i === signal.selected ? 0.75 : 0.07,
					1.7,
				);
				label(
					`${["MEMORY", "MIRROR", "REVERSE"][i]} ${(signal.attention[i] * 100).toFixed(1)}%`,
					[(i - 1) * 3.4, 1, -3],
					i === signal.selected ? gold : purple,
					11,
				);
			});
		}
		label(
			sleeping
				? "SLEEP / RECORD RETAINED"
				: reveal
					? "MASKED RETRIEVAL / MATCH"
					: "QUERY / " + signal.id,
			[0, 0.4, 0],
			gold,
			13,
		);
		return;
	}
	if (rig.world === 9) {
		const late = t >= 202.083,
			assemble = t >= 230.943;
		// A three-dimensional memory sky. Density, parallax and a forward orbit
		// make the second chorus a spatial reveal rather than another chip shot.
		for (let i = 0; i < 620; i++) {
			const a = hash(i) * Math.PI * 2,
				b = Math.acos(hash(i + 911) * 2 - 1),
				r = 15 + hash(i + 43) * 28;
			dot(
				[
					Math.cos(a) * Math.sin(b) * r,
					4 + Math.cos(b) * r,
					Math.sin(a) * Math.sin(b) * r,
				],
				i % 7 === 0 ? gold : blue,
				0.02 + hash(i + 18) * 0.035,
				0.35 + hash(i + 29) * 0.65,
			);
		}
		const stars = tr.stars.map(
			([x, y]) => [(x - 0.5) * 17, 4 + (0.5 - y) * 9.56, -7] as V3,
		);
		stars.forEach((p) => dot(p, blue, 0.055, 0.8));
		if (late && !assemble) {
			const path = trail(-1, 17),
				form = ease(202.083, 209.363, t);
			stroke(path, gold, 0.7, 2);
			// Swept transparent ribbon derived from the actual stored trajectory.
			// Its edge/mesh replaces a generic terrain or waveform.
			for (let k = 0; k < 32; k++) {
				const a = (k * Math.PI) / 16;
				const strip = path.map((p, i) => {
					const u = i / (path.length - 1),
						radius = (0.025 + u ** 5 * 2.9) * form;
					return [
						p[0],
						p[1] + Math.cos(a) * radius,
						p[2] + Math.sin(a) * radius,
					] as V3;
				});
				stroke(
					strip,
					k % 4 === 0 ? gold : blue,
					k % 4 === 0 ? 0.3 : 0.09,
					k % 4 === 0 ? 1.4 : 0.7,
				);
			}
			for (let k = 4; k < 81; k += 4) {
				const p = path[k],
					u = k / 80,
					r = (0.025 + u ** 5 * 2.9) * form;
				stroke(
					Array.from(
						{ length: 49 },
						(_, j) =>
							[
								p[0],
								p[1] + Math.cos((j * Math.PI) / 24) * r,
								p[2] + Math.sin((j * Math.PI) / 24) * r,
							] as V3,
					),
					blue,
					0.13,
					0.8,
				);
			}
			const left = path[0],
				right = path[path.length - 1];
			dot(left, gold, 0.13);
			dot(right, gold, 0.13);
			label("ORIGIN", [left[0], left[1] + 0.5, left[2]], gold, 12);
			label(
				"RECONSTRUCTED",
				[right[0], right[1] + 3.6, right[2]],
				blue,
				12,
			);
		}
		if (assemble) {
			const done = ease(230.943, 241.863, t);
			for (let i = 0; i < 12; i++) {
				const a = (i * Math.PI) / 6,
					position: V3 = [
						Math.cos(a) * 10 * (1 - done) +
							((i % 4) - 1.5) * 3.2 * done,
						4 +
							Math.sin(a) * 5 * (1 - done) +
							(Math.floor(i / 4) - 1) * 1.8 * done,
						-4.9,
					];
				if (done < 0.85)
					label(
						`${i + 1}/12`,
						[position[0], position[1] + 1.2, position[2]],
						gold,
						11,
					);
			}
			label(
				done >= 1 ? "FRAME COMPLETE" : "ASSEMBLE / SAME MEMORY",
				[0, 8, -5],
				gold,
				14,
			);
		}
		return;
	}
}
