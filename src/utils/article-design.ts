import type { AstroInstance } from "astro";
import type { CollectionEntry } from "astro:content";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
	articleIdentity,
	articleFingerprint,
} from "../../scripts/lib/article-design-core.mjs";

export interface ArticleDesignManifest {
	version: 1;
	scope: "page";
	source: string;
	sourceHash: string;
	template: string;
	plan: string;
}

export interface ArticleDesign {
	key: string;
	Component: AstroInstance["default"];
	manifest: ArticleDesignManifest;
}

const components = import.meta.glob<AstroInstance>(
	"../components/article-designs/generated/*.astro",
);
const manifests = import.meta.glob<ArticleDesignManifest>(
	"../components/article-designs/generated/*.json",
	{ import: "default" },
);
// Executed only by Astro dev/build, launched from the project root. import.meta.url
// would point into the compiled server chunks during a production build.
const root = process.cwd();
const warnings = new Set<string>();

function warnOnce(key: string, message: string) {
	if (warnings.has(key)) return;
	warnings.add(key);
	console.warn(`[article-design] ${message}`);
}

export async function getArticleDesign(
	entry: CollectionEntry<"posts">,
): Promise<ArticleDesign | null> {
	if (!entry.data.create || !entry.filePath) return null;
	const { source, key } = articleIdentity(entry.filePath, root);
	const base = `../components/article-designs/generated/${key}`;
	const loadComponent = components[`${base}.astro`];
	const loadManifest = manifests[`${base}.json`];
	if (!loadComponent || !loadManifest) {
		warnOnce(
			`${key}:missing`,
			`${source} 尚未创作专属前端，使用原版页面。运行 article-design status 查看。`,
		);
		return null;
	}
	const manifest = await loadManifest();
	if (
		manifest.version !== 1 ||
		manifest.source !== source ||
		manifest.scope !== "page"
	) {
		throw new Error(
			`[article-design] ${source} 的设计清单无效，请检查 ${key}.json。`,
		);
	}
	const hash = articleFingerprint(
		await readFile(path.resolve(root, "src/content/posts", source), "utf8"),
	);
	if (manifest.sourceHash !== hash) {
		warnOnce(
			`${key}:${hash}`,
			`${source} 的内容有更新：复用既有设计与最新原文，请让 agent 检查适配；不会自动重新生成。`,
		);
	}
	return { key, Component: (await loadComponent()).default, manifest };
}
