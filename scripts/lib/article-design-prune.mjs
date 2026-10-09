import fs from "node:fs";
import path from "node:path";
import { articleIdentity } from "./article-design-core.mjs";

// Only named, validated manifests authorize deletion of their own pair.
export function pruneArticleDesigns(root, { apply = false } = {}) {
	const posts = path.resolve(root, "src/content/posts");
	const designs = path.resolve(
		root,
		"src/components/article-designs/generated",
	);
	const report = { apply, candidates: [], removed: [], skipped: [] };
	if (!fs.existsSync(designs)) return report;
	if (!fs.statSync(posts).isDirectory())
		throw new Error("文章目录不可用，已停止设计清理。");
	const relative = path.relative(
		fs.realpathSync(root),
		fs.realpathSync(designs),
	);
	if (!relative || relative.startsWith("..") || path.isAbsolute(relative))
		throw new Error("设计目录不在仓库内，已停止清理。");
	const names = fs.readdirSync(designs);
	for (const name of names.filter((name) =>
		/^[a-f0-9]{20}\.json$/.test(name),
	)) {
		const key = name.slice(0, -5);
		const manifestPath = path.join(designs, name);
		const componentPath = path.join(designs, `${key}.astro`);
		try {
			for (const file of [manifestPath, componentPath]) {
				if (
					path.dirname(path.resolve(file)) !== designs ||
					(fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink())
				)
					throw new Error("设计路径或符号链接无效");
			}
			const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
			if (
				manifest.version !== 1 ||
				manifest.scope !== "page" ||
				typeof manifest.source !== "string"
			)
				throw new Error("清单格式无效");
			const sourcePath = path.resolve(posts, manifest.source);
			const identity = articleIdentity(sourcePath, root);
			if (identity.key !== key || identity.source !== manifest.source)
				throw new Error("清单绑定与文件名不一致");
			try {
				fs.statSync(sourcePath);
				continue;
			} catch (error) {
				if (error.code !== "ENOENT") throw error;
			}
			report.candidates.push({
				key,
				source: manifest.source,
				files: [componentPath, manifestPath].filter((file) =>
					fs.existsSync(file),
				),
			});
		} catch (error) {
			report.skipped.push({ file: name, reason: error.message });
		}
	}
	for (const name of names.filter((name) =>
		/^[a-f0-9]{20}\.astro$/.test(name),
	)) {
		if (!names.includes(name.replace(/\.astro$/, ".json")))
			report.skipped.push({
				file: name,
				reason: "没有绑定清单，保留文件",
			});
	}
	if (apply)
		for (const candidate of report.candidates) {
			for (const file of candidate.files) fs.unlinkSync(file);
			report.removed.push(candidate.key);
		}
	return report;
}
