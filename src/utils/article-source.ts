import { parse, HTMLElement, NodeType, type Node } from "node-html-parser";

export interface SourceBlock {
	id: string;
	html: string;
	text: string;
	tag: string;
	headingId?: string;
}

export interface ArticleSource {
	html: string;
	blocks: SourceBlock[];
}

export function groupArticleBlocks(
	article: ArticleSource,
	depth = 2,
): SourceBlock[][] {
	const groups: SourceBlock[][] = [];
	for (const block of article.blocks) {
		if (
			!groups.length ||
			(block.headingId && Number(block.tag.slice(1)) <= depth)
		)
			groups.push([]);
		groups[groups.length - 1].push(block);
	}
	return groups;
}

// Only unwrap remark-sectionize's structural sections. Keep code, math, tables,
// MDX islands and their assets intact; they still come from Astro's renderer.
export function splitArticleSource(html: string): ArticleSource {
	const blocks: SourceBlock[] = [];
	function visit(node: Node) {
		if (
			node instanceof HTMLElement &&
			node.rawTagName === "section" &&
			Object.keys(node.attributes).length === 0
		) {
			node.childNodes.forEach(visit);
			return;
		}
		if (node.nodeType === NodeType.TEXT_NODE && !node.textContent.trim())
			return;
		blocks.push({
			id: `b${blocks.length}`,
			html: node.toString(),
			text: node.textContent,
			tag: node instanceof HTMLElement ? node.rawTagName : "text",
			headingId:
				node instanceof HTMLElement && /^h[1-6]$/.test(node.rawTagName)
					? node.id
					: undefined,
		});
	}
	parse(html, { comment: true }).childNodes.forEach(visit);
	return { html, blocks };
}

const protectedSelector =
	"pre, code, math, img, picture, video, audio, source, iframe, table, svg, script, style, link";

// Compare payloads, not their order or surrounding layout. Spans for text
// animation are allowed, but original wording, assets and anchors must survive.
export function verifyArticleSource(
	article: ArticleSource,
	output: string,
): void {
	const rendered = parse(output, { comment: true });
	const sources = rendered.querySelectorAll("[data-source-block]");
	if (sources.length !== article.blocks.length) {
		throw new Error(
			"专属页面遗漏或重复了原文块。每个 article.blocks 块必须恰好呈现一次。",
		);
	}
	for (const block of article.blocks) {
		const matches = sources.filter(
			(node) => node.getAttribute("data-source-block") === block.id,
		);
		if (matches.length !== 1)
			throw new Error(`原文块 ${block.id} 缺失或重复。`);
		const actual = matches[0];
		const original = parse(block.html, { comment: true });
		if (actual.textContent !== original.textContent)
			throw new Error(`原文块 ${block.id} 的文字发生改变。`);
		const signature = (node: HTMLElement) => ({
			payloads: node
				.querySelectorAll(protectedSelector)
				.map((el) => el.outerHTML)
				.sort(),
			links: node
				.querySelectorAll("a")
				.map((el) => el.getAttribute("href") || "")
				.sort(),
			ids: node
				.querySelectorAll("[id]")
				.map((el) => `${el.rawTagName}:${el.id}`)
				.sort(),
		});
		if (
			JSON.stringify(signature(original)) !==
			JSON.stringify(signature(actual))
		) {
			throw new Error(
				`原文块 ${block.id} 的代码、公式、媒体、链接或锚点发生改变。`,
			);
		}
	}
	// Catch duplicated headings/assets outside the source-block markers, too.
	const originalIds = parse(article.html)
		.querySelectorAll("[id]")
		.map((node) => node.id);
	for (const id of originalIds) {
		if (
			rendered.querySelectorAll("[id]").filter((node) => node.id === id)
				.length !== originalIds.filter((value) => value === id).length
		) {
			throw new Error(`原文锚点 ${id} 的数量发生改变。`);
		}
	}
}
