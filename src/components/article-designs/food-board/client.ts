import {
	tiers,
	criteria,
	cardHtml,
	rankingHtml,
	qualitative,
	safeImage,
	type FoodCard,
	type Tier,
} from "./model";
import { exportBoardImage } from "./export-image";

// Validate before replacing live data: a failed import must leave the board intact.
function validateCards(payload: unknown): FoodCard[] {
	const records = Array.isArray(payload)
		? payload
		: (payload as { cards?: unknown })?.cards;
	if (!Array.isArray(records) || records.length > 200)
		throw new Error("请选择包含 cards 数组的 JSON，最多支持 200 张卡片");
	const ids = new Set<string>();
	return records.map((record, index) => {
		if (
			!record ||
			typeof record !== "object" ||
			typeof record.name !== "string" ||
			!record.name.trim() ||
			record.name.length > 80 ||
			typeof record.summary !== "string" ||
			record.summary.length > 1000 ||
			!tiers.includes(record.overall?.tier)
		)
			throw new Error(`第 ${index + 1} 张卡片的名字、评价或档位无效`);
		const score = (value: unknown): number => {
			if (
				typeof value !== "number" ||
				!Number.isFinite(value) ||
				value < 0 ||
				value > 5
			)
				throw new Error(`第 ${index + 1} 张卡片的评分需在 0 到 5 之间`);
			return value;
		};
		let id =
			typeof record.id === "string" && record.id.length < 100
				? record.id
				: `import-${index}`;
		while (ids.has(id)) id += "-copy";
		ids.add(id);
		return {
			id,
			name: record.name.trim(),
			summary: record.summary,
			imageUrl:
				typeof record.imageUrl === "string" &&
				record.imageUrl.length < 2000 &&
				!record.imageUrl.startsWith("data:")
					? record.imageUrl.replace(/\\/g, "/")
					: "",
			ratings: Object.fromEntries(
				Object.keys(criteria).map((key) => [
					key,
					score(record.ratings?.[key]),
				]),
			) as FoodCard["ratings"],
			overall: {
				score:
					record.overall.score === null
						? null
						: score(record.overall.score),
				tier: record.overall.tier,
			},
			layout: {
				rotation: Number.isFinite(record.layout?.rotation)
					? Math.max(-8, Math.min(8, record.layout.rotation))
					: [-3, 2.5, -1.8, 3.2, -2.2][index % 5],
				order: Number.isFinite(record.layout?.order)
					? record.layout.order
					: index,
			},
		};
	});
}

class FoodPostcardBoard extends HTMLElement {
	cards: FoodCard[] = [];
	seed: FoodCard[] = [];
	controller?: AbortController;
	storageKey = "";
	editingId?: string;
	ignoreClick = false;
	objectUrls = new Set<string>();
	downloadTimers = new Set<number>();
	drag?: {
		element: HTMLElement;
		pointerId: number;
		startX: number;
		startY: number;
		grabX: number;
		grabY: number;
		ghost?: HTMLElement;
		snapshot: FoodCard[];
		scrollFrame?: number;
		lastX: number;
		lastY: number;
	};
	connectedCallback() {
		this.controller?.abort();
		this.controller = new AbortController();
		const signal = this.controller.signal;
		this.seed = JSON.parse(
			this.querySelector("[data-board-seed]")!.textContent!,
		);
		this.cards = structuredClone(this.seed);
		this.storageKey = this.dataset.storageKey!;
		try {
			const saved = JSON.parse(
				localStorage.getItem(this.storageKey) || "null",
			);
			if (saved?.sourceSignature === JSON.stringify(this.seed))
				this.cards = this.resolveImages(validateCards(saved));
		} catch {
			/* A disabled store or old format does not prevent reading. */
		}
		this.render();
		this.addEventListener("click", (event) => this.onClick(event), {
			signal,
		});
		this.addEventListener(
			"pointerdown",
			(event) => this.onPointerDown(event),
			{ signal },
		);
		window.addEventListener(
			"pointermove",
			(event) => this.onPointerMove(event),
			{ signal, passive: false },
		);
		window.addEventListener("pointerup", () => this.endDrag(false), {
			signal,
		});
		window.addEventListener("pointercancel", () => this.endDrag(true), {
			signal,
		});
		this.addEventListener("keydown", (event) => this.onKeyDown(event), {
			signal,
		});
		this.addEventListener("change", (event) => this.onChange(event), {
			signal,
		});
		this.addEventListener(
			"input",
			(event) => {
				const input = event.target as HTMLInputElement;
				if (input.type === "range") {
					delete input.dataset.unrated;
					input.parentElement!.querySelector("output")!.textContent =
						qualitative(Number(input.value));
				}
			},
			{ signal },
		);
		this.querySelector("[data-card-form]")!.addEventListener(
			"submit",
			(event) => {
				event.preventDefault();
				void this.submitCard();
			},
			{ signal },
		);
		this.addEventListener(
			"error",
			(event) => {
				const image = event.target;
				if (image instanceof HTMLImageElement) {
					image.hidden = true;
					const fallback =
						image.parentElement?.querySelector<HTMLElement>(
							".photo-fallback",
						);
					if (fallback) {
						fallback.hidden = false;
						fallback.style.display = "grid";
					}
				}
			},
			{ signal, capture: true },
		);
	}
	disconnectedCallback() {
		this.endDrag(true);
		this.controller?.abort();
		for (const timer of this.downloadTimers) clearTimeout(timer);
		for (const url of this.objectUrls) URL.revokeObjectURL(url);
		this.downloadTimers.clear();
		this.objectUrls.clear();
	}
	resolveImages(cards: FoodCard[]) {
		return cards.map((card) => ({
			...card,
			imageDisplay:
				this.seed.find((seed) => seed.imageUrl === card.imageUrl)
					?.imageDisplay || safeImage(card.imageUrl),
		}));
	}
	publicCards() {
		return this.cards.map(({ imageDisplay: _display, ...card }) => ({
			...card,
			imageUrl: card.imageUrl.startsWith("data:") ? "" : card.imageUrl,
		}));
	}
	save() {
		try {
			localStorage.setItem(
				this.storageKey,
				JSON.stringify({
					version: 1,
					sourceSignature: JSON.stringify(this.seed),
					cards: this.publicCards(),
				}),
			);
		} catch {
			this.status("当前浏览器无法保存布局，请导出 JSON 留存。");
		}
	}
	status(message: string) {
		this.querySelector("[data-status]")!.textContent = message;
	}
	zones() {
		return [...this.querySelectorAll<HTMLElement>("[data-tier-zone]")];
	}
	render() {
		this.cards.sort((a, b) => a.layout.order - b.layout.order);
		for (const zone of this.zones())
			zone.innerHTML = this.cards
				.filter((card) => card.overall.tier === zone.dataset.tierZone)
				.map(cardHtml)
				.join("");
		this.refreshRanking();
	}
	refreshRanking() {
		this.querySelector("[data-ranking-list]")!.innerHTML = rankingHtml(
			this.cards,
		);
	}
	cardElement(target: EventTarget | null) {
		return target instanceof Element
			? target.closest<HTMLElement>(".postcard:not(.drag-ghost)")
			: null;
	}
	async onClick(event: MouseEvent) {
		if (this.ignoreClick) {
			this.ignoreClick = false;
			return;
		}
		const target = event.target as Element;
		const card = this.cardElement(target);
		if (target.closest("[data-edit-card]") && card) {
			this.openForm(card.dataset.cardId);
			return;
		}
		const button = target.closest<HTMLButtonElement>("[data-action]");
		if (!button) {
			if (card && !target.closest("select,.card-details,.drag-handle")) {
				const opening = !card.classList.contains("is-open");
				this.querySelectorAll(".is-open").forEach((item) =>
					item.classList.remove("is-open"),
				);
				card.classList.toggle("is-open", opening);
			}
			return;
		}
		switch (button.dataset.action) {
			case "add":
				this.openForm();
				break;
			case "close-dialog":
				this.querySelector<HTMLDialogElement>("dialog")!.close();
				break;
			case "import":
				this.querySelector<HTMLInputElement>(
					"[data-import-file]",
				)!.click();
				break;
			case "export-json":
				this.download(
					new Blob(
						[
							JSON.stringify(
								{
									version: 1,
									title: "锐评北门食堂",
									tiers,
									cards: this.publicCards(),
								},
								null,
								2,
							),
						],
						{ type: "application/json;charset=utf-8" },
					),
					"北门食评.json",
				);
				this.status(
					"JSON 已导出，可用“导入 JSON”恢复。上传图片请另外保存。",
				);
				break;
			case "reset":
				this.cards = structuredClone(this.seed);
				this.render();
				this.save();
				this.status("已还原文章中的原始分档与评价。");
				break;
			case "export-image": {
				button.disabled = true;
				button.textContent = "正在生成图片…";
				this.status("正在绘制当前分档板…");
				try {
					const result = await exportBoardImage(
						this.querySelector<HTMLElement>("[data-tier-board]")!,
						structuredClone(this.cards),
					);
					if (!this.isConnected) return;
					this.download(result.blob, "北门食评分档板.png");
					this.status(
						result.missing
							? `PNG 已导出；${result.missing} 张外部图片无法读取，已用占位图代替。可上传图片后重新导出。`
							: "分档板 PNG 已导出。",
					);
				} catch {
					this.status("图片导出失败，请重新尝试。");
				} finally {
					button.disabled = false;
					button.textContent = "导出分档图片 ↗";
				}
				break;
			}
		}
	}
	async onChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.matches("[data-import-file]")) {
			const file = input.files?.[0];
			if (!file) return;
			try {
				if (file.size > 2 * 1024 * 1024)
					throw new Error("JSON 文件过大，请选择小于 2 MB 的文件");
				const cards = this.resolveImages(
					validateCards(JSON.parse(await file.text())),
				);
				this.cards = cards;
				this.render();
				this.save();
				this.status(
					`已导入 ${cards.length} 张卡片，评价、档位与排列已恢复。可在卡片中“编辑 / 补图”。`,
				);
			} catch (error) {
				this.status(
					`导入失败：${error instanceof Error ? error.message : "JSON 格式无效"}`,
				);
			}
			input.value = "";
		} else if (input.matches("[data-tier-select]")) {
			const card = this.cardElement(input);
			if (!card) return;
			this.moveCard(card, input.value as Tier);
			this.save();
			this.status(`已将卡片移到${input.value}档。`);
			card.focus();
		}
	}
	openForm(id?: string) {
		this.editingId = id;
		const form = this.querySelector<HTMLFormElement>("form")!;
		form.reset();
		const card = this.cards.find((item) => item.id === id);
		this.querySelector("#new-card-title")!.textContent = card
			? "编辑食评明信片"
			: "新建食评明信片";
		form.querySelector("[type=submit]")!.textContent = card
			? "保存修改 ↗"
			: "加入分档板 ↗";
		if (card) {
			const values = {
				name: card.name,
				summary: card.summary,
				imageUrl: /^https?:/.test(card.imageUrl) ? card.imageUrl : "",
				tier: card.overall.tier,
				score: card.overall.score ?? 3,
				...card.ratings,
			};
			for (const [key, value] of Object.entries(values))
				(form.elements.namedItem(key) as HTMLInputElement).value =
					String(value);
		}
		form.querySelectorAll<HTMLInputElement>("[type=range]").forEach(
			(input) => {
				delete input.dataset.unrated;
				const unrated =
					input.name === "score" && card?.overall.score === null;
				if (unrated) input.dataset.unrated = "true";
				input.parentElement!.querySelector("output")!.textContent =
					qualitative(unrated ? null : Number(input.value));
			},
		);
		this.querySelector<HTMLDialogElement>("dialog")!.showModal();
	}
	async submitCard() {
		const form = this.querySelector<HTMLFormElement>("form")!;
		const data = new FormData(form);
		const oldCard = this.cards.find((card) => card.id === this.editingId);
		const file = data.get("imageFile") as File;
		let imageDisplay = oldCard?.imageDisplay;
		let imageUrl =
			String(data.get("imageUrl") || "").trim() ||
			oldCard?.imageUrl ||
			"";
		const submit = form.querySelector<HTMLButtonElement>("[type=submit]")!;
		if (
			!String(data.get("name")).trim() ||
			!String(data.get("summary")).trim()
		) {
			this.status("请填写名字和一句话评价。");
			return;
		}
		submit.disabled = true;
		try {
			if (file?.size) {
				if (
					file.size > 8 * 1024 * 1024 ||
					!/^image\/(png|jpeg|webp|gif)$/.test(file.type)
				)
					throw new Error(
						"请选择小于 8 MB 的 PNG、JPEG、WebP 或 GIF 图片",
					);
				imageDisplay = await new Promise<string>((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => resolve(String(reader.result));
					reader.onerror = () => reject(new Error("图片读取失败"));
					reader.readAsDataURL(file);
				});
				imageUrl = "";
			} else if (imageUrl !== oldCard?.imageUrl)
				imageDisplay = safeImage(imageUrl);
			if (!this.isConnected) return;
			const card: FoodCard = {
				id: oldCard?.id || crypto.randomUUID(),
				name: String(data.get("name")).trim(),
				summary: String(data.get("summary")).trim(),
				imageUrl,
				imageDisplay,
				ratings: Object.fromEntries(
					Object.keys(criteria).map((key) => [
						key,
						Number(data.get(key)),
					]),
				) as FoodCard["ratings"],
				overall: {
					score: (
						form.elements.namedItem("score") as HTMLInputElement
					).dataset.unrated
						? null
						: Number(data.get("score")),
					tier: data.get("tier") as Tier,
				},
				layout: oldCard?.layout || {
					order: this.cards.length,
					rotation: Math.random() * 6 - 3,
				},
			};
			if (oldCard) this.cards[this.cards.indexOf(oldCard)] = card;
			else this.cards.push(card);
			this.render();
			this.save();
			this.querySelector<HTMLDialogElement>("dialog")!.close();
			this.status(
				oldCard
					? "卡片已更新，排行榜已同步。"
					: "新明信片已加入分档板，排行榜已同步。",
			);
		} catch (error) {
			this.status(
				error instanceof Error ? error.message : "卡片保存失败",
			);
		} finally {
			submit.disabled = false;
		}
	}
	download(blob: Blob, name: string) {
		const url = URL.createObjectURL(blob);
		this.objectUrls.add(url);
		const link = document.createElement("a");
		link.href = url;
		link.download = name;
		link.click();
		const timer = window.setTimeout(() => {
			URL.revokeObjectURL(url);
			this.objectUrls.delete(url);
			this.downloadTimers.delete(timer);
		}, 2000);
		this.downloadTimers.add(timer);
	}
	readOrder() {
		this.zones()
			.flatMap((zone) => [
				...zone.querySelectorAll<HTMLElement>(".postcard"),
			])
			.forEach((element, order) => {
				const card = this.cards.find(
					(item) => item.id === element.dataset.cardId,
				)!;
				card.overall.tier = element.closest<HTMLElement>(
					"[data-tier-zone]",
				)!.dataset.tierZone as Tier;
				card.layout.order = order;
				const select =
					element.querySelector<HTMLSelectElement>(
						"[data-tier-select]",
					);
				if (select) select.value = card.overall.tier;
			});
	}
	moveCard(element: HTMLElement, tier: Tier, before?: HTMLElement) {
		const positions = new Map(
			[
				...this.querySelectorAll<HTMLElement>(".tier-cards .postcard"),
			].map((card) => [
				card,
				{
					x: card.offsetLeft,
					y: card.offsetTop,
					parent: card.parentElement,
				},
			]),
		);
		const zone = this.zones().find(
			(zone) => zone.dataset.tierZone === tier,
		)!;
		if (before && before !== element) zone.insertBefore(element, before);
		else zone.append(element);
		this.readOrder();
		this.refreshRanking();
		if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
			for (const [card, previous] of positions) {
				if (
					card === this.drag?.element ||
					previous.parent !== card.parentElement
				)
					continue;
				const x = previous.x - card.offsetLeft,
					y = previous.y - card.offsetTop;
				if (x || y)
					card.animate(
						[
							{
								transform: `translate(${x}px,${y}px) rotate(${card.style.getPropertyValue("--tilt")})`,
							},
							{
								transform: `rotate(${card.style.getPropertyValue("--tilt")})`,
							},
						],
						{ duration: 250, easing: "cubic-bezier(.2,.8,.2,1)" },
					);
			}
		}
	}
	onPointerDown(event: PointerEvent) {
		if (event.button !== 0 || this.drag) return;
		const target = event.target as Element,
			card = this.cardElement(target);
		if (
			!card ||
			target.closest(".card-details") ||
			(event.pointerType === "touch" && !target.closest(".drag-handle"))
		)
			return;
		const rect = card.getBoundingClientRect();
		this.drag = {
			element: card,
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			grabX: event.clientX - rect.left,
			grabY: event.clientY - rect.top,
			snapshot: structuredClone(this.cards),
			lastX: event.clientX,
			lastY: event.clientY,
		};
		if (target.closest(".drag-handle")) event.preventDefault();
	}
	onPointerMove(event: PointerEvent) {
		const drag = this.drag;
		if (!drag || event.pointerId !== drag.pointerId) return;
		drag.lastX = event.clientX;
		drag.lastY = event.clientY;
		if (
			!drag.ghost &&
			Math.hypot(
				event.clientX - drag.startX,
				event.clientY - drag.startY,
			) < 6
		)
			return;
		event.preventDefault();
		if (!drag.ghost) {
			this.ignoreClick = true;
			drag.element.classList.remove("is-open");
			(document.activeElement as HTMLElement)?.blur();
			drag.ghost = drag.element.cloneNode(true) as HTMLElement;
			drag.ghost.className = "postcard drag-ghost";
			drag.ghost.removeAttribute("data-card-id");
			drag.ghost.setAttribute("aria-hidden", "true");
			this.append(drag.ghost);
			drag.element.classList.add("is-dragging");
			drag.element.setPointerCapture(event.pointerId);
			this.autoScroll();
		}
		drag.ghost.style.left = `${event.clientX - drag.grabX}px`;
		drag.ghost.style.top = `${event.clientY - drag.grabY}px`;
		this.placeDraggedCard(event.clientX, event.clientY);
	}
	placeDraggedCard(x: number, y: number) {
		const drag = this.drag;
		if (!drag?.ghost) return;
		const zone = this.zones().find((zone) => {
			const rect = zone.getBoundingClientRect();
			return (
				x >= rect.left &&
				x <= rect.right &&
				y >= rect.top &&
				y <= rect.bottom
			);
		});
		this.zones().forEach((item) =>
			item.classList.toggle("drag-over", item === zone),
		);
		if (!zone) return;
		const siblings = [
			...zone.querySelectorAll<HTMLElement>(".postcard"),
		].filter((card) => card !== drag.element);
		const before = siblings.find((card) => {
			const rect = card.getBoundingClientRect();
			return (
				y < rect.top ||
				(y <= rect.bottom && x < rect.left + rect.width / 2)
			);
		});
		if (
			drag.element.parentElement !== zone ||
			drag.element.nextElementSibling !== (before || null)
		)
			this.moveCard(drag.element, zone.dataset.tierZone as Tier, before);
	}
	autoScroll() {
		const drag = this.drag;
		if (!drag?.ghost) return;
		const step =
			drag.lastY < 90
				? -Math.min(18, (90 - drag.lastY) / 4)
				: drag.lastY > innerHeight - 90
					? Math.min(18, (drag.lastY - innerHeight + 90) / 4)
					: 0;
		if (step) {
			window.scrollBy(0, step);
			this.placeDraggedCard(drag.lastX, drag.lastY);
		}
		drag.scrollFrame = requestAnimationFrame(() => this.autoScroll());
	}
	endDrag(cancel: boolean) {
		const drag = this.drag;
		if (!drag) return;
		this.drag = undefined;
		if (drag.scrollFrame) cancelAnimationFrame(drag.scrollFrame);
		drag.ghost?.remove();
		drag.element.classList.remove("is-dragging");
		if (drag.element.hasPointerCapture(drag.pointerId))
			drag.element.releasePointerCapture(drag.pointerId);
		this.zones().forEach((zone) => zone.classList.remove("drag-over"));
		if (drag.ghost) {
			if (cancel) {
				this.cards = drag.snapshot;
				this.render();
				this.status("已取消这次拖动。");
			} else {
				this.readOrder();
				this.save();
				this.status(
					`已移动到${this.cards.find((card) => card.id === drag.element.dataset.cardId)!.overall.tier}档，布局已保存。`,
				);
			}
		}
	}
	onKeyDown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			this.endDrag(true);
			this.querySelectorAll(".is-open").forEach((card) =>
				card.classList.remove("is-open"),
			);
			return;
		}
		const card = this.cardElement(event.target);
		if (!card) return;
		if (
			event.target === card &&
			(event.key === "Enter" || event.key === " ")
		) {
			event.preventDefault();
			card.classList.toggle("is-open");
			return;
		}
		if (!(event.target as Element).closest(".drag-handle")) return;
		const item = this.cards.find(
			(item) => item.id === card.dataset.cardId,
		)!;
		if (event.key === "ArrowUp" || event.key === "ArrowDown") {
			event.preventDefault();
			const index = Math.max(
				0,
				Math.min(
					tiers.length - 1,
					tiers.indexOf(item.overall.tier) +
						(event.key === "ArrowUp" ? -1 : 1),
				),
			);
			this.moveCard(card, tiers[index]);
			card.querySelector<HTMLButtonElement>(".drag-handle")!.focus({
				preventScroll: true,
			});
			this.save();
			this.status(`已移动到${tiers[index]}档。`);
		} else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
			event.preventDefault();
			const siblings = [
					...card.parentElement!.querySelectorAll<HTMLElement>(
						".postcard",
					),
				],
				index = siblings.indexOf(card);
			if (event.key === "ArrowLeft" && index > 0)
				this.moveCard(card, item.overall.tier, siblings[index - 1]);
			if (event.key === "ArrowRight" && index < siblings.length - 1)
				this.moveCard(card, item.overall.tier, siblings[index + 2]);
			this.save();
			this.status("卡片顺序已保存。");
			card.querySelector<HTMLButtonElement>(".drag-handle")!.focus({
				preventScroll: true,
			});
		}
	}
}
if (!customElements.get("food-postcard-board"))
	customElements.define("food-postcard-board", FoodPostcardBoard);
