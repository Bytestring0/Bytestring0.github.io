export function initPageControls(signal: AbortSignal) {
	const menus = [
		...document.querySelectorAll<HTMLDetailsElement>("[data-filter-menu]"),
	];
	for (const menu of menus) {
		const select = menu.querySelector<HTMLSelectElement>("select")!,
			summary = menu.querySelector("summary")!;
		const options = [
			...menu.querySelectorAll<HTMLButtonElement>("[data-filter-value]"),
		];
		const sync = () => {
			menu.querySelector("[data-filter-label]")!.textContent =
				select.selectedOptions[0]?.textContent || "";
			options.forEach((button) =>
				button.setAttribute(
					"aria-selected",
					String(button.dataset.filterValue === select.value),
				),
			);
		};
		sync();
		select.addEventListener("change", sync, { signal });
		menu.addEventListener(
			"toggle",
			() => {
				if (menu.open)
					menus.forEach((other) => {
						if (other !== menu) other.open = false;
					});
			},
			{ signal },
		);
		for (const button of options)
			button.addEventListener(
				"click",
				() => {
					select.value = button.dataset.filterValue || "";
					select.dispatchEvent(
						new Event("change", { bubbles: true }),
					);
					menu.open = false;
					summary.focus();
				},
				{ signal },
			);
		menu.addEventListener(
			"keydown",
			(event) => {
				if (event.key === "Escape") {
					event.preventDefault();
					event.stopPropagation();
					menu.open = false;
					summary.focus();
					return;
				}
				if (
					!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
				)
					return;
				event.preventDefault();
				menu.open = true;
				let index = options.indexOf(
					document.activeElement as HTMLButtonElement,
				);
				index =
					event.key === "Home"
						? 0
						: event.key === "End"
							? options.length - 1
							: Math.max(
									0,
									Math.min(
										options.length - 1,
										index +
											(event.key === "ArrowDown"
												? 1
												: -1),
									),
								);
				options[index]?.focus();
			},
			{ signal },
		);
	}
	document.addEventListener(
		"click",
		(event) =>
			menus.forEach((menu) => {
				if (!menu.contains(event.target as Node)) menu.open = false;
			}),
		{ signal },
	);
}
type Entry = {
	title: string;
	url: string;
	date: string;
	category: string;
	tags: string[];
	text: string;
};
export function initSearch(signal: AbortSignal) {
	const form = document.querySelector<HTMLFormElement>(".search-form"),
		input = document.querySelector<HTMLInputElement>("#lake-search"),
		list = document.querySelector<HTMLElement>("[data-search-results]");
	if (!form || !input || !list) return;
	const entries = JSON.parse(
		document.querySelector("#lake-search-index")?.textContent || "[]",
	) as Entry[];
	const source = entries.map((entry) => ({
		...entry,
		text: entry.text.replace(/\s+/g, " "),
		haystack:
			`${entry.title} ${entry.category} ${entry.tags.join(" ")} ${entry.text}`.toLowerCase(),
	}));
	let timer: ReturnType<typeof setTimeout>;
	function highlight(element: HTMLElement, text: string, terms: string[]) {
		if (!terms.length) {
			element.textContent = text;
			return;
		}
		const lower = text.toLowerCase();
		let cursor = 0;
		while (cursor < text.length) {
			let at = text.length,
				match = "";
			for (const term of terms) {
				const found = lower.indexOf(term, cursor);
				if (found >= 0 && found < at) {
					at = found;
					match = term;
				}
			}
			element.append(document.createTextNode(text.slice(cursor, at)));
			if (!match) break;
			const mark = document.createElement("mark");
			mark.textContent = text.slice(at, at + match.length);
			element.append(mark);
			cursor = at + match.length;
		}
	}
	function search() {
		if (signal.aborted) return;
		const query = input!.value.trim().slice(0, 160),
			terms = query.toLowerCase().split(/\s+/).filter(Boolean);
		const address = new URL(location.href);
		if (query) address.searchParams.set("q", query);
		else address.searchParams.delete("q");
		history.replaceState(history.state, "", address);
		const found = source
			.filter((entry) =>
				terms.every((term) => entry.haystack.includes(term)),
			)
			.map((entry) => ({
				entry,
				score: terms.reduce(
					(sum, term) =>
						sum +
						(entry.title.toLowerCase().includes(term) ? 8 : 0) +
						(entry.category.toLowerCase().includes(term) ? 3 : 0) +
						(entry.tags.some((tag) =>
							tag.toLowerCase().includes(term),
						)
							? 2
							: 0),
					0,
				),
			}))
			.sort(
				(a, b) =>
					b.score - a.score ||
					b.entry.date.localeCompare(a.entry.date),
			);
		document.querySelector("[data-search-heading]")!.textContent =
			terms.length ? "搜索结果" : "最近文章";
		document.querySelector(".search-status")!.textContent = terms.length
			? found.length
				? `${found.length} 篇文章`
				: "没有找到匹配的文章"
			: "";
		const fragment = document.createDocumentFragment();
		for (const { entry } of terms.length ? found : found.slice(0, 8)) {
			const link = document.createElement("a");
			link.className = "search-result";
			link.href = entry.url;
			const meta = document.createElement("div");
			meta.className = "search-result-meta";
			const time = document.createElement("time");
			time.dateTime = entry.date;
			time.textContent = entry.date.slice(0, 10).replaceAll("-", ".");
			const category = document.createElement("span");
			category.textContent = entry.category;
			meta.append(time, category);
			const title = document.createElement("h2");
			highlight(title, entry.title, terms);
			const excerpt = document.createElement("p");
			const at = terms.length
				? Math.max(0, entry.text.toLowerCase().indexOf(terms[0]) - 34)
				: 0;
			const snippet =
				(at ? "…" : "") +
				entry.text.slice(at, at + 150) +
				(entry.text.length > at + 150 ? "…" : "");
			highlight(excerpt, snippet, terms);
			link.append(meta, title);
			if (snippet) link.append(excerpt);
			fragment.append(link);
		}
		list!.replaceChildren(fragment);
	}
	input.value = new URLSearchParams(location.search).get("q") || "";
	form.addEventListener(
		"submit",
		(event) => {
			event.preventDefault();
			clearTimeout(timer);
			search();
		},
		{ signal },
	);
	input.addEventListener(
		"input",
		() => {
			clearTimeout(timer);
			timer = setTimeout(search, 140);
		},
		{ signal },
	);
	signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
	search();
}
