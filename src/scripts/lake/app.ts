import {
	navigate,
	type TransitionBeforePreparationEvent,
} from "astro:transitions/client";
import { Water, type WaterTransition } from "./water";
import { CanvasCamera } from "./camera";
import { clock, reducedMotion } from "./clock";
import { buildTimeline } from "../../utils/lake-timeline";
import { initReading } from "./content";
import { initBranches } from "./branches";
import { SceneZoom } from "./scene-zoom";
import { initPageControls, initSearch } from "./interface";

let water: Water | undefined;
try {
	const canvas = document.querySelector<HTMLCanvasElement>("#lake-water");
	if (canvas) water = new Water(canvas);
} catch {
	/* The procedural CSS lake remains usable without WebGL. */
}
let sceneZoom: SceneZoom | undefined;
let page: AbortController | undefined,
	camera: CanvasCamera | undefined,
	pending = false;
let gate: Promise<unknown> = Promise.resolve(),
	transition: WaterTransition | undefined;

function ripple(x: number, y: number, strength = 0.4) {
	if (water) {
		water.ripple(x, y, strength);
		return;
	}
	if (
		reducedMotion.matches ||
		document.documentElement.dataset.theme === "dark"
	)
		return;
	const ring = document.createElement("i");
	ring.className = "surface-ring";
	ring.style.left = `${x}px`;
	ring.style.top = `${y}px`;
	document.querySelector(".lake-environment")?.append(ring);
	const animation = ring.animate(
		[
			{ transform: "translate(-50%,-50%) scale(.05)", opacity: 0.24 },
			{ transform: "translate(-50%,-50%) scale(9)", opacity: 0 },
		],
		{ duration: 1600, easing: "cubic-bezier(.2,.6,.3,1)" },
	);
	animation.finished.finally(() => ring.remove()).catch(() => {});
}
function syncChrome() {
	const view = document.body.dataset.view;
	document
		.querySelectorAll<HTMLAnchorElement>("[data-nav-view]")
		.forEach((link) => {
			const active =
				link.dataset.navView ===
				(view === "reading" ? "archive" : view);
			if (active) link.setAttribute("aria-current", "page");
			else link.removeAttribute("aria-current");
		});
	const avatar = document.querySelector<HTMLAnchorElement>(".lake-avatar");
	if (avatar) {
		avatar.href = view === "home" ? "/archive/" : "/";
		avatar.setAttribute(
			"aria-label",
			view === "home" ? "查看文章" : "返回首页",
		);
	}
	document
		.querySelector("[data-theme-toggle]")
		?.setAttribute(
			"aria-pressed",
			String(document.documentElement.dataset.theme === "dark"),
		);
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute(
			"content",
			document.documentElement.dataset.theme === "dark"
				? "#1c2131"
				: "#d9e8f5",
		);
}

async function go(url: URL, origin: { x: number; y: number }) {
	if (pending) return;
	pending = true;
	transition =
		document.body.dataset.space === "overview"
			? undefined
			: water?.reveal(origin.x, origin.y);
	transition ||= {
		...origin,
		started: performance.now(),
		duration: 1350,
	};
	if (!water) ripple(origin.x, origin.y, 0.8);
	document.body.dataset.transitioning = "true";
	const main = document.querySelector<HTMLElement>("#lake-content");
	const overviewDeparture = sceneZoom?.prepareDeparture(origin);
	if (main && !reducedMotion.matches) {
		const current = getComputedStyle(main),
			from = current.transform === "none" ? "" : current.transform;
		const animation = main.animate(
			[
				{
					opacity: Number(current.opacity),
					transform: from || "scale(1)",
				},
				{ opacity: 0, transform: `${from} scale(.985)` },
			],
			{
				duration: 260,
				easing: "cubic-bezier(.4,0,.5,1)",
				fill: "forwards",
			},
		);
		gate = animation.finished.catch(() => {});
	} else gate = Promise.resolve();
	if (overviewDeparture) gate = Promise.all([gate, overviewDeparture]);
	try {
		await navigate(url.pathname + url.search + url.hash);
	} catch {
		location.assign(url.href);
	} finally {
		pending = false;
		delete document.body.dataset.transitioning;
	}
}
document.addEventListener(
	"click",
	(event) => {
		if (!(event.target instanceof Element)) return;
		if (event.target.closest("[data-theme-toggle]")) {
			const theme =
				document.documentElement.dataset.theme === "dark"
					? "light"
					: "dark";
			document.documentElement.dataset.theme = theme;
			document.documentElement.classList.toggle("dark", theme === "dark");
			try {
				localStorage.setItem("lake-theme", theme);
			} catch {}
			syncChrome();
			return;
		}
		if (sceneZoom && performance.now() < sceneZoom.draggedUntil) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		const link = event.target.closest<HTMLAnchorElement>("a[href]");
		if (
			!link ||
			event.defaultPrevented ||
			event.button !== 0 ||
			event.ctrlKey ||
			event.metaKey ||
			event.altKey ||
			event.shiftKey ||
			link.target ||
			link.hasAttribute("download") ||
			link.hasAttribute("data-astro-reload")
		)
			return;
		if (
			camera &&
			performance.now() < camera.draggedUntil &&
			link.closest("[data-canvas-view]")
		) {
			event.preventDefault();
			return;
		}
		const target = new URL(link.href, location.href);
		if (
			target.origin !== location.origin ||
			!/^https?:$/.test(target.protocol) ||
			/\.(xml|json|pdf|png|jpe?g|svg|zip)$/i.test(target.pathname) ||
			(target.pathname === location.pathname &&
				target.search === location.search)
		)
			return;
		event.preventDefault();
		if (
			link.matches(
				".timeline-card,.search-result,.recent-post,.branch-leaf",
			) &&
			document.body.dataset.view !== "reading"
		)
			try {
				sessionStorage.setItem(
					"lake-reading-return",
					location.pathname + location.search,
				);
			} catch {}
		const rect = link.getBoundingClientRect();
		void go(target, {
			x: rect.left + rect.width * 0.5,
			y: rect.top + rect.height * 0.5,
		});
	},
	{ capture: true },
);
let lastTrail = { x: 0, y: 0, time: 0 };
document.addEventListener(
	"pointermove",
	(event) => {
		if (
			event.pointerType === "touch" ||
			document.body.dataset.space === "overview" ||
			(document.body.dataset.view === "reading" &&
				document.body.dataset.space !== "overview") ||
			reducedMotion.matches
		)
			return;
		const now = performance.now();
		if (document.documentElement.dataset.theme === "dark") {
			if (now - lastTrail.time < 18) return;
			lastTrail = { x: event.clientX, y: event.clientY, time: now };
			water?.trail(event.clientX, event.clientY);
			return;
		}
		if ((event.target as Element)?.closest("[data-no-pan],input,button"))
			return;
		if (
			now - lastTrail.time < 70 ||
			Math.hypot(
				event.clientX - lastTrail.x,
				event.clientY - lastTrail.y,
			) < 22
		)
			return;
		lastTrail = { x: event.clientX, y: event.clientY, time: now };
		ripple(event.clientX, event.clientY, 0.055);
	},
	{ passive: true },
);
document.addEventListener(
	"pointerdown",
	(event) => {
		if (
			event.button === 0 &&
			!(event.target as Element)?.closest(
				"input,select,[data-no-pan],.reading-layout",
			)
		)
			ripple(event.clientX, event.clientY, 0.25);
	},
	{ passive: true },
);

function renderMonths(
	world: HTMLElement,
	months: ReturnType<typeof buildTimeline>["months"],
) {
	const container = world.querySelector<HTMLElement>(".timeline-months");
	if (!container) return;
	container.replaceChildren();
	for (const month of months) {
		const marker = document.createElement("div");
		marker.className = "month-marker";
		marker.dataset.month = month.key;
		marker.dataset.yearStart = String(month.yearStart);
		marker.style.left = `${month.x}px`;
		const tick = document.createElement("i"),
			time = document.createElement("time"),
			full = document.createElement("span"),
			year = document.createElement("span");
		full.className = "month-full";
		full.textContent = month.key.replace("-", ".");
		year.className = "month-year";
		year.textContent = month.key.slice(0, 4);
		time.append(full, year);
		marker.append(tick, time);
		container.append(marker);
	}
}
function initFilters(signal: AbortSignal) {
	const world = document.querySelector<HTMLElement>(".lake-world"),
		category = document.querySelector<HTMLSelectElement>(
			"[data-category-select]",
		),
		tag = document.querySelector<HTMLSelectElement>("[data-tag-select]"),
		month = document.querySelector<HTMLSelectElement>(
			"[data-month-select]",
		);
	if (!world || !category || !tag || !month) return;
	const elements = [...world.querySelectorAll<HTMLElement>("[data-post-id]")],
		params = new URLSearchParams(location.search);
	category.value =
		params.get("uncategorized") === "true"
			? "未分类"
			: params.get("category") || "";
	tag.value = params.get("tag") || "";
	function filter(initial = false) {
		const selected = elements.filter((element) => {
			const visible =
				(!category!.value ||
					element.dataset.category === category!.value) &&
				(!tag!.value ||
					(
						JSON.parse(element.dataset.tags || "[]") as string[]
					).includes(tag!.value));
			element.hidden = !visible;
			return visible;
		});
		const model = buildTimeline(
				selected.map((element) => ({
					id: element.dataset.postId!,
					date: element.dataset.date!,
				})),
			),
			map = new Map(model.items.map((item) => [item.id, item]));
		for (const element of selected) {
			const item = map.get(element.dataset.postId!)!;
			element.style.setProperty("--item-x", `${item.x}px`);
			element.style.setProperty("--item-y", `${item.y}px`);
			element.dataset.lane = String(item.lane);
		}
		world!.dataset.worldWidth = String(model.width);
		world!.querySelector<HTMLElement>(".timeline-axis")!.style.width =
			`${model.width}px`;
		renderMonths(world!, model.months);
		document.querySelector<HTMLElement>(".timeline-empty")!.hidden =
			selected.length > 0;
		camera?.refresh();
		if (!initial || category!.value || tag!.value) camera?.focusLatest();
		const address = new URL(location.href);
		for (const [key, value] of [
			["category", category!.value],
			["tag", tag!.value],
		]) {
			if (value) address.searchParams.set(key, value);
			else address.searchParams.delete(key);
		}
		address.searchParams.delete("uncategorized");
		history.replaceState(history.state, "", address);
	}
	filter(true);
	category.addEventListener("change", () => filter(), { signal });
	tag.addEventListener("change", () => filter(), { signal });
	month.addEventListener("change", () => camera?.focusMonth(month.value), {
		signal,
	});
	if (params.get("month")) {
		month.value = params.get("month")!;
		camera?.focusMonth(month.value);
	}
}

function initHover(signal: AbortSignal) {
	let hovered: HTMLElement | undefined, rect: DOMRect | undefined;
	document.addEventListener(
		"pointerover",
		(event) => {
			if (
				reducedMotion.matches ||
				event.pointerType === "touch" ||
				!(event.target instanceof Element)
			)
				return;
			const card = event.target.closest<HTMLElement>(
				".collection-card",
			);
			if (!card || card === hovered) return;
			hovered = card;
			rect = card.getBoundingClientRect();
		},
		{ signal },
	);
	document.addEventListener(
		"pointermove",
		(event) => {
			if (!hovered || !rect || reducedMotion.matches) return;
			const x = (event.clientX - rect.left) / rect.width,
				y = (event.clientY - rect.top) / rect.height;
			hovered.style.setProperty("--card-rx", `${(y - 0.5) * -4}deg`);
			hovered.style.setProperty("--card-ry", `${(x - 0.5) * 5}deg`);
			hovered.style.setProperty("--glare-x", `${x * 100}%`);
			hovered.style.setProperty("--glare-y", `${y * 100}%`);
		},
		{ passive: true, signal },
	);
	document.addEventListener(
		"pointerout",
		(event) => {
			if (!hovered) return;
			if (
				event.relatedTarget instanceof Node &&
				hovered.contains(event.relatedTarget)
			)
				return;
			hovered.style.setProperty("--card-rx", "0deg");
			hovered.style.setProperty("--card-ry", "0deg");
			hovered = undefined;
			rect = undefined;
		},
		{ signal },
	);
}
function arrival(signal: AbortSignal) {
	if (reducedMotion.matches) return;
	const main = document.querySelector<HTMLElement>("#lake-content");
	if (!main) return;
	if (document.body.dataset.view === "reading") {
		const animation = main.animate([{ opacity: 0.75 }, { opacity: 1 }], {
			duration: 280,
			easing: "ease-out",
		});
		signal.addEventListener("abort", () => animation.cancel(), {
			once: true,
		});
		return;
	}
	const elapsed = transition
		? performance.now() - transition.started
		: Infinity;
	if (transition && elapsed < transition.duration) {
		const { x, y, duration } = transition,
			radius = Math.hypot(innerWidth, innerHeight) * 1.1;
		const animation = main.animate(
			[
				{ clipPath: `circle(0px at ${x}px ${y}px)`, opacity: 0.4 },
				{
					clipPath: `circle(${radius}px at ${x}px ${y}px)`,
					opacity: 1,
				},
			],
			{ duration, easing: "cubic-bezier(.215,.61,.355,1)", fill: "both" },
		);
		animation.currentTime = elapsed;
		animation.finished.then(() => animation.cancel()).catch(() => {});
		signal.addEventListener("abort", () => animation.cancel(), {
			once: true,
		});
	} else if (document.body.dataset.view !== "home") {
		const animation = main.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 550,
			easing: "ease-out",
		});
		signal.addEventListener("abort", () => animation.cancel(), {
			once: true,
		});
	}
	const cards = [
		...document.querySelectorAll<HTMLElement>(
			".timeline-item,.collection-item",
		),
	]
		.filter((element) => element.style.visibility !== "hidden")
		.slice(0, 16);
	cards.forEach((element, i) => {
		const card = element.firstElementChild?.matches("a")
			? (element.firstElementChild as HTMLElement)
			: element.querySelector<HTMLElement>("a");
		if (!card) return;
		const animation = card.animate(
			[
				{
					opacity: 0,
					transform: "translate3d(0,16px,-10px) rotateX(4deg)",
				},
				{ opacity: 1, transform: "translate3d(0,0,0) rotateX(0deg)" },
			],
			{
				duration: 780,
				delay: Math.min(i * 42, 320),
				easing: "cubic-bezier(.2,.72,.16,1)",
				fill: "backwards",
			},
		);
		signal.addEventListener("abort", () => animation.cancel(), {
			once: true,
		});
	});
}
function initPage() {
	page?.abort();
	page = new AbortController();
	const { signal } = page;
	pending = false;
	delete document.body.dataset.transitioning;
	syncChrome();
	water?.updateView();
	camera = undefined;
	const viewport = document.querySelector<HTMLElement>("[data-canvas-view]"),
		world = viewport?.querySelector<HTMLElement>(".lake-world");
	if (viewport && world) camera = new CanvasCamera(viewport, world, signal);
	sceneZoom = new SceneZoom(camera, signal);
	initBranches(signal);
	initFilters(signal);
	initPageControls(signal);
	initSearch(signal);
	initHover(signal);
	initReading(signal);
	arrival(signal);
	document.addEventListener(
		"keydown",
		(event) => {
			if (
				event.ctrlKey ||
				event.metaKey ||
				event.altKey ||
				(event.target instanceof HTMLElement &&
					(event.target.matches("input,textarea,select") ||
						event.target.isContentEditable))
			)
				return;
			if (event.key === "/") {
				event.preventDefault();
				const input =
					document.querySelector<HTMLInputElement>("#lake-search");
				if (input) input.focus();
				else
					void go(new URL("/search/", location.href), {
						x: innerWidth * 0.5,
						y: innerHeight * 0.5,
					});
			}
			if (event.key === "Escape") {
				const toc = document.querySelector<HTMLDetailsElement>(
					"[data-reader-toc][open]",
				);
				if (toc) {
					toc.open = false;
					return;
				}
				if (document.body.dataset.view !== "home") {
					let path = "/";
					if (document.body.dataset.view === "reading")
						try {
							path =
								sessionStorage.getItem("lake-reading-return") ||
								"/archive/";
						} catch {
							path = "/archive/";
						}
					void go(new URL(path, location.href), {
						x: innerWidth * 0.5,
						y: innerHeight * 0.5,
					});
				}
			}
		},
		{ signal },
	);
	document.addEventListener(
		"click",
		async (event) => {
			if (!(event.target instanceof Element)) return;
			const copy = event.target.closest<HTMLElement>(
					".article-prose .copy-btn",
				),
				feed = event.target.closest<HTMLElement>("[data-copy-feed]"),
				site = event.target.closest<HTMLElement>("[data-copy-site]");
			if (site) {
				try {
					await navigator.clipboard.writeText(
						site.dataset.copySite || "",
					);
					document.querySelector(
						"[data-site-copy-status]",
					)!.textContent = "已复制";
				} catch {
					document.querySelector(
						"[data-site-copy-status]",
					)!.textContent = "请选中地址手动复制";
				}
				return;
			}
			if (!copy && !feed) return;
			try {
				if (feed) {
					await navigator.clipboard.writeText(
						feed.dataset.copyFeed || "",
					);
					document.querySelector<HTMLElement>(
						"[data-copy-status]",
					)!.textContent = "已复制";
				} else {
					const code = copy!
						.closest(".expressive-code,pre")
						?.querySelector("code");
					if (!code) return;
					const lines = [...code.querySelectorAll(".ec-line .code")];
					await navigator.clipboard.writeText(
						lines.length
							? lines
									.map((line) => line.textContent || "")
									.join("\n")
							: code.textContent || "",
					);
					copy!.classList.add("success");
					copy!.textContent = "已复制";
					copy!.setAttribute("aria-label", "已复制");
					setTimeout(() => {
						copy?.classList.remove("success");
						if (copy) copy.textContent = "复制";
						copy?.setAttribute("aria-label", "复制代码");
					}, 1600);
				}
			} catch {
				if (feed)
					document.querySelector<HTMLElement>(
						"[data-copy-status]",
					)!.textContent = "请选中地址手动复制";
			}
		},
		{ signal },
	);
}
document.addEventListener("astro:before-preparation", (event) => {
	const preparation = event as TransitionBeforePreparationEvent,
		loader = preparation.loader,
		departure = gate;
	preparation.loader = async () => {
		await Promise.all([loader(), departure]);
	};
});
document.addEventListener("astro:before-swap", (event) => {
	const next = (event as Event & { newDocument: Document }).newDocument;
	if (next) {
		next.documentElement.dataset.theme =
			document.documentElement.dataset.theme;
		next.documentElement.classList.toggle(
			"dark",
			document.documentElement.dataset.theme === "dark",
		);
	}
	page?.abort();
});
document.addEventListener("astro:page-load", initPage);
initPage();
clock.wake();
