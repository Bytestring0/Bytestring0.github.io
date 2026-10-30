import { reducedMotion } from "./clock";
export function initBranches(signal: AbortSignal) {
	const scene = document.querySelector<HTMLElement>("[data-branch-index]"),
		stage = scene?.querySelector<HTMLElement>(".branch-stage"),
		container = scene?.querySelector<HTMLElement>("[data-branch-rows]");
	if (!scene || !stage || !container) return;
	const surface = scene,
		scroller = stage,
		rows = container;
	const groups = [
		...rows.querySelectorAll<HTMLElement>("[data-branch-group]"),
	];
	const roots = groups.map(
		(group) => group.querySelector<HTMLButtonElement>(".branch-root")!,
	);
	const panels = groups.map(
		(group) => group.querySelector<HTMLElement>(".branch-canopy")!,
	);
	const kind = surface.dataset.treeKind || "category";
	const storageKey = `lake-branches:${location.pathname}`;
	let lastQuery = location.search;
	let columns = 0,
		active = -1,
		pinned = -1,
		timer: ReturnType<typeof setTimeout>,
		closeTimer: ReturnType<typeof setTimeout>,
		frame = 0;
	function state(index: number, on: boolean) {
		groups[index].dataset.open = String(on);
		roots[index].setAttribute("aria-expanded", String(on));
		panels[index].inert = !on;
		panels[index]
			.querySelectorAll<HTMLElement>("a,button")
			.forEach((link) => (link.tabIndex = on ? 0 : -1));
	}
	function draw(index: number) {
		const panel = panels[index],
			row = groups[index].parentElement!,
			svg = panel.querySelector<SVGSVGElement>("svg")!;
		const height = panel.offsetHeight,
			width = panel.clientWidth;
		row.style.setProperty("--canopy-height", `${height + 24}px`);
		svg.setAttribute("viewBox", `0 0 ${width} ${height + 24}`);
		svg.setAttribute("width", String(width));
		svg.setAttribute("height", String(height + 24));
		const dot =
				roots[index].querySelector<HTMLElement>(".branch-junction")!,
			dotRect = dot.getBoundingClientRect(),
			panelRect = panel.getBoundingClientRect();
		const scale = panelRect.width / Math.max(1, panel.clientWidth);
		const x = (dotRect.left + dotRect.width / 2 - panelRect.left) / scale,
			y = (dotRect.top + dotRect.height / 2 - panelRect.top) / scale + 24;
		const fragment = document.createDocumentFragment();
		panel
			.querySelectorAll<HTMLElement>(".branch-leaf")
			.forEach((leaf, i) => {
				const path = document.createElementNS(
						"http://www.w3.org/2000/svg",
						"path",
					),
					left = leaf.offsetLeft,
					top = leaf.offsetTop + 24;
				const first = top < 120;
				const d = first
					? `M ${x} ${y} C ${x} 42, ${left + leaf.offsetWidth / 2} 30, ${left + leaf.offsetWidth / 2} ${top}`
					: `M ${x} ${y} C ${x} 34, ${left - 12} 26, ${left - 12} 64 L ${left - 12} ${top + 20} Q ${left - 12} ${top + 29}, ${left} ${top + 29}`;
				path.setAttribute("d", d);
				path.setAttribute("pathLength", "1");
				path.style.setProperty("--leaf-order", String(Math.min(i, 12)));
				fragment.append(path);
			});
		svg.replaceChildren(fragment);
	}
	function schedule() {
		if (frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			if (signal.aborted) return;
			groups.forEach((group, i) => {
				if (group.dataset.open === "true") draw(i);
			});
		});
	}
	function close(index: number) {
		if (groups[index].dataset.open !== "true") return;
		state(index, false);
		groups[index].parentElement!.style.setProperty(
			"--canopy-height",
			"0px",
		);
		if (active === index) active = -1;
		if (pinned === index) pinned = -1;
	}
	/** Hover opening is temporary: fold it back once the pointer or focus leaves the row. */
	function scheduleClose(row: HTMLElement) {
		const opened = groups.filter(
			(group, i) =>
				group.parentElement === row &&
				group.dataset.open === "true" &&
				i !== pinned,
		);
		if (!opened.length) return;
		clearTimeout(closeTimer);
		closeTimer = setTimeout(() => {
			if (signal.aborted || row.matches(":hover")) return;
			for (const group of opened) {
				const index = groups.indexOf(group);
				if (index === pinned || group.contains(document.activeElement))
					continue;
				close(index);
			}
		}, 220);
	}
	function organize() {
		const min = kind === "tag" ? 128 : 144;
		const next = Math.max(
			1,
			Math.min(8, Math.floor((rows.clientWidth + 18) / (min + 18))),
		);
		if (next === columns) {
			schedule();
			return;
		}
		columns = next;
		const focused = document.activeElement as HTMLElement;
		const fragment = document.createDocumentFragment();
		for (let i = 0; i < groups.length; i += columns) {
			const row = document.createElement("div");
			row.className = "branch-row";
			row.style.setProperty(
				"--branch-columns",
				String(Math.min(columns, groups.length - i)),
			);
			const batch = groups.slice(i, i + columns),
				opened = batch.filter((group) => group.dataset.open === "true");
			const keep =
				batch.includes(groups[active]) &&
				groups[active]?.dataset.open === "true"
					? groups[active]
					: opened.at(-1);
			batch.forEach((group) => {
				const index = groups.indexOf(group);
				state(index, group === keep);
				row.append(group);
			});
			row.addEventListener(
				"pointerenter",
				() => clearTimeout(closeTimer),
				{
					signal,
				},
			);
			row.addEventListener("pointerleave", () => scheduleClose(row), {
				signal,
			});
			fragment.append(row);
		}
		rows.replaceChildren(fragment);
		rows.dataset.ready = "true";
		if (focused && surface.contains(focused))
			focused.focus({ preventScroll: true });
		schedule();
	}
	function reveal(root: HTMLElement) {
		const rect = root.getBoundingClientRect(),
			bounds = scroller.getBoundingClientRect();
		if (rect.top < bounds.top || rect.bottom > bounds.bottom)
			scroller.scrollBy({
				top: rect.top - bounds.top - 20,
				behavior: reducedMotion.matches ? "instant" : "smooth",
			});
	}
	function open(index: number, updateURL = true) {
		active = index;
		const row = groups[index].parentElement!;
		if (
			pinned >= 0 &&
			pinned !== index &&
			groups[pinned].parentElement === row
		)
			pinned = -1;
		groups.forEach((group, i) => {
			if (group.parentElement === row) state(i, i === index);
			roots[i].tabIndex = i === index ? 0 : -1;
		});
		draw(index);
		if (updateURL) {
			const address = new URL(location.href);
			address.searchParams.set(kind, groups[index].dataset.name!);
			address.searchParams.delete("uncategorized");
			lastQuery = address.search;
			history.replaceState(history.state, "", address);
		}
	}
	roots.forEach((root, i) => {
		root.tabIndex = i === 0 ? 0 : -1;
		root.addEventListener(
			"pointerenter",
			(event) => {
				clearTimeout(closeTimer);
				if (
					event.pointerType !== "mouse" ||
					document.body.classList.contains("scene-zooming") ||
					document.body.classList.contains("scene-dragging")
				)
					return;
				clearTimeout(timer);
				timer = setTimeout(() => {
					if (
						!signal.aborted &&
						!document.body.classList.contains("scene-dragging")
					) {
						open(i);
						pinned = -1;
					}
				}, 140);
			},
			{ signal },
		);
		root.addEventListener("pointerleave", () => clearTimeout(timer), {
			signal,
		});
		root.addEventListener(
			"click",
			() => {
				clearTimeout(timer);
				if (pinned === i && groups[i].dataset.open === "true") {
					close(i);
					return;
				}
				open(i);
				pinned = i;
			},
			{ signal },
		);
		root.addEventListener(
			"focus",
			() => {
				clearTimeout(closeTimer);
				open(i);
				reveal(root);
			},
			{ signal },
		);
		groups[i].addEventListener(
			"focusout",
			(event) => {
				const next = event.relatedTarget as Node | null;
				if (next && groups[i].contains(next)) return;
				if (pinned === i) return;
				if (groups[i].dataset.open === "true") close(i);
			},
			{ signal },
		);
		root.addEventListener(
			"keydown",
			(event) => {
				if (
					![
						"ArrowLeft",
						"ArrowRight",
						"ArrowDown",
						"ArrowUp",
						"Home",
						"End",
					].includes(event.key)
				)
					return;
				event.preventDefault();
				event.stopPropagation();
				if (event.key === "ArrowDown") {
					open(i);
					panels[i].querySelector<HTMLElement>("a,button")?.focus();
					return;
				}
				let next =
					event.key === "Home"
						? 0
						: event.key === "End"
							? roots.length - 1
							: i +
								(event.key === "ArrowLeft"
									? -1
									: event.key === "ArrowRight"
										? 1
										: -columns);
				next = Math.max(0, Math.min(roots.length - 1, next));
				roots[next].focus({ preventScroll: true });
			},
			{ signal },
		);
	});
	document.addEventListener(
		"pointerdown",
		(event) => {
			if (pinned < 0) return;
			if (groups[pinned].contains(event.target as Node)) return;
			close(pinned);
		},
		{ signal },
	);
	surface.addEventListener(
		"keydown",
		(event) => {
			if (event.key !== "Escape") return;
			const group = (event.target as Element).closest<HTMLElement>(
				"[data-branch-group]",
			);
			const index = group ? groups.indexOf(group) : active;
			if (index < 0 || groups[index].dataset.open !== "true") return;
			event.preventDefault();
			event.stopPropagation();
			close(index);
			scroller.focus({ preventScroll: true });
			roots.forEach((root, i) => (root.tabIndex = i === index ? 0 : -1));
		},
		{ signal },
	);
	rows.classList.add("is-restoring");
	organize();
	const resize = new ResizeObserver(organize);
	resize.observe(scroller);
	const contentResize = new ResizeObserver(schedule);
	panels.forEach((panel) => contentResize.observe(panel));
	const params = new URLSearchParams(location.search),
		requested =
			kind === "category" && params.get("uncategorized") === "true"
				? "未分类"
				: params.get(kind);
	try {
		const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
		if (saved?.query === location.search && Array.isArray(saved.open)) {
			for (const name of saved.open) {
				const index = groups.findIndex(
					(group) => group.dataset.name === name,
				);
				if (index >= 0) open(index, false);
			}
			scroller.scrollTop = Number(saved.top) || 0;
		}
	} catch {}
	const selected = groups.findIndex(
		(group) => group.dataset.name === requested,
	);
	if (selected >= 0) {
		open(selected, false);
		if (scroller.scrollTop === 0) reveal(roots[selected]);
	}
	requestAnimationFrame(() => {
		if (!signal.aborted) rows.classList.remove("is-restoring");
	});
	signal.addEventListener(
		"abort",
		() => {
			clearTimeout(timer);
			clearTimeout(closeTimer);
			cancelAnimationFrame(frame);
			resize.disconnect();
			contentResize.disconnect();
			try {
				sessionStorage.setItem(
					storageKey,
					JSON.stringify({
						query: lastQuery,
						top: scroller.scrollTop,
						open: groups
							.filter((group) => group.dataset.open === "true")
							.map((group) => group.dataset.name),
					}),
				);
			} catch {}
		},
		{ once: true },
	);
}
