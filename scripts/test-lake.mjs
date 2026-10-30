import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { transform } from "esbuild";
import { parse } from "node-html-parser";

const source = await readFile(
	new URL("../src/utils/lake-timeline.ts", import.meta.url),
	"utf8",
);
const { code } = await transform(source, { loader: "ts", format: "esm" });
const { buildTimeline, CARD_WIDTH, CARD_HEIGHT } = await import(
	`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);

test("dense months never overlap cards or truncate the canvas", () => {
	const records = Array.from({ length: 125 }, (_, i) => ({
		id: String(i),
		date: `2026-10-${String((i % 28) + 1).padStart(2, "0")}T08:00:00Z`,
	}));
	const layout = buildTimeline(records);
	assert.equal(layout.items.length, 125);
	for (let i = 0; i < layout.items.length; i++) {
		const a = layout.items[i];
		assert.ok(a.x >= 0 && a.x + CARD_WIDTH <= layout.width);
		for (let j = i + 1; j < layout.items.length; j++) {
			const b = layout.items[j];
			const overlap =
				Math.min(a.x + CARD_WIDTH, b.x + CARD_WIDTH) >
					Math.max(a.x, b.x) &&
				Math.min(a.y + CARD_HEIGHT, b.y + CARD_HEIGHT) >
					Math.max(a.y, b.y);
			assert.equal(overlap, false, `cards ${a.id} and ${b.id} overlap`);
		}
	}
});
test("the axis progresses from older dates on the left to newer dates on the right", () => {
	const records = [
		{ id: "new", date: "2026-10-29" },
		{ id: "old", date: "2025-07-10" },
		{ id: "middle", date: "2026-02-20" },
	];
	const result = buildTimeline(records);
	assert.deepEqual(
		result.items.map((item) => item.id),
		["old", "middle", "new"],
	);
	assert.deepEqual(
		result.months.map((month) => month.key),
		["2025-07", "2026-02", "2026-10"],
	);
	assert.ok(
		result.items[0].x < result.items[1].x &&
			result.items[1].x < result.items[2].x,
	);
});
test("empty, invalid, and same-day content remains deterministic", () => {
	assert.deepEqual(buildTimeline([]), {
		items: [],
		months: [],
		width: 620,
		height: 840,
	});
	assert.equal(
		buildTimeline([{ id: "bad", date: "not a date" }]).items.length,
		0,
	);
	const a = [
		{ id: "b", date: "2026-10-29" },
		{ id: "a", date: "2026-10-29" },
	];
	assert.deepEqual(buildTimeline(a), buildTimeline(a.toReversed()));
});
test("the built landing page contains only functional navigation text", async () => {
	const root = parse(
		await readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
	);
	assert.equal(root.querySelectorAll("#lake-water").length, 1);
	assert.ok(root.querySelector(".lake-avatar img"));
	const nav = root.querySelector(".lake-nav");
	assert.deepEqual(
		nav.querySelectorAll("a").map((link) => link.textContent.trim()),
		["文章", "分类", "项目", "友链", "关于", "搜索"],
	);
	assert.equal(root.querySelector("#lake-content").textContent.trim(), "");
	for (const node of root.querySelectorAll(
		"#lake-content h1,#lake-content h2,#lake-content footer",
	))
		assert.fail(`unexpected landing decoration: ${node.textContent}`);
	for (const link of nav.querySelectorAll("a")) {
		const href = link.getAttribute("href");
		await access(new URL(`../dist${href}index.html`, import.meta.url));
	}
	for (const path of [
		"../src/components/breeze",
		"../src/layouts/BreezeLayout.astro",
		"../public/assets/breeze",
	]) {
		await assert.rejects(access(new URL(path, import.meta.url)));
	}
});
test("every article link on the timeline resolves to a generated reading page", async () => {
	const root = parse(
			await readFile(
				new URL("../dist/archive/index.html", import.meta.url),
				"utf8",
			),
		),
		links = root.querySelectorAll(".timeline-card");
	assert.ok(links.length > 0);
	const dates = links.map((link) =>
		link.querySelector("time").getAttribute("datetime"),
	);
	assert.deepEqual(dates, dates.toSorted());
	for (const link of links) {
		const href = decodeURIComponent(link.getAttribute("href"));
		const html = await readFile(
			new URL(`../dist${href}index.html`, import.meta.url),
			"utf8",
		);
		const article = parse(html);
		assert.ok(article.querySelector("[data-reading-flow]"), href);
		assert.ok(article.querySelector(".reader-heading h1"), href);
		assert.equal(article.querySelectorAll(".reader-panel").length, 1);
	}
});

test("overview preserves one named, linked node per item without overlapping labels", async () => {
	const source = await readFile(
		new URL("../src/utils/lake-overview.ts", import.meta.url),
		"utf8",
	);
	const { code } = await transform(source, { loader: "ts", format: "esm" });
	const { layoutOverview } = await import(
		`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
	);
	const groups = [16, 72, 4, 6].map((count, index) => ({
		id: String(index),
		name: String(index),
		url: `/${index}/`,
		items: Array.from({ length: count }, (_, i) => ({
			name: `node-${index}-${i}`,
			url: `/${index}/${i}/`,
		})),
	}));
	const layout = layoutOverview(groups);
	for (const [index, group] of layout.entries()) {
		assert.deepEqual(
			group.nodes.map(({ name, url }) => ({ name, url })),
			groups[index].items,
		);
		assert.equal(group.edges.length, group.nodes.length - 1);
		const reached = new Set([0]);
		for (let n = 0; n < group.nodes.length; n++)
			for (const edge of group.edges) {
				if (reached.has(edge.a)) reached.add(edge.b);
				if (reached.has(edge.b)) reached.add(edge.a);
			}
		assert.equal(reached.size, group.nodes.length);
		for (const [i, a] of group.nodes.entries()) {
			assert.ok(
				a.x - 6 >= 0 && a.x - 6 + a.labelWidth <= group.width,
				`node ${a.name} exceeds its cluster`,
			);
			for (const b of group.nodes.slice(i + 1))
				assert.ok(
					Math.abs(a.x - b.x) >=
						Math.max(a.labelWidth, b.labelWidth) ||
						Math.abs(a.y - b.y) >= 80,
					`labels overlap: ${a.name}, ${b.name}`,
				);
		}
	}
	assert.ok(
		layout[3].y > layout[1].y + layout[1].height,
		"dense tags must not overlap projects",
	);
});

test("plain wheel zooms at the pointer, enters overview at minimum and restores the view", async () => {
	const source = (
		await readFile(
			new URL("../src/scripts/lake/camera.ts", import.meta.url),
			"utf8",
		)
	).replace(
		'import { clock, reducedMotion } from "./clock";',
		"const clock={add:()=>()=>{},wake:()=>{}};const reducedMotion={matches:true};",
	);
	const { code } = await transform(source, { loader: "ts", format: "esm" });
	class Surface extends EventTarget {
		clientWidth = 1200;
		clientHeight = 600;
		dataset = {};
		style = {
			setProperty() {},
			getPropertyValue() {
				return "0";
			},
		};
		classList = { add() {}, remove() {} };
		closest() {
			return null;
		}
		querySelector() {
			return null;
		}
		querySelectorAll() {
			return [];
		}
		getBoundingClientRect() {
			return { left: 0, top: 100, width: 1200, height: 600 };
		}
	}
	const replacements = {
		Element: Surface,
		document: new Surface(),
		window: new Surface(),
		innerWidth: 1200,
		innerHeight: 800,
		sessionStorage: {
			getItem() {
				return null;
			},
			setItem() {},
		},
	};
	const previous = new Map(
		Object.keys(replacements).map((key) => [
			key,
			Object.getOwnPropertyDescriptor(globalThis, key),
		]),
	);
	Object.assign(globalThis, replacements);
	const abort = new AbortController();
	try {
		const { CanvasCamera } = await import(
			`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
		);
		const viewport = new Surface(),
			world = new Surface();
		world.dataset = { worldWidth: "8000", worldHeight: "840" };
		const camera = new CanvasCamera(viewport, world, abort.signal),
			saved = { x: -1000, y: 300, scale: 0.8 };
		camera.restore(saved);
		function wheel(delta) {
			const event = new Event("wheel", { cancelable: true });
			Object.defineProperties(event, {
				deltaY: { value: delta },
				deltaMode: { value: 0 },
				clientX: { value: 600 },
				clientY: { value: 200 },
			});
			viewport.dispatchEvent(event);
			assert.ok(event.defaultPrevented);
		}
		const anchor = (600 - saved.x) / saved.scale;
		wheel(-120);
		const zoomed = camera.snapshot();
		assert.ok(zoomed.scale > saved.scale);
		assert.ok(Math.abs((600 - zoomed.x) / zoomed.scale - anchor) < 1e-6);
		let minimum = 0;
		camera.onMinimum = () => minimum++;
		for (let i = 0; i < 20; i++) wheel(180);
		assert.equal(camera.snapshot().scale, 0.13);
		assert.ok(minimum > 0);
		camera.restore(saved);
		assert.deepEqual(camera.snapshot(), saved);
	} finally {
		abort.abort();
		for (const [key, descriptor] of previous) {
			if (descriptor) Object.defineProperty(globalThis, key, descriptor);
			else delete globalThis[key];
		}
	}
});
