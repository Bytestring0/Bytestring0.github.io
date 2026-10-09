import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pruneArticleDesigns } from "./lib/article-design-prune.mjs";
import { lintArticleDesign } from "./lib/article-design-lint.mjs";
import {
	articleIdentity,
	articleFingerprint,
} from "./lib/article-design-core.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const [action, file, template = "editorial"] = process.argv.slice(2);
const templates = ["editorial", "lab", "story"];

function run() {
	if (action === "prune") {
		if (file && file !== "--apply")
			throw new Error("用法：pnpm article-design prune [--apply]");
		console.log(
			JSON.stringify(
				pruneArticleDesigns(root, { apply: file === "--apply" }),
				null,
				2,
			),
		);
		return;
	}
	if (
		!["status", "lint", "init", "accept-source"].includes(action) ||
		!file
	) {
		throw new Error(
			'用法：pnpm article-design <status|lint|init|accept-source> "src/content/posts/文章.md" [editorial|lab|story]',
		);
	}
	const { source, key } = articleIdentity(file, root);
	const input = fs.readFileSync(path.resolve(root, file), "utf8");
	const sourceHash = articleFingerprint(input);
	const dir = path.join(root, "src/components/article-designs/generated");
	const component = path.join(dir, `${key}.astro`);
	const metadata = path.join(dir, `${key}.json`);
	const hasComponent = fs.existsSync(component);
	const hasMetadata = fs.existsSync(metadata);
	const manifest = hasMetadata
		? JSON.parse(fs.readFileSync(metadata, "utf8"))
		: null;
	if (action === "status") {
		console.log(
			JSON.stringify(
				{
					source,
					key,
					state:
						hasComponent && hasMetadata
							? manifest.sourceHash === sourceHash
								? "current"
								: "source-changed"
							: hasComponent || hasMetadata
								? "incomplete"
								: "missing",
					component: path.relative(root, component),
					metadata: path.relative(root, metadata),
					manifest,
				},
				null,
				2,
			),
		);
		return;
	}
	if (action === "lint") {
		if (!hasComponent || !hasMetadata)
			throw new Error("设计文件不完整；先 status 定位，不覆盖既有文件。");
		const result = lintArticleDesign({
			component: fs.readFileSync(component, "utf8"),
			manifest,
			source,
			key,
			sourceHash,
		});
		console.log(JSON.stringify({ source, key, ...result }, null, 2));
		if (result.errors.length) process.exitCode = 1;
		return;
	}
	if (action === "accept-source") {
		if (!hasComponent || !hasMetadata || manifest.source !== source)
			throw new Error("没有完整的既有设计，不能更新指纹。");
		manifest.sourceHash = sourceHash;
		fs.writeFileSync(metadata, `${JSON.stringify(manifest, null, 2)}\n`);
		console.log(
			"已记录当前原文指纹；设计文件未改动。仅应在完成内容适配检查后使用。",
		);
		return;
	}
	if (hasComponent || hasMetadata) {
		console.log(
			`已有设计或部分设计 ${key}，未生成、未覆盖。请继续编辑现有文件。`,
		);
		return;
	}
	if (!templates.includes(template))
		throw new Error(`未知模板 ${template}；可选 ${templates.join(", ")}。`);
	const frontmatter = input
		.replace(/^\uFEFF/, "")
		.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
	if (!frontmatter || !/^create:\s*true\s*(?:#.*)?$/m.test(frontmatter))
		throw new Error(
			"请在风格确认后将文章 frontmatter 设为 create: true。脚本不会改写文章。",
		);
	const starter = fs
		.readFileSync(
			path.join(
				root,
				".agents/skills/mizuki-article-frontend/assets",
				`${template}.astro`,
			),
			"utf8",
		)
		.replaceAll("__DESIGN_KEY__", key);
	fs.mkdirSync(dir, { recursive: true });
	const data = {
		version: 1,
		source,
		sourceHash,
		template,
		scope: "page",
		plan: "",
	};
	// Exclusive writes prevent a second invocation from replacing saved work.
	fs.writeFileSync(component, starter, { flag: "wx" });
	fs.writeFileSync(metadata, `${JSON.stringify(data, null, 2)}\n`, {
		flag: "wx",
	});
	console.log(
		`已创建 ${path.relative(root, component)} 和设计清单。请记录确认方案并针对文章设计；模板只是起点。`,
	);
}

try {
	run();
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
