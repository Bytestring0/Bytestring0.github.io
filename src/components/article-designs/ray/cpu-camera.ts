export type V3 = [number, number, number];
type Frame = { time: number; eye: V3; target: V3; roll: number; world: number };
const frame = (
	time: number,
	eye: V3,
	target: V3,
	roll = 0,
	world = 1,
): Frame => ({
	time,
	eye,
	target,
	roll,
	world,
});
// One score-driven rig travels through capture, network, retrieval, compute
// and output spaces. Each musical phrase has its own shot size. Time-aware
// Hermite tangents avoid changes of velocity at unequal musical phrase lengths.
const frames = [
	frame(0, [9, 7, 15], [0, 4, 2], -0.06, 5),
	frame(4.07, [0, 4.6, 13], [0, 4, 2], 0, 5),
	frame(8.583, [-5, 6, 10], [0, 4, 2], 0.06, 5),
	frame(11.763, [2, 4.5, 7], [0, 4, 1], -0.04, 5),
	frame(16.623, [7, 7, 3], [0, 4, -1], 0.05, 5),
	frame(20.263, [0, 4.4, 1], [0, 4, -1], 0, 5),
	frame(24.803, [-5, 3, 2], [0, 3, -1], -0.04, 5),
	frame(27.983, [10, 7, 12], [0, 4, 0], -0.08, 8),
	frame(31.623, [6, 5, 8], [0, 4, 0], 0.04, 8),
	frame(35.263, [1, 4.5, 8], [0, 4, 0], 0, 8),
	frame(38.903, [-7, 6, 10], [0, 4, 0], -0.04, 8),
	frame(42.083, [5, 7, 15], [0, 4, -5], -0.04, 10),
	frame(45.723, [2, 5, 8], [0, 4, -5], 0.04, 10),
	frame(49.343, [1, 4, 4], [0, 4, -5], -0.04, 10),
	frame(52.983, [-2, 5, 1], [0, 4, -6], 0.05, 10),
	frame(56.183, [7, 7, 9], [0, 4, 0], -0.05, 11),
	frame(59.803, [0, 4.8, 6], [0, 4, 0], 0.025, 11),
	frame(63.903, [-10, 7, 10], [0, 4, 0], -0.04, 8),
	frame(67.523, [4, 5, 9], [0, 4, 0], 0.04, 8),
	frame(71.163, [13, 6, -2], [8, 4, 0], -0.07, 6),
	frame(74.803, [7, 10, -12], [0, 5, 0], 0.08, 6),
	frame(78.443, [-9, 6, -6], [-7, 4, -3], -0.06, 6),
	frame(82.083, [-15, 12, 9], [0, 5, 0], 0.06, 6),
	frame(85.263, [0, 5, 24], [0, 5, -16], 0, 6),
	frame(88.903, [0.4, 5, 8], [0, 5, -15], -0.015, 6),
	frame(92.543, [12, 9, 17], [0, 4, 0], -0.04, 7),
	frame(96.183, [6, 5, 12], [0, 4, 0], 0.05, 7),
	frame(99.823, [-10, 7, 13], [0, 4, 0], -0.06, 7),
	frame(103.463, [-6, 5, 9], [0, 4, -2], 0.04, 7),
	frame(107.103, [0, 4, 10], [0, 4, -3], 0, 7),
	frame(110.743, [9, 7, 8], [0, 4, 0], -0.04, 7),
	frame(114.343, [8, 7, 12], [0, 4, 0], 0.04, 8),
	frame(117.983, [5, 3, 9], [0, 4, 0], -0.03, 8),
	frame(121.623, [-8, 8, 9], [0, 3, -2], 0.04, 8),
	frame(125.263, [-4, 3, 10], [0, 2, -3], -0.04, 8),
	frame(129.083, [7, 7, 10], [0, 4, 0], -0.04, 12),
	frame(132.543, [0, 4.5, 7], [0, 4, 0], 0.02, 12),
	frame(136.183, [-4, 5, 6], [0, 4, 0], -0.03, 12),
	frame(139.803, [-8, 4, 7], [-1.5, 0.4, 2], -0.05, 1),
	frame(141.623, [6, 3, 5], [4, 0.4, 1], 0.04, 1),
	frame(143.443, [10, 5, -1], [7, 0.4, -4.5], -0.06, 1),
	frame(145.263, [7, 10, 1], [7, 0.4, -4.5], 0.06, 1),
	frame(147.083, [1, 3, -5], [0.8, 0.4, -6.8], 0.02, 1),
	frame(148.903, [5, 4, -2], [0.8, 0.4, -6.8], -0.04, 1),
	frame(151.163, [0, 21, 23], [0, 4, -10], -0.015, 9),
	frame(154.343, [-10, 17, 13], [0, 4, -10], 0.025, 9),
	frame(157.523, [10, 11, 12], [0, 4, 0], -0.04, 13),
	frame(161.163, [5, 8, 9], [0, 4, 0], 0.04, 13),
	frame(164.803, [-5, 8, 8], [0, 4, 0], -0.04, 13),
	frame(168.443, [0, 6, 9], [0, 4, 0], 0.025, 13),
	frame(172.543, [9, 8, 13], [0, 4, 0], -0.05, 14),
	frame(176.183, [4, 7, 11], [0, 4, 0], 0.03, 14),
	frame(179.823, [-7, 6, 10], [0, 4, 0], -0.025, 14),
	frame(183.463, [-5, 9, 12], [0, 4, 0], 0.03, 14),
	frame(187.523, [0, 4, 4], [0, 4, -5], 0, 10),
	frame(189.343, [0, 5, 7], [0, 5, -15], 0.025, 6),
	frame(191.163, [6, 6, 12], [0, 4, 0], -0.04, 7),
	frame(192.983, [9, 4, -1], [7, 0.4, -4.5], 0.06, 1),
	frame(194.803, [1, 3, -4], [0.8, 0.4, -6.8], -0.06, 1),
	frame(196.623, [-7, 8, 9], [0, 4, 0], 0.035, 13),
	frame(198.443, [4, 5, 9], [0, 4, 0], -0.025, 14),
	frame(200.263, [-4, 5, 7], [0, 4, 0], 0.025, 12),
	frame(202.083, [13, 8, 14], [0, 4, -1], -0.04, 9),
	frame(205.723, [-8, 6, 12], [0, 4, -1], 0.03, 9),
	frame(209.363, [-3, 5, 7], [2, 4, -1], -0.035, 9),
	frame(213.003, [8, 8, 10], [1, 4, -1], 0.04, 9),
	frame(216.383, [11, 9, 12], [0, 4, 0], -0.045, 14),
	frame(220.023, [-6, 6, 11], [0, 4, 0], 0.035, 7),
	frame(223.663, [10, 7, -1], [7, 0.4, -4.5], -0.07, 1),
	frame(225.483, [6, 3, -1], [7, 0.4, -4.5], 0.07, 1),
	frame(227.083, [8, 8, 12], [0, 4, 0], -0.04, 16),
	frame(230.943, [0, 9, 23], [0, 4, -5], 0, 9),
	frame(234.583, [-8, 8, 19], [0, 4, -5], -0.045, 9),
	frame(238.223, [3, 5, 15], [0, 4, -5], 0.025, 9),
	frame(241.863, [0, 4, 14], [0, 4, -5], 0, 9),
	frame(245.263, [20, 4, -10], [18, 0.4, -15], -0.05, 0),
	frame(247.083, [18, 2, -12], [18, 0.4, -15], 0.04, 0),
	frame(249.343, [3, 6, 4], [0, 4, 0], -0.025, 3),
	frame(251.163, [0.7, 4.8, 2.8], [0, 4, 0], 0, 3),
	frame(252.063, [0, 6, -8], [0, 6, -20], 0, 0),
	frame(255.723, [-2, 6.5, -7], [0, 6, -20], -0.02, 0),
	frame(263.003, [-6, 8, -4], [0, 6, -20], -0.025, 0),
	frame(270.283, [2, 7, -3], [0, 6, -20], 0.02, 0),
	frame(281.152, [8, 9, 1], [0, 6, -20], 0, 0),
];
const sub = (a: V3, b: V3): V3 => a.map((v, i) => v - b[i]) as V3;
export const dot = (a: V3, b: V3) => a.reduce((s, v, i) => s + v * b[i], 0);
export const norm = (v: V3): V3 => {
	const length = Math.hypot(...v) || 1;
	return v.map((x) => x / length) as V3;
};
export const cross = (a: V3, b: V3): V3 => [
	a[1] * b[2] - a[2] * b[1],
	a[2] * b[0] - a[0] * b[2],
	a[0] * b[1] - a[1] * b[0],
];
export function cpuCamera(time: number, aspect = 16 / 9) {
	let index = 0;
	for (let i = 0; i < frames.length - 1; i++)
		if (time >= frames[i].time) index = i;
	index = Math.min(index, frames.length - 2);
	const a = frames[index],
		next = frames[index + 1];
	const b = next.world === a.world ? next : { ...a, time: next.time };
	const previous = frames[Math.max(0, index - 1)],
		following = frames[Math.min(frames.length - 1, index + 2)];
	const before = previous.world === a.world ? previous : a;
	const after = following.world === a.world ? following : b;
	const duration = b.time - a.time,
		linear = Math.max(0, Math.min(1, (time - a.time) / duration)),
		// Identical endpoint slopes preserve continuous velocity through each
		// phrase, while the middle of the move accelerates into the next detail.
		u = linear - (Math.sin(linear * Math.PI * 2) * 0.65) / (Math.PI * 2),
		u2 = u * u,
		u3 = u2 * u;
	const interpolate = (key: "eye" | "target"): V3 =>
		a[key].map((v, i) => {
			const m0 = (b[key][i] - before[key][i]) / (b.time - before.time),
				m1 = (after[key][i] - a[key][i]) / (after.time - a.time);
			return (
				(2 * u3 - 3 * u2 + 1) * v +
				(u3 - 2 * u2 + u) * duration * m0 +
				(-2 * u3 + 3 * u2) * b[key][i] +
				(u3 - u2) * duration * m1
			);
		}) as V3;
	const eye = interpolate("eye");
	eye[1] = Math.max(1.6, eye[1]);
	const target = interpolate("target"),
		roll = a.roll + (b.roll - a.roll) * (u * u * (3 - 2 * u));
	const forward = norm(sub(target, eye)),
		right = norm(cross(forward, [0, 1, 0])),
		up = cross(right, forward);
	const age = time - a.time,
		remaining = next.time - time;
	const cut =
		a.time !== 252.063 && previous.world !== a.world && age < 0.09
			? 1 - age / 0.09
			: next.world !== a.world && remaining < 0.09
				? 1 - remaining / 0.09
				: 0;
	return {
		eye,
		target,
		roll,
		forward,
		right,
		up,
		world: a.world,
		cut,
		shot: index,
		lens: Math.min(0.9, aspect * 0.65),
	};
}
export type CpuCamera = ReturnType<typeof cpuCamera>;
export function project(
	p: V3,
	camera: CpuCamera,
	width: number,
	height: number,
) {
	const q = sub(p, camera.eye),
		depth = dot(q, camera.forward);
	if (depth < 0.15) return null;
	let x = (dot(q, camera.right) / depth) * height * camera.lens,
		y = (-dot(q, camera.up) / depth) * height * camera.lens;
	const c = Math.cos(camera.roll),
		s = Math.sin(camera.roll),
		rx = x * c - y * s,
		ry = x * s + y * c;
	return {
		x: width / 2 + rx,
		y: height / 2 + ry,
		scale: (height * camera.lens) / depth,
		depth,
	};
}
