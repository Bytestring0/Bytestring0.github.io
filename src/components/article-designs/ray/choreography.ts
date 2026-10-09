import analysis from "./analysis.json";
export const ease = (a: number, b: number, t: number) => {
	const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
	return u * u * (3 - 2 * u);
};
export const span = (a: number, b: number, c: number, d: number, t: number) =>
	ease(a, b, t) * (1 - ease(c, d, t));
// Snap the pulse grid to nearby measured events. These are audio-clock times,
// not rAF intervals; arbitrary seeking produces the same transport position.
export const beats = Array.from({ length: 620 }, (_, i) => {
	const expected = 0.2559 + (i * 60) / 132;
	const candidates = analysis.onsets.filter(
		([t, s]) => Math.abs(t - expected) < 0.12 && s > 0.075,
	);
	return (
		candidates.sort(
			(a, b) =>
				b[1] -
				Math.abs(b[0] - expected) * 2 -
				(a[1] - Math.abs(a[0] - expected) * 2),
		)[0]?.[0] ?? expected
	);
});
export function transport(t: number) {
	let lo = 0,
		hi = beats.length - 1;
	while (lo < hi) {
		const m = Math.ceil((lo + hi) / 2);
		if (beats[m] <= t) lo = m;
		else hi = m - 1;
	}
	const next = beats[Math.min(lo + 1, beats.length - 1)],
		prev = beats[lo];
	return {
		index: lo,
		phase: Math.max(
			0,
			Math.min(1, (t - prev) / Math.max(0.01, next - prev)),
		),
		impact: Math.exp(-Math.max(0, t - prev) * 22),
	};
}
