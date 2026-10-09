import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { articleIdentity } from "./lib/article-design-core.mjs";
import { pruneArticleDesigns } from "./lib/article-design-prune.mjs";
import integration from "./article-design-integration.mjs";
import { pathToFileURL } from "node:url";

function sandbox(run) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "mizuki-prune-"));
	const posts = path.join(root, "src/content/posts");
	const designs = path.join(root, "src/components/article-designs/generated");
	fs.mkdirSync(posts, { recursive: true });
	fs.mkdirSync(designs, { recursive: true });
	const create = (source, content) => {
		const file = path.join(posts, source),
			{ key } = articleIdentity(file, root);
		if (content !== undefined) {
			fs.mkdirSync(path.dirname(file), { recursive: true });
			fs.writeFileSync(file, content);
		}
		fs.writeFileSync(
			path.join(designs, `${key}.astro`),
			"<!-- saved design -->",
		);
		fs.writeFileSync(
			path.join(designs, `${key}.json`),
			JSON.stringify({ version: 1, scope: "page", source }),
		);
		return key;
	};
	try {
		run({ root, posts, designs, create });
	} finally {
		assert.equal(
			path.dirname(path.resolve(root)),
			path.resolve(os.tmpdir()),
		);
		assert.match(path.basename(root), /^mizuki-prune-/);
		fs.rmSync(root, { recursive: true, force: true });
	}
}
test("prune previews, then removes only missing sources; opt-out/drafts remain", () =>
	sandbox(({ root, designs, create }) => {
		const deleted = create("分类/已删除.md");
		const off = create(
			"关闭.mdx",
			"---\ncreate: false\ndraft: true\n---\n原文",
		);
		const changed = create("变更.md", "全新内容");
		assert.equal(pruneArticleDesigns(root).candidates.length, 1);
		assert.ok(fs.existsSync(path.join(designs, `${deleted}.astro`)));
		assert.deepEqual(pruneArticleDesigns(root, { apply: true }).removed, [
			deleted,
		]);
		assert.ok(!fs.existsSync(path.join(designs, `${deleted}.json`)));
		for (const key of [off, changed])
			assert.ok(fs.existsSync(path.join(designs, `${key}.astro`)));
		assert.deepEqual(
			pruneArticleDesigns(root, { apply: true }).removed,
			[],
		);
	}));
test("invalid/path-escaping manifests, unmatched names and unbound components survive", () =>
	sandbox(({ root, designs, create }) => {
		const key = create("missing.md");
		fs.writeFileSync(
			path.join(designs, `${key}.json`),
			JSON.stringify({
				version: 1,
				scope: "page",
				source: "../../outside.md",
			}),
		);
		fs.writeFileSync(
			path.join(designs, "a".repeat(20) + ".astro"),
			"unbound",
		);
		fs.writeFileSync(
			path.join(designs, "b".repeat(20) + ".json"),
			"{broken",
		);
		fs.writeFileSync(path.join(designs, "notes.json"), "personal notes");
		const report = pruneArticleDesigns(root, { apply: true });
		assert.equal(report.removed.length, 0);
		assert.equal(report.skipped.length, 3);
		assert.equal(fs.readdirSync(designs).length, 5);
	}));
test("unavailable content root prevents deletion", () =>
	sandbox(({ root, posts, designs, create }) => {
		const key = create("missing.md");
		fs.rmdirSync(posts);
		assert.throws(() => pruneArticleDesigns(root, { apply: true }));
		assert.ok(fs.existsSync(path.join(designs, `${key}.astro`)));
	}));
test("Astro hook prunes on build only, before component discovery", () =>
	sandbox(({ root, designs, create }) => {
		const key = create("missing.md");
		const hook = integration().hooks["astro:config:setup"];
		const context = {
			config: { root: pathToFileURL(root + path.sep) },
			logger: { info() {}, warn() {} },
			updateConfig() {},
		};
		hook({ ...context, command: "dev" });
		assert.ok(fs.existsSync(path.join(designs, `${key}.astro`)));
		hook({ ...context, command: "build" });
		assert.ok(!fs.existsSync(path.join(designs, `${key}.astro`)));
	}));
