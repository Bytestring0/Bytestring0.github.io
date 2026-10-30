import { reducedMotion } from "./clock";
type DiagramWindow = Window & { renderMermaidDiagrams?: () => void };

export async function enhanceContent(signal: AbortSignal) {
	const nodes = [
		...document.querySelectorAll<HTMLElement>(
			".obsidian-markmap:not([data-lake-rendered])",
		),
	];
	if (nodes.length) {
		try {
			const { Markmap } = await import("markmap-view");
			if (signal.aborted) return;
			for (const node of nodes) {
				const svg = document.createElementNS(
					"http://www.w3.org/2000/svg",
					"svg",
				);
				svg.setAttribute(
					"width",
					String(
						Math.max(
							240,
							node.closest<HTMLElement>(".article-prose")
								?.clientWidth || 600,
						),
					),
				);
				svg.setAttribute("height", "320");
				svg.setAttribute("aria-label", "思维导图");
				node.replaceChildren(svg);
				node.dataset.lakeRendered = "true";
				const map = Markmap.create(
					svg,
					{ duration: 0, autoFit: true },
					JSON.parse(node.dataset.markmap || "{}"),
				);
				signal.addEventListener("abort", () => map.destroy(), {
					once: true,
				});
			}
		} catch {
			/* The original content remains available if the optional chunk fails. */
		}
	}
	if (document.querySelector(".mermaid[data-mermaid-code]")) {
		const target = window as DiagramWindow;
		if (!target.renderMermaidDiagrams) {
			const { default: source } =
				await import("../../plugins/mermaid-render-script.js?raw");
			if (signal.aborted) return;
			const script = document.createElement("script");
			script.textContent = source;
			document.head.append(script);
			script.remove();
		}
		target.renderMermaidDiagrams?.();
	}
}

export function initReading(signal: AbortSignal) {
	const prose = document.querySelector<HTMLElement>("[data-reading-flow]");
	const article = document.querySelector<HTMLElement>(".reader-panel");
	if (!prose || !article) return;
	const flow = prose,
		panel = article;
	const toc = document.querySelector<HTMLDetailsElement>("[data-reader-toc]");
	const compact = matchMedia("(max-width: 1000px)");
	if (toc) toc.open = !compact.matches;
	let headings: HTMLElement[] = [],
		scheduled = false;
	const progress = document.querySelector<HTMLElement>(".reading-progress");
	const percent = document.querySelector<HTMLElement>(
		"[data-reading-percent]",
	);
	const current = document.querySelector<HTMLElement>(
		"[data-outline-current]",
	);
	let active = "";

	function headingLabel(heading: HTMLElement) {
		const copy = heading.cloneNode(true) as HTMLElement;
		copy.querySelectorAll(".anchor").forEach((anchor) => anchor.remove());
		return copy.textContent?.trim() || "";
	}
	function update() {
		scheduled = false;
		if (signal.aborted) return;
		const start = panel.getBoundingClientRect().top + scrollY;
		const end = start + panel.offsetHeight - innerHeight;
		const fraction = Math.max(
			0,
			Math.min(1, (scrollY - start + 100) / Math.max(1, end - start)),
		);
		const value = Math.round(fraction * 100);
		progress?.style.setProperty("--progress", String(fraction));
		progress?.setAttribute("aria-valuenow", String(value));
		if (percent) percent.textContent = `${value}%`;
		let heading = headings[0];
		for (const item of headings) {
			if (item.getBoundingClientRect().top <= 150) heading = item;
			else break;
		}
		if (heading && heading.id !== active) {
			active = heading.id;
			if (current) current.textContent = headingLabel(heading);
			toc?.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
				const selected =
					decodeURIComponent(link.hash.slice(1)) === active;
				if (selected) {
					link.setAttribute("aria-current", "location");
					const nav = link.parentElement!;
					if (
						!compact.matches &&
						(link.offsetTop < nav.scrollTop ||
							link.offsetTop + link.offsetHeight >
								nav.scrollTop + nav.clientHeight)
					)
						nav.scrollTop = link.offsetTop - nav.clientHeight / 3;
				} else link.removeAttribute("aria-current");
			});
		}
	}
	function schedule() {
		if (!scheduled) {
			scheduled = true;
			requestAnimationFrame(update);
		}
	}
	function codeTools() {
		flow.querySelectorAll<HTMLElement>(
			".expressive-code .frame:not([data-reader-tools])",
		).forEach((frame) => {
			frame.dataset.readerTools = "true";
			frame
				.querySelectorAll(".copy-btn")
				.forEach((button) => button.remove());
			const pre = frame.querySelector("pre")!;
			const wrapped = pre.classList.contains("wrap");
			frame.classList.toggle("wrap-code", wrapped);
			const tools = document.createElement("div");
			tools.className = "reader-code-tools";
			const language = document.createElement("span");
			language.textContent = frame.dataset.language || "代码";
			const wrap = document.createElement("button");
			wrap.type = "button";
			wrap.textContent = "自动换行";
			wrap.setAttribute("aria-pressed", String(wrapped));
			wrap.addEventListener(
				"click",
				() => {
					const on = frame.classList.toggle("wrap-code");
					pre.classList.toggle("wrap", on);
					wrap.setAttribute("aria-pressed", String(on));
					schedule();
				},
				{ signal },
			);
			const copy = document.createElement("button");
			copy.type = "button";
			copy.className = "copy-btn";
			copy.textContent = "复制";
			copy.setAttribute("aria-label", "复制代码");
			tools.append(language, wrap, copy);
			frame.prepend(tools);
		});
	}
	function refresh() {
		headings = [
			...flow.querySelectorAll<HTMLElement>(
				"h1[id],h2[id],h3[id],h4[id]",
			),
		];
		for (const heading of headings) {
			const link = heading.querySelector<HTMLAnchorElement>(".anchor");
			if (link) {
				link.setAttribute(
					"aria-label",
					`定位到：${headingLabel(heading)}`,
				);
				link.title = "链接到此标题";
			}
		}
		codeTools();
		schedule();
	}
	const resize = new ResizeObserver(schedule);
	resize.observe(panel);
	signal.addEventListener("abort", () => resize.disconnect(), { once: true });
	window.addEventListener("scroll", schedule, { passive: true, signal });
	window.addEventListener("resize", schedule, { passive: true, signal });
	flow.addEventListener("load", schedule, { capture: true, signal });
	document.querySelector("[data-reading-top]")?.addEventListener(
		"click",
		() =>
			window.scrollTo({
				top: 0,
				behavior: reducedMotion.matches ? "instant" : "smooth",
			}),
		{ signal },
	);
	document.addEventListener(
		"click",
		(event) => {
			const link = (event.target as Element)?.closest<HTMLAnchorElement>(
				"[data-reading-anchor]",
			);
			if (!link) return;
			const target = document.getElementById(
				decodeURIComponent(link.hash.slice(1)),
			);
			if (!target || !flow.contains(target)) return;
			event.preventDefault();
			target.scrollIntoView({
				block: "start",
				behavior: reducedMotion.matches ? "instant" : "smooth",
			});
			history.replaceState(history.state, "", link.hash);
			if (toc && compact.matches) toc.open = false;
		},
		{ signal },
	);
	const back = document.querySelector<HTMLAnchorElement>(".reading-back");
	try {
		const path = sessionStorage.getItem("lake-reading-return");
		if (back && path?.startsWith("/") && !path.startsWith("//")) {
			back.href = path;
			const label = back.querySelector("span");
			if (label)
				label.textContent = path.startsWith("/categories")
					? "分类"
					: path.startsWith("/tags")
						? "标签"
						: path.startsWith("/search")
							? "搜索"
							: "文章";
		}
	} catch {}
	flow.querySelector<HTMLFormElement>("[data-unlock-form]")?.addEventListener(
		"submit",
		async (event) => {
			event.preventDefault();
			const input =
					flow.querySelector<HTMLInputElement>("#article-password")!,
				box = flow.querySelector<HTMLElement>("[data-ciphertext]")!,
				status = flow.querySelector<HTMLElement>(
					"[data-unlock-status]",
				)!;
			let html: string;
			try {
				const { default: CryptoJS } = await import("crypto-js");
				if (signal.aborted) return;
				const result = CryptoJS.AES.decrypt(
					box.dataset.ciphertext!,
					input.value,
				).toString(CryptoJS.enc.Utf8);
				if (!result.startsWith("LAKE:")) throw Error("password");
				html = result.slice(5);
			} catch {
				status.textContent = "密码错误";
				input.focus();
				return;
			}
			input.value = "";
			flow.innerHTML = html;
			const nav = toc?.querySelector("nav");
			nav?.replaceChildren();
			for (const heading of flow.querySelectorAll<HTMLElement>(
				"h1[id],h2[id],h3[id],h4[id]",
			)) {
				const link = document.createElement("a");
				link.href = `#${heading.id}`;
				link.dataset.readingAnchor = "";
				link.style.setProperty("--depth", heading.tagName.slice(1));
				link.textContent = heading.textContent;
				nav?.append(link);
			}
			refresh();
			await enhanceContent(signal).catch(() => {});
			schedule();
		},
		{ signal },
	);
	refresh();
	void enhanceContent(signal)
		.then(schedule)
		.catch(() => {});
}
