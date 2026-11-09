export interface DatedItem {
	id: string;
	date: string;
}
export interface TimelineItem {
	id: string;
	x: number;
	y: number;
	month: string;
	lane: number;
}
export interface TimelineMonth {
	key: string;
	x: number;
	width: number;
	yearStart: boolean;
}
export interface TimelineModel {
	items: TimelineItem[];
	months: TimelineMonth[];
	width: number;
	height: number;
}
export const CARD_WIDTH = 282;
export const CARD_HEIGHT = 156;
const LANES = [-122, 122];
const COLUMN_WIDTH = 318;
/** Month widths expand with density, so cards never overlap or invent dates. */
export function buildTimeline(input: ReadonlyArray<DatedItem>): TimelineModel {
	const sorted = input
		.filter(
			(item) =>
				/^\d{4}-\d{2}-\d{2}/.test(item.date) &&
				Number.isFinite(Date.parse(item.date)),
		)
		.slice()
		.sort(
			(a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
		);
	const buckets = new Map<string, DatedItem[]>();
	for (const item of sorted) {
		const month = item.date.slice(0, 7);
		const bucket = buckets.get(month) || [];
		bucket.push(item);
		buckets.set(month, bucket);
	}
	const items: TimelineItem[] = [],
		months: TimelineMonth[] = [];
	let cursor = 100,
		previousYear = "";
	for (const [key, bucket] of buckets) {
		const width = Math.ceil(bucket.length / LANES.length) * COLUMN_WIDTH + 96;
		months.push({
			key,
			x: cursor,
			width,
			yearStart: key.slice(0, 4) !== previousYear,
		});
		previousYear = key.slice(0, 4);
		bucket.forEach((item, i) =>
			items.push({
				id: item.id,
				x: cursor + 62 + Math.floor(i / LANES.length) * COLUMN_WIDTH,
				y: LANES[i % LANES.length] - CARD_HEIGHT / 2,
				month: key,
				lane: i % LANES.length,
			}),
		);
		cursor += width;
	}
	return { items, months, width: Math.max(620, cursor + 100), height: 840 };
}
