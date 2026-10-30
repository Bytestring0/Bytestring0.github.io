export interface OverviewItem {
	name: string;
	url: string;
	external?: boolean;
}
export interface OverviewGroup {
	id: string;
	name: string;
	url: string;
	items: OverviewItem[];
}
const regions = [
	{ x: 80, y: 100, width: 1220, columns: 5, step: 220 },
	{ x: 1880, y: 80, width: 1740, columns: 8, step: 200 },
	{ x: 110, y: 1120, width: 1100, columns: 3, step: 270 },
	{ x: 1900, y: 1620, width: 1420, columns: 4, step: 290 },
];
function hash(value: string) {
	let seed = 2166136261;
	for (const char of value)
		seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
	return (seed >>> 0) / 4294967295;
}
export function layoutOverview(groups: OverviewGroup[]) {
	const layout = groups.map((group, index) => {
		const region = regions[index];
		const columns = Math.min(
			region.columns,
			Math.max(1, group.items.length),
		);
		const rows =
			Math.ceil(group.items.length / columns) +
			(group.items.length > 3 ? 1 : 0);
		const slots = Array.from({ length: rows * columns }, (_, i) => i).sort(
			(a, b) =>
				hash(`${group.id}:slot:${a}`) - hash(`${group.id}:slot:${b}`),
		);
		const height = Math.max(320, rows * 140 + 170);
		const nodes = group.items.map((item, i) => {
			const slot = slots[i],
				row = Math.floor(slot / columns),
				col = slot % columns;
			const labelWidth = index === 1 ? 132 : 180;
			const offset =
				(region.width - (columns - 1) * region.step - labelWidth) / 2 +
				6;
			const x =
				offset +
				col * region.step +
				Math.sin(row * 1.71) * 6 +
				(hash(`${item.name}:x`) - 0.5) * 22;
			const y =
				140 +
				row * 140 +
				Math.sin(col * 1.9) * 22 +
				(hash(`${item.name}:y`) - 0.5) * 16;
			return { ...item, x, y, labelWidth, phase: hash(item.name) * 12 };
		});

		const edges: { a: number; b: number }[] = [];
		const used = new Set<number>(),
			distances = nodes.map(() => Infinity),
			parents = nodes.map(() => -1);
		if (nodes.length) distances[0] = 0;
		for (let step = 0; step < nodes.length; step++) {
			let current = -1;
			for (let i = 0; i < nodes.length; i++)
				if (
					!used.has(i) &&
					(current < 0 || distances[i] < distances[current])
				)
					current = i;
			used.add(current);
			if (parents[current] >= 0)
				edges.push({ a: parents[current], b: current });
			for (let j = 0; j < nodes.length; j++) {
				if (used.has(j)) continue;
				const distance =
					(nodes[current].x - nodes[j].x) ** 2 +
					(nodes[current].y - nodes[j].y) ** 2;
				if (distance < distances[j]) {
					distances[j] = distance;
					parents[j] = current;
				}
			}
		}

		return { ...group, ...region, height, nodes, edges };
	});
	if (layout[2])
		layout[2].y = Math.max(1080, layout[0].y + layout[0].height + 320);
	if (layout[3])
		layout[3].y = Math.max(1140, layout[1].y + layout[1].height + 320);
	return layout;
}
export const OVERVIEW_WIDTH = 2420;
export const OVERVIEW_HEIGHT = 1700;
