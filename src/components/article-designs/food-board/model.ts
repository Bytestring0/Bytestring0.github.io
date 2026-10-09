export const tiers = ["夯", "顶级", "人上人", "NPC", "拉完了"] as const;
export const criteria = {
	delivery: "配送",
	taste: "口味",
	price: "性价比",
	packaging: "包装",
};
export type Tier = (typeof tiers)[number];
export type FoodCard = {
	id: string;
	name: string;
	imageUrl: string;
	imageDisplay?: string;
	summary: string;
	ratings: Record<keyof typeof criteria, number>;
	overall: { score: number | null; tier: Tier };
	layout: { rotation: number; order: number };
};
export function parseMetadata(markdown: string): FoodCard[] {
	const fence = markdown.match(/```json\s*([\s\S]*?)```/i)?.[1];
	if (!fence) throw new Error("文章缺少 JSON 卡片元数据");
	// The author's legacy format wraps comma-separated objects in braces and
	// uses Windows image paths. Normalize a copy; never rewrite the source.
	let json = fence
		.trim()
		.replace(
			/("imageUrl"\s*:\s*")([^"\n]*)(")/g,
			(_, start, value, end) => start + value.replace(/\\+/g, "/") + end,
		);
	json = json.replace(/,\s*([}\]])/g, "$1");
	json = json.replace(/("score"\s*:)\s*(?=[,}])/g, "$1 null");
	let records: FoodCard[] | undefined;
	try {
		const parsed = JSON.parse(json);
		records = Array.isArray(parsed) ? parsed : parsed.cards || parsed.items;
	} catch {
		// Read complete card objects even if the outer legacy brace is missing.
		records = [];
		const starts = json.matchAll(/\{\s*"name"\s*:/g);
		for (const match of starts) {
			let depth = 0,
				quoted = false,
				escaped = false;
			for (let i = match.index!; i < json.length; i++) {
				const char = json[i];
				if (quoted) {
					if (escaped) escaped = false;
					else if (char === "\\") escaped = true;
					else if (char === '"') quoted = false;
				} else if (char === '"') quoted = true;
				else if (char === "{") depth++;
				else if (char === "}" && --depth === 0) {
					records.push(JSON.parse(json.slice(match.index, i + 1)));
					break;
				}
			}
		}
	}
	if (!Array.isArray(records))
		throw new Error("卡片元数据需要数组、cards 或 items 字段");
	const seen = new Set<string>();
	return records
		.filter((record) => {
			const fingerprint = JSON.stringify(record);
			if (seen.has(fingerprint)) return false;
			seen.add(fingerprint);
			return true;
		})
		.map((record, index) => ({
			...record,
			id: record.id || `food-${index}`,
			layout: record.layout || {
				order: index,
				rotation: [-3, 2.5, -1.8, 3.2, -2.2][index % 5],
			},
		}));
}
export const escapeHtml = (value: unknown) =>
	String(value ?? "").replace(
		/[&<>"']/g,
		(char) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[char]!,
	);
export function safeImage(value: string): string {
	return /^(https?:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp|gif);base64,)/i.test(
		value,
	)
		? value
		: "";
}
export const qualitative = (score: number | null) =>
	score === null
		? "尚未评价"
		: score >= 4.5
			? "强烈推荐"
			: score >= 3.5
				? "值得一试"
				: score >= 2.5
					? "中规中矩"
					: score >= 1.5
						? "有待提升"
						: "不太推荐";
export function meter(
	score: number | null,
	label: string,
	stars = false,
): string {
	const percent = Math.max(0, Math.min(100, (score ?? 0) * 20));
	return `<span class="rating-indicator ${stars ? "stars" : "bar"}" role="img" aria-label="${escapeHtml(label)}：${qualitative(score)}" title="${qualitative(score)}"><span style="width:${percent}%">${stars ? "★★★★★" : ""}</span>${stars ? '<i aria-hidden="true">★★★★★</i>' : ""}</span>`;
}
export function cardHtml(card: FoodCard): string {
	const image = safeImage(card.imageDisplay || card.imageUrl);
	return `<article class="postcard" data-card-id="${escapeHtml(card.id)}" style="--tilt:${card.layout.rotation}deg" tabindex="0" aria-label="${escapeHtml(card.name)}，${card.overall.tier}；按回车展开评价">
    <div class="postcard-face"><div class="photo">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(card.name)}" loading="lazy" draggable="false" />` : '<span class="photo-empty" aria-label="暂无图片">食</span>'}<span class="photo-fallback" hidden>食</span></div>
    <div class="card-caption"><h3>${escapeHtml(card.name)}</h3><button type="button" class="drag-handle" aria-label="拖动${escapeHtml(card.name)}" title="按住拖拽 · 使用方向键移动">⠿</button></div></div>
    <div class="card-details"><div class="details-inner"><div class="overall-line"><span>综合印象</span>${meter(card.overall.score, "综合印象", true)}</div>
    <div class="rating-list">${Object.entries(criteria)
		.map(
			([key, label]) =>
				`<div><span>${label}</span>${meter(card.ratings[key as keyof typeof criteria], label)}</div>`,
		)
		.join("")}</div>
    <p class="card-summary">${escapeHtml(card.summary)}</p><label class="tier-control">移至<select data-tier-select aria-label="${escapeHtml(card.name)}的档位">${tiers.map((tier) => `<option${tier === card.overall.tier ? " selected" : ""}>${tier}</option>`).join("")}</select></label><button type="button" class="edit-card" data-edit-card>编辑 / 补图 ↗</button></div></div>
  </article>`;
}
export function rankingHtml(cards: FoodCard[]): string {
	return [...cards]
		.sort(
			(a, b) =>
				(b.overall.score ?? -1) - (a.overall.score ?? -1) ||
				a.layout.order - b.layout.order,
		)
		.map((card, index) => {
			const image = safeImage(card.imageDisplay || card.imageUrl);
			return `<li class="rank-row"><span class="rank-number">${String(index + 1).padStart(2, "0")}</span>${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" />` : '<span class="rank-placeholder">食</span>'}<div class="rank-copy"><strong>${escapeHtml(card.name)}</strong><p>${escapeHtml(card.summary)}</p></div><span class="rank-tier" data-tier="${card.overall.tier}">${card.overall.tier}</span><div class="rank-score">${meter(card.overall.score, "综合印象", true)}<small>${qualitative(card.overall.score)}</small></div></li>`;
		})
		.join("");
}
