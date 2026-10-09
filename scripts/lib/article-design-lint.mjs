// Cheap authoring checks before starting Astro or a browser. These are not
// visual tests and deliberately do not prescribe an authored page's layout.
export function lintArticleDesign({
	component,
	manifest,
	source,
	key,
	sourceHash,
}) {
	const errors = [];
	const warnings = [];
	if (
		manifest.version !== 1 ||
		manifest.scope !== "page" ||
		manifest.source !== source
	)
		errors.push(
			"设计清单绑定无效；保留 init 生成的 version、scope、source。",
		);
	if (
		!/^[a-f0-9]{64}$/.test(manifest.sourceHash ?? "") ||
		/^0+$/.test(manifest.sourceHash)
	)
		errors.push(
			"sourceHash 不是有效的原文指纹；不要手填占位值，核对适配后使用 accept-source。",
		);
	else if (manifest.sourceHash !== sourceHash)
		warnings.push(
			"原文指纹已变化；检查内容适配后再 accept-source，不能用更新指纹代替修复。",
		);
	if (component.includes("__DESIGN_KEY__"))
		errors.push(
			`遗留 __DESIGN_KEY__ 占位符；生成页面中的样式绑定须使用 ${key}。`,
		);
	const scopes = [
		...component.matchAll(
			/\[data-article-design\s*=\s*["']([^"']+)["']\]/g,
		),
	].map((match) => match[1]);
	for (const scope of new Set(scopes)) {
		if (scope !== key && scope !== "__DESIGN_KEY__")
			errors.push(`CSS 绑定到其他设计 ${scope}，当前 key 是 ${key}。`);
	}
	for (const style of component.matchAll(
		/<style\b[^>]*\bis:inline\b[^>]*>([\s\S]*?)<\/style>/g,
	)) {
		if (style[1].includes(":global("))
			errors.push(
				"<style is:inline> 中 :global(...) 不会经 Astro 编译；使用具体 key 限定的普通 CSS 选择器。",
			);
	}
	if (!manifest.plan?.trim())
		warnings.push(
			"plan 为空；记录已确认的方向及实际验收状态，方便下次增量修改。",
		);
	return { errors, warnings };
}
