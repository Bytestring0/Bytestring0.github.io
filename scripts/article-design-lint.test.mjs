import assert from "node:assert/strict";
import { test } from "node:test";
import { lintArticleDesign } from "./lib/article-design-lint.mjs";

const key = "1234567890abcdef1234";
const sourceHash = "a".repeat(64);
const valid = {
	key,
	source: "EDA/STA.md",
	sourceHash,
	component: `<style is:inline>[data-article-design="${key}"] .body { min-width:0 }</style>`,
	manifest: {
		version: 1,
		scope: "page",
		source: "EDA/STA.md",
		sourceHash,
		plan: "已确认",
	},
};
test("valid authored scopes pass; stale source is a warning without mutation", () => {
	assert.deepEqual(lintArticleDesign(valid), { errors: [], warnings: [] });
	const manifest = { ...valid.manifest, sourceHash: "b".repeat(64) };
	const before = structuredClone(manifest);
	const result = lintArticleDesign({ ...valid, manifest });
	assert.equal(result.errors.length, 0);
	assert.equal(result.warnings.length, 1);
	assert.deepEqual(manifest, before);
});
test("STA authoring failures are caught before browser rendering", () => {
	for (const manifest of [
		{ ...valid.manifest, sourceHash: "0".repeat(32) },
		{ ...valid.manifest, sourceHash: "0".repeat(64) },
		{ ...valid.manifest, source: "other.md" },
	])
		assert.ok(lintArticleDesign({ ...valid, manifest }).errors.length);
	for (const component of [
		valid.component.replaceAll(key, "__DESIGN_KEY__"),
		valid.component.replaceAll(key, "abcdef1234567890abcd"),
		"<style is:inline>:global(.body) { color:red }</style>",
	])
		assert.ok(lintArticleDesign({ ...valid, component }).errors.length);
});
