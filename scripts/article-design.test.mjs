import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
	articleIdentity,
	articleFingerprint,
} from "./lib/article-design-core.mjs";
import {
	splitArticleSource,
	groupArticleBlocks,
	verifyArticleSource,
} from "../src/utils/article-source.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const html =
	'<p>开头 &amp; 引言。</p><section><h2 id="第一节">第一节</h2><p>原文不可改写。</p><section><h3 id="公式">公式</h3><p><math><mi>x</mi></math></p><pre><code>a &lt; b</code></pre><p><a href="/about/">链接</a><img src="/test.png" alt="图片"></p></section></section><!--MDX marker-->';
const render = (blocks) =>
	blocks
		.map(
			(block) =>
				`<div data-source-block="${block.id}">${block.html}</div>`,
		)
		.join("");

test("source blocks preserve content and can be regrouped/reordered", () => {
	const article = splitArticleSource(html);
	assert.equal(article.blocks.filter((block) => block.headingId).length, 2);
	assert.deepEqual(groupArticleBlocks(article).flat(), article.blocks);
	assert.doesNotThrow(() =>
		verifyArticleSource(article, render([...article.blocks].reverse())),
	);
	assert.doesNotThrow(() =>
		verifyArticleSource(
			article,
			render(article.blocks).replace(
				"原文不可改写。",
				"<span>原文</span>不可改写。",
			),
		),
	);
});

test("missing, duplicated, edited and corrupted source is rejected", () => {
	const article = splitArticleSource(html);
	const good = render(article.blocks);
	for (const bad of [
		render(article.blocks.slice(1)),
		render([...article.blocks, article.blocks[0]]),
		good.replace("原文不可改写。", "改写了。"),
		good.replace('href="/about/"', 'href="/other/"'),
		good.replace('src="/test.png"', 'src="/other.png"'),
		good.replace("<mi>x</mi>", "<mi>y</mi>"),
		good.replace('id="公式"', 'id="changed"'),
		`${good}<h2 id="第一节">重复标题</h2>`,
	])
		assert.throws(() => verifyArticleSource(article, bad));
});

test("fingerprint ignores only create and checkout line endings", () => {
	const source = "---\ntitle: 测试\ncreate: true\n---\n原文\n";
	assert.equal(
		articleFingerprint(source),
		articleFingerprint(source.replace("create: true\n", "")),
	);
	assert.equal(
		articleFingerprint(source),
		articleFingerprint(
			source.replace("true", "false").replaceAll("\n", "\r\n"),
		),
	);
	assert.notEqual(
		articleFingerprint(source),
		articleFingerprint(source.replace("原文", "新内容")),
	);
	assert.notEqual(
		articleFingerprint(source),
		articleFingerprint(source.replace("title: 测试", "title: 新标题")),
	);
});

test("identity supports nested Chinese paths and rejects paths outside posts", () => {
	assert.equal(
		articleIdentity("src/content/posts/分类/文章.mdx", root).source,
		"分类/文章.mdx",
	);
	assert.throws(() => articleIdentity("src/content/spec/about.md", root));
	assert.throws(() =>
		articleIdentity("src/content/posts/../../escape.md", root),
	);
});

test("CLI status is read-only; init never overwrites; content changes only mark stale", () => {
	const sandbox = fs.mkdtempSync(
		path.join(os.tmpdir(), "mizuki-article-design-"),
	);
	try {
		for (const relative of [
			"scripts/article-design.mjs",
			"scripts/lib/article-design-core.mjs",
			"scripts/lib/article-design-prune.mjs",
			"scripts/lib/article-design-lint.mjs",
			".agents/skills/mizuki-article-frontend/assets/editorial.astro",
		]) {
			const dest = path.join(sandbox, relative);
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.copyFileSync(path.join(root, relative), dest);
		}
		const relative = "src/content/posts/分类/文章.md";
		const post = path.join(sandbox, relative);
		fs.mkdirSync(path.dirname(post), { recursive: true });
		fs.writeFileSync(post, "---\ntitle: 测试\ncreate: true\n---\n原文\n");
		const cli = (...args) =>
			execFileSync(
				process.execPath,
				[path.join(sandbox, "scripts/article-design.mjs"), ...args],
				{ encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
			);
		const status = () => JSON.parse(cli("status", relative));
		assert.equal(status().state, "missing");
		assert.equal(
			fs.existsSync(path.join(sandbox, "src/components")),
			false,
		);
		cli("init", relative);
		const saved = status();
		assert.equal(saved.state, "current");
		const component = path.join(sandbox, saved.component);
		fs.appendFileSync(component, "\n<!-- 用户满意的设计 -->\n");
		const before = fs.readFileSync(component, "utf8");
		cli("init", relative, "story");
		assert.equal(fs.readFileSync(component, "utf8"), before);
		fs.appendFileSync(post, "新增段落\n");
		assert.equal(status().state, "source-changed");
		cli("accept-source", relative);
		assert.equal(status().state, "current");
		assert.equal(fs.readFileSync(component, "utf8"), before);
		fs.unlinkSync(path.join(sandbox, saved.metadata));
		assert.equal(status().state, "incomplete");
		cli("init", relative);
		assert.equal(fs.existsSync(path.join(sandbox, saved.metadata)), false);
		assert.equal(fs.readFileSync(component, "utf8"), before);
		fs.writeFileSync(
			path.join(sandbox, "src/content/posts/off.md"),
			"---\ncreate: false\n---\n普通文章\n",
		);
		assert.throws(() => cli("init", "src/content/posts/off.md"));
	} finally {
		// Verify the exact mkdtemp target before recursive cleanup on Windows.
		assert.equal(
			path.dirname(path.resolve(sandbox)),
			path.resolve(os.tmpdir()),
		);
		assert.match(path.basename(sandbox), /^mizuki-article-design-/);
		fs.rmSync(sandbox, { recursive: true, force: true });
	}
});
