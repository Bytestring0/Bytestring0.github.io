import { cpuCamera, project, type V3 } from "./cpu-camera";
import { programSource, type ProgramTrace } from "./program-assets";
import { ease, span, transport } from "./choreography";
import { drawSignalScene } from "./signal-scenes";
const mix = (a: V3, b: V3, u: number) =>
	a.map((v, i) => v + (b[i] - v) * u) as V3;
const blue = "#9adcf2",
	gold = "#ffd195",
	green = "#b4f0d1";
export class CpuOverlay {
	ctx: CanvasRenderingContext2D;
	trace?: ProgramTrace;
	constructor(public canvas: HTMLCanvasElement) {
		this.ctx = canvas.getContext("2d")!;
	}
	draw(t: number, w: number, h: number, _hit: number, _energy: number[]) {
		const storyTime = t;
		const c = this.ctx,
			rig = cpuCamera(t, w / h),
			ratio = this.canvas.width / w,
			clock = transport(t),
			tr = this.trace;
		c.setTransform(ratio, 0, 0, ratio, 0, 0);
		c.clearRect(0, 0, w, h);
		c.textBaseline = "middle";
		c.lineCap = "round";
		c.lineJoin = "round";
		if (rig.world >= 5) {
			drawSignalScene(c, t, w, h, rig, tr);
			return;
		}
		// Reuse the verified CPU operation vocabulary in a compact, correctly
		// ordered render passage. Cinematic montage inserts inspect that trace.
		if (rig.world === 1 || (rig.world === 4 && t < 151)) {
			if (storyTime < 141.623) t = 31;
			else if (storyTime < 143.443) t = 49.5;
			else if (storyTime < 145.263) t = 72;
			else if (storyTime < 147.083) t = 88;
			else if (storyTime < 148.903) t = 104;
			else if (storyTime < 151.163) t = 143 + (storyTime - 148.903) * 2;
			else if (storyTime < 194.803) t = 88;
			else if (storyTime < 216) t = 148;
			else if (storyTime < 227.083) t = 88;
			else t = 147.5;
		}
		const point = (p: V3) => project(p, rig, w, h);
		const line = (points: V3[], color = blue, alpha = 0.5, weight = 1) => {
			c.globalAlpha = alpha * (1 - rig.cut);
			c.strokeStyle = color;
			c.lineWidth = weight;
			c.beginPath();
			let start = false;
			for (const p of points) {
				const s = point(p);
				if (!s) {
					start = false;
					continue;
				}
				if (start) c.lineTo(s.x, s.y);
				else {
					c.moveTo(s.x, s.y);
					start = true;
				}
			}
			c.stroke();
			c.globalAlpha = 1;
		};
		const text = (
			str: string,
			p: V3,
			color = blue,
			size = 12,
			alpha = 1,
		) => {
			const s = point(p);
			if (!s || s.x < 15 || s.x > w - 15 || s.y < 80 || s.y > h - 115)
				return;
			c.globalAlpha = alpha * (1 - rig.cut);
			c.textAlign = "center";
			c.font = `500 ${Math.max(10, Math.min(size, w * 0.04))}px Consolas,monospace`;
			c.shadowColor = "#020812";
			c.shadowBlur = 10;
			c.fillStyle = color;
			c.fillText(str, s.x, s.y);
			c.shadowBlur = 0;
			c.globalAlpha = 1;
		};
		const packet = (
			path: V3[],
			phase: number,
			color = gold,
			alpha = 1,
			word = "",
		) => {
			const p = this.path(path, Math.max(0, Math.min(1, phase))),
				s = point(p);
			if (!s) return;
			const tail = point(this.path(path, Math.max(0, phase - 0.06)));
			c.globalAlpha = alpha * (1 - rig.cut);
			const size = Math.min(10, Math.max(3, s.scale * 0.1));
			c.fillStyle = color;
			c.fillRect(s.x - size, s.y - size * 0.5, size * 2, size);
			if (tail) {
				c.strokeStyle = color;
				c.lineWidth = size * 0.6;
				c.globalAlpha *= 0.22;
				c.beginPath();
				c.moveTo(tail.x, tail.y);
				c.lineTo(s.x, s.y);
				c.stroke();
			}
			if (word && s.scale > 15)
				text(word, [p[0], p[1] + 0.4, p[2]], color, 11, alpha);
			c.globalAlpha = 1;
		};
		const bus = (path: V3[], color = blue, count = 3, alpha = 1) => {
			line(path, color, alpha * 0.18, 1.2);
			for (let i = 0; i < count; i++)
				packet(
					path,
					(((clock.index % 4) + clock.phase) / 4 + i / count) % 1,
					color,
					alpha,
				);
		};
		if (rig.world === 0) {
			if (t > 8 && t < 27.983) {
				text("LOADED / RAY.EXE", [-21, 1.1, -1], blue, 13);
				text("memory.path / stars", [-21, 1.1, 4], gold, 13);
				const ip: V3[] = [
						[-21, 0.7, -1],
						[-17, 0.7, -1],
						[-17, 0.7, 3],
						[-7, 0.7, 3],
					],
					dp: V3[] = [
						[-21, 0.7, 4],
						[-15, 0.7, 4],
						[-15, 0.7, 7],
						[-7, 0.7, 7],
					];
				bus(ip, blue, 4, ease(11.763, 16.623, t));
				bus(dp, gold, 4, ease(16.623, 20.263, t));
				if (tr) {
					line(
						tr.path.map(
							([x, y]) => [-23 + x * 4, 1, 1 + y * 4] as V3,
						),
						gold,
						0.6,
						1.6,
					);
				}
				text("L1I", [-7, 0.65, 3], blue);
				text("L1D", [-7, 0.65, 7], gold);
			} else if (t > 187 && t < 189.343) {
				text("COMMITTED TILE", [-21, 1, 1], green, 15);
				bus(
					[
						[0.8, 0.7, -6.8],
						[-15, 0.7, -6.8],
						[-15, 0.7, 1],
						[-21, 0.7, 1],
					],
					green,
					4,
				);
			} else if (t >= 245.263 && t < 249.343) {
				text("DISPLAY CONTROLLER", [18, 1, -15], blue, 14);
				text("FRAME COMPLETE", [18, 1.65, -15], green, 17);
				bus(
					[
						[12, 0.7, -15],
						[16, 0.7, -15],
						[18, 0.7, -15],
					],
					green,
					4,
				);
				text("PRESENT → SCANOUT", [18, 2.1, -15], gold, 12);
			}
			return;
		}
		if (rig.world === 2) {
			const on = t >= 61.163;
			text("CMOS / FINFET", [0, 2.1, 0], blue, 13);
			text(on ? "A = 1" : "A = 0", [0, 1.65, 1.2], gold, 21);
			text(on ? "Y = 0" : "Y = 1", [1.8, 1.6, 0], on ? blue : green, 21);
			text("pMOS", [0, 0.95, 1.8], on ? "#82929c" : green, 12);
			text("nMOS", [0, 0.95, -1.8], on ? green : "#82929c", 12);
			text("VDD", [-2.5, 1.5, 2], gold, 11);
			text("GND", [-2.5, 1.5, -2], blue, 11);
			const z = on ? -1 : 1;
			line(
				[
					[-1.9, 0.5, z],
					[-0.3, 0.5, z],
					[0.3, 0.5, z],
					[1.9, 0.5, z],
				],
				green,
				0.7,
				2.2,
			);
			packet(
				[
					[-1.9, 0.5, z],
					[1.9, 0.5, z],
				],
				clock.phase,
				green,
				0.8,
			);
			if (t > 61.163 && t < 63.903) {
				text("SOURCE", [-1.4, 0.95, z], blue, 11);
				text("GATE", [0, 1.4, z], gold, 12);
				text("DRAIN", [1.4, 0.95, z], blue, 11);
			}
			return;
		}
		if (rig.world === 3) {
			text("OLED / P", [0, 1.2, 0], blue, 13);
			if (tr)
				text(
					"RGB " +
						tr.lanes
							.find((l) => l.pixel[0] === tr.pixel[0])!
							.bytes.join(" · "),
					[0, 1.65, 0],
					gold,
					18,
				);
			return;
		}
		if (rig.world === 4) {
			if (!tr) return;
			if (t < 114) {
				text("CONTINUOUS → DISCRETE", [0, 7.6, -12], blue, 15);
				text("d → coverage(d)", [0, 7, -12], gold, 19);
				for (let i = 0; i < 4; i++) {
					const a = tr.lanes[i].coverage,
						x = (i - 1.5) * 0.9;
					text("P" + i, [x, 4.5, -11.8], gold, 13);
					text(
						a.toFixed(3),
						[x, 3.8, -11.8],
						a > 0 ? green : blue,
						14,
					);
					line(
						[
							[x - 0.28, 3.3, -11.8],
							[x + 0.28, 3.3, -11.8],
						],
						a > 0 ? green : blue,
						0.9,
						3,
					);
				}
			} else if (t >= 202.083 && t < 216.383) {
				const sep = ease(202, 206, t) * (1 - ease(212, 216, t));
				text("BACKGROUND", [-sep * 7.5, 6.5, -14], blue, 12);
				text("COVERAGE", [0, 7 + sep * 0.5, -12], gold, 12);
				text("REFRACTION + MIX", [sep * 7.5, 6.5, -10], green, 12);
				const positions: V3[] = [
					[-sep * 7.5, 4, -13.8],
					[0, 4 + sep * 0.5, -11.8],
					[sep * 7.5, 4, -9.8],
				];
				if (sep > 0.3) {
					line(positions, gold, 0.3, 1.3);
					packet(positions, clock.phase, gold, 0.8);
				}
				text("P / RECORDED RESULT", [0, 1.1, -12], blue, 11);
			} else {
				const progress = 0.18 + 0.82 * ease(151, 241.863, t);
				text(
					t >= 241.863
						? "BACK BUFFER / COMPLETE"
						: "BACK BUFFER / COMET PASS",
					[0, 8.9, -12],
					t >= 241.863 ? green : blue,
					14,
				);
				if (t > 154.343)
					text(
						(progress * 100).toFixed(0) + "%",
						[0, 8.4, -12],
						gold,
						17,
					);
				if (t < 154.343)
					text("P / COMMITTED", [0, 5.4, -11.8], gold, 16);
				// The curve is a stored input, aligned to the same coordinate system.
				if (t > 157 && t < 202) {
					const path = tr.path.map(
						([x, y]) =>
							[
								(x - 0.5) * 14,
								4 + (0.5 - y) * 7.875,
								-11.8,
							] as V3,
					);
					line(path, gold, 0.3, 1.1);
				}
			}
			return;
		}
		// CPU: a small vocabulary of named structures, one active route at a time.
		if (t < 42.083) {
			text("L1I / FETCH", [-7, 0.85, 3], blue, 12);
			text("DECODE", [-1.5, 0.9, 2], blue, 13);
			bus(
				[
					[-7, 0.7, 3],
					[-5, 0.7, 3],
					[-5, 0.7, 2],
					[-1.5, 0.7, 2],
				],
				blue,
				3,
			);
			this.code(t, w, h, span(27.983, 30, 38.903, 42.083, t));
		} else if (t < 56.183) {
			text("PHYSICAL REGISTERS", [4, 0.9, 1], blue, 12);
			text("READY QUEUE", [6, 0.9, 5], green, 12);
			bus(
				[
					[-7, 0.7, 7],
					[-2, 0.7, 7],
					[-2, 0.7, 1],
					[4, 0.7, 1],
				],
				gold,
				3,
			);
			const slots = [42.083, 45.723, 49.343, 52.983];
			for (let i = 0; i < 4; i++) {
				const ready = t >= slots[i];
				text(
					["P4.xy", "path A", "path B", "stars"][i],
					[4 + (i - 1.5) * 0.7, 1.7, 1],
					ready ? gold : "#5b7587",
					11,
				);
			}
			if (t > 49.343)
				bus(
					[
						[4, 0.7, 1],
						[4, 0.7, 5],
						[6, 0.7, 5],
					],
					green,
					2,
				);
		} else if (t < 85.263) {
			if (t < 60.263) text("OPERANDS READY", [6, 1.3, 5], green, 13);
			bus(
				[
					[6, 0.7, 5],
					[10.6, 0.7, 5],
					[10.6, 0.7, -4.5],
					[7, 0.7, -4.5],
				],
				gold,
				4,
			);
			text("DISTANCE / EXECUTE", [7, 1.25, -4.5], gold, 14);
			if (t > 59.803 && t < 60.263) {
				line(
					[
						[6.5, 0.4, -5],
						[7.5, 0.4, -5],
						[7.5, 0.4, -4],
						[6.5, 0.4, -4],
						[6.5, 0.4, -5],
					],
					gold,
					0.7,
					1.6,
				);
				text("STANDARD CELL", [7, 1, -4.5], blue, 11);
			}
			if (tr && t > 63.903) {
				line(
					tr.path.map(
						([x, y]) => [3.7 + x * 6, 0.9, -6 + y * 4] as V3,
					),
					gold,
					0.65,
					1.7,
				);
				text("P4 × STORED CURVE", [7, 1.65, -4.5], blue, 12);
				for (let i = 0; i < 4; i++)
					bus(
						[
							[4.7 + i * 1.3, 0.7, -2.5],
							[4.7 + i * 1.3, 0.7, -6.5],
						],
						i === 0 ? gold : blue,
						2,
						0.65,
					);
			}
		} else if (t < 99.823) {
			if (tr)
				this.values(
					tr,
					t,
					w,
					h,
					"DISTANCE",
					tr.lanes.map((l) => l.distance.toFixed(6)),
				);
			for (let i = 0; i < 4; i++)
				bus(
					[
						[4.7 + i * 1.3, 0.7, -2.5],
						[4.7 + i * 1.3, 0.7, -6.5],
					],
					i === 0 ? gold : blue,
					2,
					0.75,
				);
			text("4 PIXELS / DISTANCE", [7, 1.25, -4.5], gold, 12);
			if (t < 92.543)
				bus(
					[
						[7, 0.8, -4.5],
						[7, 0.8, 1],
						[4, 0.8, 1],
					],
					gold,
					4,
				);
			else
				bus(
					[
						[4, 0.8, 1],
						[10.6, 0.8, 1],
						[10.6, 0.8, -4.5],
						[7, 0.8, -4.5],
					],
					green,
					4,
				);
		} else if (t < 139.803) {
			const decision = t >= 121.623,
				fork: V3 = [-3.4, 0.9, -4.8];
			const wrong: V3[] = [
				fork,
				[-6, 0.9, -4.8],
				[-6, 0.9, 2],
				[-1.5, 0.9, 2],
			];
			const compare: V3[] = [[7, 0.9, -4.5], [1, 0.9, -4.5], fork];
			const correct: V3[] = [
				fork,
				[-1.5, 0.9, -4.8],
				[-1.5, 0.9, 2],
				[2, 0.9, 2],
				[7, 0.9, -4.5],
			];
			const squash = ease(121.623, 125.263, t);
			line(wrong, decision ? "#ff8295" : blue, 0.6 * (1 - squash), 1.5);
			if (!decision)
				packet(
					wrong,
					((t - 114.343) / 7.28) % 1,
					blue,
					0.7,
					"NEXT P4?",
				);
			if (t >= 117.983 && t < 122.2) {
				line(compare, gold, 0.3, 1.4);
				packet(compare, ease(117.983, 121.623, t), gold, 1, "MASK");
			}
			text(
				decision ? "all(a == 0) = FALSE" : "PREDICT / BACKGROUND",
				[-3.4, 2, -4.8],
				decision ? gold : blue,
				16,
			);
			if (decision) {
				for (let i = 0; i < 4; i++) {
					const p = this.path(wrong, (i + 1) / 5);
					p[1] += squash * (0.7 + i * 0.3);
					text("μ" + i, p, "#ff91a5", 12, (1 - squash) * 0.9);
				}
				text(
					t < 129.083 ? "SQUASH YOUNGER μOPS" : "FETCH GLASS PATH",
					[-1.5, 1.7, 2],
					t < 129.083 ? "#ff9aaa" : green,
					13,
				);
				if (t > 129.083) {
					line(correct, green, 0.4, 1.6);
					packet(
						correct,
						ease(129.083, 139.803, t),
						green,
						1,
						"SHADE",
					);
				}
			}
		} else if (t < 151.163) {
			if (tr) {
				const lane = tr.lanes.find((l) => l.pixel[0] === tr.pixel[0])!;
				const color =
					"#" +
					lane.bytes
						.map((n) => n.toString(16).padStart(2, "0"))
						.join("");
				text(
					t < 143.443 ? "REFRACT → MIX" : "RETIRE → STORE",
					[7, 1.2, -4.5],
					gold,
					14,
				);
				text(
					"P / RGB " + lane.bytes.join(" "),
					[0.8, 1.6, -6.8],
					color,
					17,
				);
				const path: V3[] = [
					[7, 0.8, -4.5],
					[4, 0.8, -4.5],
					[4, 0.8, -6.8],
					[0.8, 0.8, -6.8],
				];
				line(path, color, 0.4, 1.7);
				packet(path, ease(139.803, 147.083, t), color, 1);
				if (t > 147.083) text("COMMITTED", [0.8, 2.1, -6.8], green, 14);
			}
		} else {
			// Subsequent iterations: queue → vector arithmetic → ordered store.
			const montage = t >= 189.343 && t < 198.443;
			const phase = clock.index % 12;
			const path: V3[] =
				phase < 4
					? [
							[4, 0.7, 1],
							[4, 0.7, 5],
							[6, 0.7, 5],
						]
					: phase < 8
						? [
								[6, 0.7, 5],
								[10.6, 0.7, 5],
								[10.6, 0.7, -4.5],
								[7, 0.7, -4.5],
							]
						: [
								[7, 0.7, -4.5],
								[4, 0.7, -4.5],
								[4, 0.7, -6.8],
								[0.8, 0.7, -6.8],
							];
			bus(
				path,
				phase < 4 ? blue : phase < 8 ? gold : green,
				montage ? 5 : 3,
				0.9,
			);
			const label =
				rig.target[2] > 2
					? "NEXT P4 / READY"
					: rig.target[2] < -6
						? "RETIRE / STORE"
						: "DISTANCE → COVERAGE → SHADE";
			text(
				label,
				[rig.target[0], 1.4, rig.target[2]],
				phase < 8 ? gold : green,
				13,
			);
			if (tr && t > 216.383 && t < 227.083)
				this.values(
					tr,
					t,
					w,
					h,
					"COLOR / FOUR PIXELS",
					tr.lanes.map((l) =>
						l.bytes
							.map((n) => n.toString(16).padStart(2, "0"))
							.join("")
							.toUpperCase(),
					),
				);
		}
		c.globalAlpha = 1;
	}
	path(points: V3[], u: number): V3 {
		const lengths = points
				.slice(1)
				.map((p, i) =>
					Math.hypot(...p.map((v, j) => v - points[i][j])),
				),
			total = lengths.reduce((a, b) => a + b, 0);
		let d = u * total;
		for (let i = 0; i < lengths.length; i++) {
			if (d <= lengths[i] || i === lengths.length - 1)
				return mix(points[i], points[i + 1], d / lengths[i]);
			d -= lengths[i];
		}
		return points[0];
	}
	code(t: number, w: number, h: number, alpha: number) {
		if (alpha < 0.01) return;
		const c = this.ctx,
			size = Math.max(12, Math.min(22, w * 0.024)),
			decode = ease(31.623, 38.903, t);
		const original = [programSource[2], programSource[3], programSource[4]],
			ops = [
				"LOAD / path, stars",
				"DIST / P4.xy, curve",
				"CMP / coverage mask",
			];
		c.save();
		c.translate(w * 0.16, h * 0.24);
		c.transform(1, -0.035, 0.07, 1, 0, 0);
		c.textAlign = "left";
		c.shadowColor = "#020812";
		c.shadowBlur = 12;
		for (let i = 0; i < 3; i++) {
			c.font = `${size}px Consolas,monospace`;
			c.fillStyle =
				i === Math.floor((t - 27.983) / 3.64) % 3 ? gold : blue;
			c.globalAlpha = alpha * Math.max(0, 1 - decode * 2.2);
			c.fillText(original[i].trim(), -decode * 40, i * size * 2.3);
			c.globalAlpha = alpha * Math.max(0, (decode - 0.5) * 2);
			c.fillText(ops[i], (1 - decode) * 40, i * size * 2.3);
		}
		c.restore();
		c.globalAlpha = 1;
	}
	values(
		tr: ProgramTrace,
		t: number,
		w: number,
		h: number,
		title: string,
		values: string[],
	) {
		const c = this.ctx,
			size = Math.max(11, Math.min(24, w * 0.027)),
			x = w * 0.5,
			y = h * 0.27,
			clock = transport(t);
		c.textAlign = "center";
		c.shadowColor = "#020812";
		c.shadowBlur = 10;
		c.font = "11px Consolas,monospace";
		c.fillStyle = blue;
		c.fillText(title, x, y - size * 2);
		values.forEach((value, i) => {
			const xx = x + (i - 1.5) * Math.min(180, w * 0.21),
				yy = y + (i % 2) * 5;
			c.font = `${size}px Consolas,monospace`;
			c.fillStyle = i === clock.index % 4 ? gold : "#b6dae8";
			c.fillText(value, xx, yy);
			c.font = "10px Consolas,monospace";
			c.fillText("P" + i, xx, yy + size * 1.5);
		});
		c.font = "10px Consolas,monospace";
		c.fillStyle = "#92b4c3";
		c.fillText("P (" + tr.pixel.join(", ") + ")", x, y + size * 3);
		c.shadowBlur = 0;
	}
}
