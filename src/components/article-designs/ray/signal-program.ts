// A deterministic signal/retrieval prologue to the renderer. The film expands
// these operations in time; it does not imply a live network or trained LLM.
export type SignalTrace = {
	id: string;
	samples: [number, number][];
	received: boolean[];
	candidates: [number, number][][];
	attention: number[];
	selected: number;
	query: number[];
};
export function recoverSignal(path: [number, number][]) {
	const candidates = [
		path,
		path.map(([x, y]) => [x, 1 - y] as [number, number]),
		path.map(([x, y]) => [1 - x, y] as [number, number]),
	];
	const samples = Array.from({ length: 16 }, (_, i) => {
		const p = path[Math.round((i * (path.length - 1)) / 15)];
		return p.map((v) => Math.round(v * 1023) / 1023) as [number, number];
	});
	const received = samples.map((_, i) => ![4, 5, 9, 12].includes(i));
	const query = samples.flatMap((p, i) => (received[i] ? p : [0, 0]));
	// Fixed memory prototypes form a radial-basis retrieval layer. Missing
	// samples are masked rather than invented; all weights below are real.
	const logits = candidates.map((candidate) => {
		let error = 0,
			count = 0;
		samples.forEach((p, i) => {
			if (!received[i]) return;
			const q = candidate[Math.round((i * (candidate.length - 1)) / 15)];
			error += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
			count++;
		});
		return (-32 * error) / count;
	});
	const maximum = Math.max(...logits),
		weights = logits.map((v) => Math.exp(v - maximum));
	const total = weights.reduce((a, b) => a + b, 0),
		attention = weights.map((v) => v / total);
	const selected = attention.indexOf(Math.max(...attention));
	let checksum = 2166136261;
	for (const p of samples)
		for (const v of p)
			checksum =
				Math.imul(checksum ^ Math.round(v * 1023), 16777619) >>> 0;
	const trace: SignalTrace = {
		id: checksum.toString(16).toUpperCase().padStart(8, "0"),
		samples,
		received,
		candidates,
		attention,
		selected,
		query,
	};
	return { path: candidates[selected], trace };
}
