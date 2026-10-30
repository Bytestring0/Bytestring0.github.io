import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import svelte, { vitePreprocess } from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import { umami } from "oddmisc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeComponents from "rehype-components";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import remarkSectionize from "remark-sectionize";
import { siteConfig, permalinkConfig } from "./src/config.ts";
import obsidianIntegration from "./scripts/obsidian/integration.mjs";
import { remarkObsidian } from "./src/plugins/remark-obsidian.mjs";
import { pluginCustomCopyButton } from "./src/plugins/expressive-code/custom-copy-button.js";
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge.ts";
import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.mjs";
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs";
import { rehypeMermaid } from "./src/plugins/rehype-mermaid.mjs";
import { rehypeWrapTable } from "./src/plugins/rehype-wrap-table.mjs";
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js";
import { remarkMermaid } from "./src/plugins/remark-mermaid.js";
import { remarkContent } from "./src/plugins/remark-content.mjs";
import { rehypeImageWidth } from "./src/plugins/rehype-image-width.mjs";
import rehypeExternalLinks from "rehype-external-links";
import { remarkFixGithubAdmonitions } from "./src/plugins/remark-fix-github-admonitions.js";

// https://astro.build/config
export default defineConfig({
	site: "https://bytestring.top",
	base: "",
	trailingSlash: "always",

	output: "static",
	prefetch: { prefetchAll: true, defaultStrategy: "hover" },

	integrations: [
		obsidianIntegration(),
		umami({}),
		tailwind({
			nesting: true,
		}),

		icon(),
		expressiveCode({
			themes: ["github-light", "github-dark"],
			useDarkModeMediaQuery: false,
			themeCssSelector: (theme) =>
				`[data-theme="${theme.type === "dark" ? "dark" : "light"}"]`,
			minSyntaxHighlightingColorContrast: 6,
			plugins: [
				pluginCollapsibleSections(),
				pluginLineNumbers(),
				pluginLanguageBadge(),
				pluginCustomCopyButton(),
			],
			defaultProps: {
				wrap: true,
				overridesByLang: {
					shellsession: { showLineNumbers: false },
					bash: { frame: "code" },
					shell: { frame: "code" },
					sh: { frame: "code" },
					zsh: { frame: "code" },
				},
			},
			styleOverrides: {
				codeBackground: ({ theme }) =>
					theme.type === "dark" ? "#192432" : "#e6eef5",
				borderRadius: "0.75rem",
				borderColor: "none",
				codeFontSize: "0.875rem",
				codeFontFamily:
					"'MapleMonoNormal-NF-CN-Regular', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
				codeLineHeight: "1.5rem",
				frames: {
					editorBackground: "var(--codeblock-bg)",
					terminalBackground: "var(--codeblock-bg)",
					terminalTitlebarBackground: "var(--codeblock-bg)",
					editorTabBarBackground: "var(--codeblock-bg)",
					editorActiveTabBackground: "none",
					editorActiveTabIndicatorBottomColor: "var(--primary)",
					editorActiveTabIndicatorTopColor: "none",
					editorTabBarBorderBottomColor: "var(--codeblock-bg)",
					terminalTitlebarBorderBottomColor: "none",
				},
				textMarkers: {
					delHue: 0,
					insHue: 180,
					markHue: 250,
				},
			},
			frames: {
				showCopyToClipboardButton: false,
			},
		}),
		mdx(),
		svelte({
			preprocess: vitePreprocess(),
		}),
		sitemap(),
	],
	markdown: {
		remarkPlugins: [
			[remarkObsidian, { permalink: permalinkConfig }],
			remarkMath,
			remarkContent,
			remarkFixGithubAdmonitions,
			remarkDirective,
			remarkSectionize,
			parseDirectiveNode,
			remarkMermaid,
		],
		rehypePlugins: [
			rehypeKatex,
			[
				rehypeExternalLinks,
				{
					target: "_blank",
					rel: ["nofollow", "noopener", "noreferrer"],
				},
			],
			rehypeSlug,
			rehypeWrapTable,
			rehypeMermaid,
			[
				rehypeComponents,
				{
					components: {
						github: GithubCardComponent,
						note: (x, y) => AdmonitionComponent(x, y, "note"),
						tip: (x, y) => AdmonitionComponent(x, y, "tip"),
						important: (x, y) =>
							AdmonitionComponent(x, y, "important"),
						caution: (x, y) => AdmonitionComponent(x, y, "caution"),
						warning: (x, y) => AdmonitionComponent(x, y, "warning"),
					},
				},
			],
			[
				rehypeAutolinkHeadings,
				{
					behavior: "append",
					properties: {
						className: ["anchor"],
					},
					content: {
						type: "element",
						tagName: "span",
						properties: {
							className: ["anchor-icon"],
							"data-pagefind-ignore": true,
						},
						children: [{ type: "text", value: "#" }],
					},
				},
			],
			rehypeImageWidth,
		],
	},
	vite: {
		optimizeDeps: { include: ["markmap-view"] },
		server: {
			watch: {
				ignored: [
					"**/src/content/posts/**/.obsidian/**",
					"**/src/content/posts/**/.trash/**",
				],
			},
		},
		// Verilog source files can live beside posts. Treat them as assets so
		// broad image/content globs never ask Rollup to parse them as JavaScript.
		assetsInclude: ["**/*.v"],
		build: {
			// 静态资源处理优化，防止小图片转 base64 导致 HTML 体积过大（可选，根据需要调整）
			assetsInlineLimit: 4096,

			rollupOptions: {
				onwarn(warning, warn) {
					if (
						warning.message.includes(
							"is dynamically imported by",
						) &&
						warning.message.includes(
							"but also statically imported by",
						)
					) {
						return;
					}
					warn(warning);
				},
			},
		},
	},
});
