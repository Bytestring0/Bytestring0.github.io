<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";
import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";
import { panelManager } from "../utils/panel-manager.js";

let tocItems: Array<{
	id: string;
	text: string;
	level: number;
	badge?: string;
}> = [];
let activeId = "";
let observer: IntersectionObserver;
let isHomePage = true;
let useJapaneseBadge = false;
let tocDepth = 3;

const togglePanel = async () => {
	await panelManager.togglePanel("mobile-toc-panel");
};

const setPanelVisibility = async (show: boolean): Promise<void> => {
	await panelManager.togglePanel("mobile-toc-panel", show);
};

const generateTOC = () => {
	// 获取配置
	useJapaneseBadge = (window as any).siteConfig?.toc?.useJapaneseBadge || false;
	tocDepth = (window as any).siteConfig?.toc?.depth || 3;

	const headings = document.querySelectorAll("#post-container h1[id], #post-container h2[id], #post-container h3[id], #post-container h4[id], #post-container h5[id], #post-container h6[id]");
	const items: Array<{
		id: string;
		text: string;
		level: number;
		badge?: string;
	}> = [];
	const japaneseHiragana = [
		"ア",
		"イ",
		"ウ",
		"エ",
		"オ",
		"カ",
		"キ",
		"ク",
		"ケ",
		"コ",
		"サ",
		"シ",
		"ス",
		"セ",
		"ソ",
		"タ",
		"チ",
		"ツ",
		"テ",
		"ト",
	];
	let h1Count = 0;

	headings.forEach((heading) => {
		if (heading.id) {
			const level = Number.parseInt(heading.tagName.charAt(1), 10);

			// 根据depth配置过滤标题
			if (level > tocDepth) {
				return;
			}

			const text = (heading.textContent || "").replace(/#+\s*$/, "");
			let badge = "";

			// 只为H1标题生成badge
			if (level === 1) {
				h1Count++;
				if (useJapaneseBadge && h1Count - 1 < japaneseHiragana.length) {
					badge = japaneseHiragana[h1Count - 1];
				} else {
					badge = h1Count.toString();
				}
			}

			items.push({ id: heading.id, text, level, badge });
		}
	});

	tocItems = items;
};

const checkIsHomePage = () => {
	const pathname = window.location.pathname;
	// 检查是否为首页或首页的分页页面
	// 分页格式：/, /2/, /3/, 等等
	isHomePage =
		pathname === "/" || pathname === "" || /^\/\d+\/?$/.test(pathname);
};

const scrollToHeading = (id: string) => {
	const element = document.getElementById(id);
	if (element) {
		// 关闭面板
		setPanelVisibility(false);

		// 滚动到目标位置，考虑导航栏高度
		const offset = 80;
		const elementPosition = element.getBoundingClientRect().top + window.scrollY - offset;

		window.scrollTo({
			top: elementPosition,
			behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
		});
	}
};

const updateActiveHeading = () => {
	if (isHomePage) return;
	const headings = document.querySelectorAll("#post-container h1[id], #post-container h2[id], #post-container h3[id], #post-container h4[id], #post-container h5[id], #post-container h6[id]");
	const scrollTop = window.scrollY;
	const offset = 100;

	let currentActiveId = "";
	headings.forEach((heading) => {
		if (heading.id) {
			const elementTop = heading.getBoundingClientRect().top + scrollTop - offset;
			if (scrollTop >= elementTop) {
				currentActiveId = heading.id;
			}
		}
	});

	activeId = currentActiveId;
};

const setupIntersectionObserver = () => {
	const headings = document.querySelectorAll("#post-container h1[id], #post-container h2[id], #post-container h3[id], #post-container h4[id], #post-container h5[id], #post-container h6[id]");

	if (observer) {
		observer.disconnect();
	}

	observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					activeId = entry.target.id;
				}
			});
		},
		{
			rootMargin: "-80px 0px -80% 0px",
			threshold: 0,
		},
	);

	headings.forEach((heading) => {
		if (heading.id) {
			observer.observe(heading);
		}
	});
};

const init = () => {
	checkIsHomePage();
	observer?.disconnect();
	if (isHomePage || !document.querySelector("#post-container")) {
		tocItems = [];
		activeId = "";
		setPanelVisibility(false);
		return;
	}
	generateTOC();
	setupIntersectionObserver();
	updateActiveHeading();
};

onMount(() => {
	let timer: ReturnType<typeof setTimeout>;
	const refresh = () => {
		clearTimeout(timer);
		timer = setTimeout(init, 100);
	};
	let registeredSwup: any;
	const attachSwup = () => {
		const swup = (window as any).swup;
		if (!swup || registeredSwup === swup) return;
		registeredSwup?.hooks.off("page:view", refresh);
		registeredSwup = swup;
		swup.hooks.on("page:view", refresh);
	};
	attachSwup();
	document.addEventListener("swup:enable", attachSwup);
	document.addEventListener("astro:page-load", refresh);
	document.addEventListener("article:content-ready", refresh);
	window.addEventListener("popstate", refresh);
	window.addEventListener("scroll", updateActiveHeading, { passive: true });
	(window as any).mobileTOCInit = init;
	init();
	return () => {
		clearTimeout(timer);
		observer?.disconnect();
		registeredSwup?.hooks.off("page:view", refresh);
		document.removeEventListener("swup:enable", attachSwup);
		document.removeEventListener("astro:page-load", refresh);
		document.removeEventListener("article:content-ready", refresh);
		window.removeEventListener("popstate", refresh);
		window.removeEventListener("scroll", updateActiveHeading);
		if ((window as any).mobileTOCInit === init) delete (window as any).mobileTOCInit;
	};
});
</script>

{#if !isHomePage && tocItems.length > 0}
<!-- TOC toggle button for mobile -->
<button
	on:click={togglePanel}
	aria-label="Table of Contents"
	id="mobile-toc-switch"
	class="btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90 mobile-toc-toggle theme-switch-btn"
>
	<Icon icon="material-symbols:format-list-bulleted" class="text-[1.25rem]" />
</button>

<!-- Mobile TOC Panel -->
<div 
	id="mobile-toc-panel" 
	class="float-panel float-panel-closed mobile-toc-panel absolute md:w-[20rem] w-[calc(100vw-2rem)]
		top-20 left-4 md:left-[unset] right-4 shadow-md rounded-2xl p-4"
>
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-medium text-[var(--primary)]">{i18n(I18nKey.tableOfContents)}</h3>
		<button 
			on:click={togglePanel}
			aria-label="Close TOC"
			class="btn-plain rounded-lg h-8 w-8 active:scale-90 theme-switch-btn"
		>
			<Icon icon="material-symbols:close" class="text-[1rem]" />
		</button>
	</div>

		{#if tocItems.length === 0}
			<div class="text-center py-8 text-n-8">
				<p>{i18n(I18nKey.tocEmpty)}</p>
			</div>
		{:else}
			<div class="toc-content">
				{#each tocItems as item}
					<button
						on:click={() => scrollToHeading(item.id)}
						class="toc-item level-{item.level} {activeId === item.id ? 'active' : ''}"
						class:active={activeId === item.id}
					>
						{#if item.level === 1}
							<span class="badge">{item.badge}</span>
						{:else if item.level === 2}
							<span class="dot-square"></span>
						{:else}
							<span class="dot-small"></span>
						{/if}
						<span class="toc-text">{item.text}</span>
					</button>
				{/each}
			</div>
		{/if}
</div>
{/if}

<style>
	@media (min-width: 1181px) {
		.mobile-toc-toggle { display: none !important; }
	}
	.mobile-toc-panel {
		max-height: calc(100vh - 120px);
		overflow-y: auto;
		background: var(--card-bg);
		border: 1px solid var(--line-color);
		backdrop-filter: blur(10px);
	}

	/* 确保主题切换按钮的背景色即时更新 */
	:global(.theme-switch-btn)::before {
		transition: transform 75ms ease-out, background-color 0ms !important;
	}

	.toc-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.toc-item {
		display: flex;
		align-items: center;
		width: 100%;
		text-align: left;
		padding: 8px 12px;
		border-radius: 8px;
		transition: all 0.2s ease;
		border: none;
		background: transparent;
		cursor: pointer;
		color: rgba(0, 0, 0, 0.75);
		font-size: 0.9rem;
		line-height: 1.4;
	}

	:global(.dark) .toc-item {
		color: rgba(255, 255, 255, 0.75);
	}

	.toc-item:hover {
		background: var(--btn-plain-bg-hover);
		color: var(--primary);
	}

	.toc-item.active {
		background: var(--btn-plain-bg-active);
		color: var(--primary);
		font-weight: 600;
		border-left: 3px solid var(--primary);
		padding-left: 9px;
	}

	/* 不同级别的标题缩进 */
	.toc-item.level-1 {
		padding-left: 12px;
		font-weight: 600;
		font-size: 1rem;
		gap: 8px;
	}

	.toc-item.level-2 {
		padding-left: 28px;
		gap: 6px;
	}

	.toc-item.level-3 {
		padding-left: 36px;
		font-size: 0.85rem;
		gap: 6px;
	}

	.toc-item.level-4 {
		padding-left: 44px;
		font-size: 0.8rem;
		gap: 6px;
	}

	.toc-item.level-5,
	.toc-item.level-6 {
		padding-left: 52px;
		font-size: 0.75rem;
		color: rgba(0, 0, 0, 0.5);
		gap: 6px;
	}

	:global(.dark) .toc-item.level-5,
	:global(.dark) .toc-item.level-6 {
		color: rgba(255, 255, 255, 0.5);
	}

	.toc-item.level-1.active {
		padding-left: 9px;
	}

	.toc-item.level-2.active {
		padding-left: 25px;
	}

	.toc-item.level-3.active {
		padding-left: 33px;
	}

	.toc-item.level-4.active {
		padding-left: 41px;
	}

	.toc-item.level-5.active,
	.toc-item.level-6.active {
		padding-left: 49px;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 4px;
		border-radius: 6px;
		background: var(--toc-badge-bg);
		color: var(--btn-content);
		font-size: 0.8rem;
		font-weight: 600;
		flex-shrink: 0;
		line-height: 1;
	}

	.dot-square {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--toc-badge-bg);
		flex-shrink: 0;
	}

	.dot-small {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 2px;
		background: rgba(0, 0, 0, 0.05);
		flex-shrink: 0;
	}

	:global(.dark) .dot-small {
		background: rgba(255, 255, 255, 0.1);
	}

	.toc-text {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.mobile-toc-panel::-webkit-scrollbar {
		width: 4px;
	}

	.mobile-toc-panel::-webkit-scrollbar-track {
		background: transparent;
	}

	.mobile-toc-panel::-webkit-scrollbar-thumb {
		background: var(--line-color);
		border-radius: 2px;
	}

	.mobile-toc-panel::-webkit-scrollbar-thumb:hover {
		background: var(--text-color-25);
	}
</style>