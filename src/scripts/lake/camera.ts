import { clock, reducedMotion } from "./clock";
export class CanvasCamera {
	private x = 0;
	private y = 0;
	private scale = 0.8;
	private tx = 0;
	private ty = 0;
	private targetScale = 0.8;
	private velocityX = 0;
	private velocityY = 0;
	private dragging = false;
	private pointers = new Map<number, { x: number; y: number }>();
	private dragStart = { x: 0, y: 0 };
	private lastMove = 0;
	private pinch = 0;
	private pinchCenter = { x: 0, y: 0 };
	private width = innerWidth;
	private height = innerHeight;
	private worldWidth = 620;
	private worldHeight = 840;
	private cards: { element: HTMLElement; x: number; visible: boolean }[] = [];
	private changed = true;
	private lastScale = 0;
	private labelScale = 0;
	private monthLayer?: HTMLElement;
	private months: { key: string; x: number }[] = [];
	private position?: HTMLInputElement;
	private removeFrame: () => void;
	draggedUntil = 0;
	onMinimum?: () => void;
	snapshot() {
		return { x: this.tx, y: this.ty, scale: this.targetScale };
	}
	restore(view: { x: number; y: number; scale: number }) {
		this.tx = view.x;
		this.ty = view.y;
		this.targetScale = view.scale;
		this.velocityX = this.velocityY = 0;
		this.limit();
		clock.wake();
	}
	zoomBy(delta: number, point: { x: number; y: number }) {
		const rect = this.viewport.getBoundingClientRect();
		this.zoom(
			this.targetScale *
				Math.exp(-Math.max(-180, Math.min(180, delta)) * 0.003),
			{ x: point.x - rect.left, y: point.y - rect.top },
		);
	}

	constructor(
		private viewport: HTMLElement,
		private world: HTMLElement,
		private signal: AbortSignal,
	) {
		this.width = viewport.clientWidth;
		this.height = viewport.clientHeight;
		this.position =
			document.querySelector<HTMLInputElement>(
				"[data-timeline-position]",
			) || undefined;
		this.worldWidth = Number(world.dataset.worldWidth) || 620;
		this.worldHeight = Number(world.dataset.worldHeight) || 840;
		this.monthLayer =
			world.querySelector<HTMLElement>(".timeline-months") || world;
		this.refresh();
		const saved = this.readPosition();
		if (saved) {
			this.tx = saved.x;
			this.ty = saved.y + (this.height - saved.height) * 0.5;
			this.targetScale = this.scale = saved.scale;
		} else {
			const last = this.cards.at(-1);
			this.targetScale = this.scale = this.width < 700 ? 0.72 : 0.9;
			this.tx = this.width * 0.54 - ((last?.x || 0) + 141) * this.scale;
			this.ty = this.height * 0.5;
			if (last?.element.matches(".timeline-item"))
				this.revealVertically(last.element);
		}
		this.limit();
		this.x = this.tx;
		this.y = this.ty;
		this.removeFrame = clock.add(this.frame);
		signal.addEventListener(
			"abort",
			() => {
				this.save();
				this.removeFrame();
			},
			{ once: true },
		);
		viewport.addEventListener("pointerdown", this.down, { signal });
		window.addEventListener("pointermove", this.move, {
			signal,
			passive: false,
		});
		window.addEventListener("pointerup", this.up, { signal });
		window.addEventListener("pointercancel", this.up, { signal });
		viewport.addEventListener("wheel", this.wheel, {
			passive: false,
			signal,
		});
		viewport.addEventListener("keydown", this.key, { signal });
		window.addEventListener(
			"resize",
			() => {
				const ox = this.width,
					oy = this.height;
				this.width = viewport.clientWidth;
				this.height = viewport.clientHeight;
				this.tx += (this.width - ox) * 0.5;
				this.ty += (this.height - oy) * 0.5;
				this.limit();
				clock.wake();
			},
			{ passive: true, signal },
		);
		document
			.querySelector("[data-zoom-in]")
			?.addEventListener(
				"click",
				() => this.zoom(this.targetScale * 1.24),
				{ signal },
			);
		document
			.querySelector("[data-zoom-out]")
			?.addEventListener(
				"click",
				() => this.zoom(this.targetScale / 1.24),
				{ signal },
			);
		document
			.querySelector("[data-zoom-fit]")
			?.addEventListener("click", () => this.fit(), { signal });
		document
			.querySelector("[data-canvas-prev]")
			?.addEventListener("click", () => this.step(-1), { signal });
		document
			.querySelector("[data-canvas-next]")
			?.addEventListener("click", () => this.step(1), { signal });
		this.position?.addEventListener(
			"input",
			() => {
				const [min, max] = this.boundsX();
				this.tx =
					max - ((max - min) * Number(this.position!.value)) / 1000;
				this.velocityX = 0;
				clock.wake();
			},
			{ signal },
		);
		this.frame(0, 0.016);
	}
	refresh() {
		this.worldWidth = Number(this.world.dataset.worldWidth) || 620;
		this.cards = [
			...this.world.querySelectorAll<HTMLElement>(
				".timeline-item:not([hidden]),.collection-item",
			),
		].map((element) => ({
			element,
			x:
				Number(element.dataset.x) ||
				parseFloat(element.style.getPropertyValue("--item-x")) ||
				0,
			visible: element.style.visibility !== "hidden",
		}));
		this.months = [
			...this.world.querySelectorAll<HTMLElement>(".month-marker"),
		].map((el) => ({
			key: el.dataset.month || "",
			x: parseFloat(el.style.left) || 0,
		}));
		this.changed = true;
		clock.wake();
	}
	focusMonth(key: string) {
		const month = this.months.find((item) => item.key === key);
		if (month) this.focus(month.x + 250);
	}
	focusLatest() {
		const last = this.cards.at(-1);
		if (!last) {
			this.fit();
			return;
		}
		this.focus(last.x + 141);
		this.revealVertically(last.element);
		this.limit();
	}
	private revealVertically(card: HTMLElement) {
		const top = parseFloat(card.style.getPropertyValue("--item-y"));
		const gutter = 12;
		const min = gutter - top * this.targetScale;
		const max =
			this.height - gutter - (top + card.offsetHeight) * this.targetScale;
		this.ty = Math.max(min, Math.min(max, this.ty));
	}
	focus(x: number) {
		if (this.targetScale < 0.55) this.targetScale = 0.8;
		this.tx = this.width * 0.5 - x * this.targetScale;
		this.velocityX = this.velocityY = 0;
		this.limit();
		clock.wake();
	}
	fit() {
		this.targetScale = Math.max(
			0.13,
			Math.min(
				0.88,
				(this.width - 100) / this.worldWidth,
				(this.height - 200) / this.worldHeight,
			),
		);
		this.tx = (this.width - this.worldWidth * this.targetScale) * 0.5;
		this.ty = this.height * 0.5;
		this.velocityX = this.velocityY = 0;
		clock.wake();
	}
	private boundsX(): [number, number] {
		const span = this.worldWidth * this.targetScale;
		if (span < this.width - 100) {
			const center = (this.width - span) * 0.5;
			return [center, center];
		}
		return [this.width - span - 60, 60];
	}
	private limit() {
		const [min, max] = this.boundsX();
		this.tx = Math.max(min, Math.min(max, this.tx));
		const allowance = Math.max(
			30,
			(this.worldHeight * this.targetScale - this.height + 200) * 0.5,
		);
		this.ty = Math.max(
			this.height * 0.5 - allowance,
			Math.min(this.height * 0.5 + allowance, this.ty),
		);
	}
	private zoom(
		scale: number,
		pivot = { x: this.width * 0.5, y: this.height * 0.5 },
	) {
		const next = Math.max(0.13, Math.min(1.65, scale)),
			ratio = next / this.targetScale;
		this.tx = pivot.x - (pivot.x - this.tx) * ratio;
		this.ty = pivot.y - (pivot.y - this.ty) * ratio;
		this.targetScale = next;
		this.velocityX = this.velocityY = 0;
		this.limit();
		clock.wake();
		if (scale < 0.13) this.onMinimum?.();
	}
	private down = (event: PointerEvent) => {
		if (
			event.button !== 0 ||
			!(event.target instanceof Element) ||
			event.target.closest("button,input,select,[data-no-pan]")
		)
			return;
		this.pointers.set(event.pointerId, {
			x: event.clientX,
			y: event.clientY,
		});
		this.dragStart = { x: event.clientX, y: event.clientY };
		this.lastMove = performance.now();
		this.velocityX = this.velocityY = 0;
		this.pinch = 0;
		if (this.pointers.size > 1) this.dragging = true;
	};
	private move = (event: PointerEvent) => {
		const previous = this.pointers.get(event.pointerId);
		if (!previous) return;
		const now = performance.now(),
			dt = Math.max(8, now - this.lastMove);
		this.lastMove = now;
		const dx = event.clientX - previous.x,
			dy = event.clientY - previous.y;
		this.pointers.set(event.pointerId, {
			x: event.clientX,
			y: event.clientY,
		});
		if (this.pointers.size >= 2) {
			event.preventDefault();
			const [a, b] = [...this.pointers.values()],
				distance = Math.hypot(a.x - b.x, a.y - b.y),
				center = { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };
			if (this.pinch) {
				const rect = this.viewport.getBoundingClientRect();
				this.zoom((this.targetScale * distance) / this.pinch, {
					x: center.x - rect.left,
					y: center.y - rect.top,
				});
				this.tx += center.x - this.pinchCenter.x;
				this.ty += center.y - this.pinchCenter.y;
			}
			this.pinch = distance;
			this.pinchCenter = center;
			this.dragging = true;
		} else {
			if (
				!this.dragging &&
				Math.hypot(
					event.clientX - this.dragStart.x,
					event.clientY - this.dragStart.y,
				) < 6
			)
				return;
			this.dragging = true;
			event.preventDefault();
			this.tx += dx;
			this.ty += dy;
			this.velocityX = this.velocityX * 0.45 + (dx / dt) * 1000 * 0.55;
			this.velocityY = this.velocityY * 0.45 + (dy / dt) * 1000 * 0.55;
		}
		this.viewport.classList.add("is-dragging");
		clock.wake();
	};
	private up = (event: PointerEvent) => {
		if (!this.pointers.has(event.pointerId)) return;
		this.pointers.delete(event.pointerId);
		if (this.dragging) this.draggedUntil = performance.now() + 280;
		this.pinch = 0;
		if (!this.pointers.size) {
			this.dragging = false;
			this.viewport.classList.remove("is-dragging");
			this.limit();
			clock.wake();
		}
	};
	private wheel = (event: WheelEvent) => {
		if ((event.target as Element)?.closest("[data-no-pan]")) return;
		event.preventDefault();
		const unit =
			event.deltaMode === 1
				? 16
				: event.deltaMode === 2
					? this.height
					: 1;
		this.zoomBy(event.deltaY * unit, {
			x: event.clientX,
			y: event.clientY,
		});
	};

	private key = (event: KeyboardEvent) => {
		if ((event.target as Element)?.closest("input,select,button")) return;
		const step = 260;
		switch (event.key) {
			case "ArrowLeft":
				this.tx += step;
				break;
			case "ArrowRight":
				this.tx -= step;
				break;
			case "ArrowUp":
				this.ty += 150;
				break;
			case "ArrowDown":
				this.ty -= 150;
				break;
			case "+":
			case "=":
				this.zoom(this.targetScale * 1.2);
				break;
			case "-":
				this.zoom(this.targetScale / 1.2);
				break;
			case "Home":
				this.tx = this.boundsX()[1];
				break;
			case "End":
				this.tx = this.boundsX()[0];
				break;
			case "0":
				this.fit();
				break;
			default:
				return;
		}
		event.preventDefault();
		this.limit();
		clock.wake();
	};
	private step(direction: number) {
		this.tx -= direction * this.width * 0.76;
		this.velocityX = this.velocityY = 0;
		this.limit();
		clock.wake();
	}
	private frame = (_time: number, dt: number) => {
		if (this.signal.aborted) return false;
		const before = { x: this.x, y: this.y, scale: this.scale };
		if (
			!this.dragging &&
			Math.abs(this.velocityX) + Math.abs(this.velocityY) > 4
		) {
			this.tx += this.velocityX * dt;
			this.ty += this.velocityY * dt;
			const friction = Math.exp(-dt * 5.6);
			this.velocityX *= friction;
			this.velocityY *= friction;
			this.limit();
		}
		const blend = reducedMotion.matches
			? 1
			: 1 - Math.exp(-dt * (this.dragging ? 30 : 13));
		this.x += (this.tx - this.x) * blend;
		this.y += (this.ty - this.y) * blend;
		this.scale += (this.targetScale - this.scale) * blend;
		const moving =
			Math.abs(this.tx - this.x) +
				Math.abs(this.ty - this.y) +
				Math.abs(this.targetScale - this.scale) * 500 >
			0.04;
		if (
			this.changed ||
			Math.abs(before.x - this.x) +
				Math.abs(before.y - this.y) +
				Math.abs(before.scale - this.scale) >
				0.001
		) {
			this.world.style.transform = `translate3d(${this.x.toFixed(2)}px,${this.y.toFixed(2)}px,0) scale(${this.scale.toFixed(5)})`;
			if (Math.abs(this.lastScale - this.scale) > 0.002) {
				this.world.dataset.lod =
					this.scale < 0.4
						? "far"
						: this.scale < 0.64
							? "mid"
							: "near";
				this.lastScale = this.scale;
			}
			const labelScale = 1 / this.scale;
			if (
				!this.labelScale ||
				Math.abs(labelScale / this.labelScale - 1) > 0.08
			) {
				this.labelScale = labelScale;
				this.monthLayer?.style.setProperty(
					"--label-scale",
					String(labelScale),
				);
			}
			const left = (-this.x - 400) / this.scale,
				right = (this.width - this.x + 400) / this.scale;
			for (const card of this.cards) {
				const visible = card.x + 282 > left && card.x < right;
				if (visible !== card.visible) {
					card.element.style.visibility = visible
						? "visible"
						: "hidden";
					card.visible = visible;
				}
			}
			if (this.position && !this.dragging) {
				const [min, max] = this.boundsX();
				this.position.disabled = max - min < 1;
				this.position.value = String(
					Math.round(
						((max - this.x) / Math.max(1, max - min)) * 1000,
					),
				);
			}
			this.changed = false;
		}
		return (
			moving ||
			this.dragging ||
			Math.abs(this.velocityX) + Math.abs(this.velocityY) > 4
		);
	};
	private readPosition() {
		try {
			const value = JSON.parse(
				sessionStorage.getItem(`lake-camera:${location.pathname}`) ||
					"null",
			);
			if (
				value &&
				value.version === 3 &&
				[value.x, value.y, value.scale, value.height].every(
					Number.isFinite,
				) &&
				value.scale >= 0.13 &&
				value.scale <= 1.65
			)
				return value as {
					x: number;
					y: number;
					scale: number;
					height: number;
				};
		} catch {}
		return null;
	}
	private save() {
		try {
			sessionStorage.setItem(
				`lake-camera:${location.pathname}`,
				JSON.stringify({
					version: 3,
					x: this.tx,
					y: this.ty,
					scale: this.targetScale,
					height: this.height,
				}),
			);
		} catch {}
	}
}
