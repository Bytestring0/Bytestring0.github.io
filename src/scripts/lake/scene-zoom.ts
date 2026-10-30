import { clock, reducedMotion } from "./clock";
import type { CanvasCamera } from "./camera";
const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));
const ease = (value: number) => {
	const t = clamp(value, 0, 1);
	return t * t * (3 - 2 * t);
};
type Point = { x: number; y: number };
type FloatNode = {
	el: HTMLElement;
	x: number;
	y: number;
	phase: number;
	dx: number;
	dy: number;
};
type FloatCluster = {
	nodes: FloatNode[];
	path: SVGPathElement | null;
	edges: [number, number][];
	base: string;
};
export class SceneZoom {
	private root: HTMLElement;
	private viewport: HTMLElement;
	private world: HTMLElement;
	private main: HTMLElement;
	private nav: HTMLElement;
	private avatar: HTMLElement;
	private mode = false;
	private progress = 0;
	private level = 1;
	private targetLevel = 1;
	private x = 0;
	private y = 0;
	private tx = 0;
	private ty = 0;
	private mapX = 0;
	private mapY = 0;
	private mapScale = 1;
	private targetMapX = 0;
	private targetMapY = 0;
	private targetMapScale = 1;
	private fitScale = 1;
	private returnRatio = 4;
	private lockedUntil = 0;
	private focusPending = false;
	private previousFocus: HTMLElement | null = null;
	private navigating = false;
	private savedDetail = { x: 0, y: 0, scale: 1 };
	private savedCamera?: { x: number; y: number; scale: number };
	private removeFrame: () => void;
	private dirty = true;
	private labelInverse = 0;
	private navOpacity = -1;
	private navScale = -1;
	private wake = () => {
		this.dirty = true;
		clock.wake();
	};
	private pointers = new Map<number, Point>();
	private start?: Point;
	private pan?: HTMLElement;
	private dragging = false;
	private pinch = 0;
	private floatClusters: FloatCluster[] = [];
	private floatTime = 0;
	private lastFloat = 0;
	private mapMoving = false;
	private removeFloat?: () => void;
	draggedUntil = 0;
	constructor(
		private camera: CanvasCamera | undefined,
		private signal: AbortSignal,
	) {
		this.root = document.querySelector<HTMLElement>("#scene-overview")!;
		this.viewport = this.root.querySelector<HTMLElement>(
			"[data-overview-viewport]",
		)!;
		this.world = this.root.querySelector<HTMLElement>(
			"[data-overview-world]",
		)!;
		this.main = document.querySelector<HTMLElement>("#lake-content")!;
		this.nav = document.querySelector<HTMLElement>(".lake-nav")!;
		this.avatar = document.querySelector<HTMLElement>(".lake-avatar")!;
		this.savedCamera = camera?.snapshot();
		if (camera) camera.onMinimum = () => this.enter(true);
		this.fit(true);
		this.floatClusters = [
			...this.world.querySelectorAll<HTMLElement>(
				"[data-overview-cluster]",
			),
		].map((cluster) => {
			const nodes = [
				...cluster.querySelectorAll<HTMLElement>("[data-map-node]"),
			].map((el) => ({
				el,
				x: parseFloat(el.style.left) || 0,
				y: parseFloat(el.style.top) || 0,
				phase:
					parseFloat(
						el.style.getPropertyValue("--node-phase") || "0",
					) || 0,
				dx: 0,
				dy: 0,
			}));
			const path = cluster.querySelector<SVGPathElement>(
				".overview-constellation path",
			);
			const edges = (path?.dataset.edges || "")
				.split(/\s+/)
				.filter(Boolean)
				.map((pair) => pair.split(":").map(Number))
				.filter(
					(pair): pair is [number, number] =>
						pair.length === 2 &&
						pair.every((index) => Number.isInteger(index)),
				);
			return {
				nodes,
				path: path || null,
				edges,
				base: path?.getAttribute("d") || "",
			};
		});
		this.removeFloat = clock.add(this.floatFrame);
		this.root.inert = true;
		this.root.style.opacity = "0";
		this.root.style.visibility = "hidden";
		this.removeFrame = clock.add(this.frame);
		document.addEventListener("wheel", this.wheel, {
			capture: true,
			passive: false,
			signal,
		});
		document
			.querySelector("[data-overview-toggle]")
			?.addEventListener(
				"click",
				() => (this.mode ? this.leave() : this.enter()),
				{ signal },
			);
		this.root
			.querySelector("[data-overview-return]")
			?.addEventListener("click", () => this.leave(), { signal });
		this.root
			.querySelector("[data-map-in]")
			?.addEventListener(
				"click",
				() => this.mapZoom(1.3, this.center(), true),
				{ signal },
			);
		this.root
			.querySelector("[data-map-out]")
			?.addEventListener(
				"click",
				() => this.mapZoom(1 / 1.3, this.center(), false),
				{ signal },
			);
		this.root
			.querySelector("[data-map-fit]")
			?.addEventListener("click", () => this.fit(), { signal });
		this.root
			.querySelectorAll<HTMLElement>("[data-overview-focus]")
			.forEach((button) =>
				button.addEventListener(
					"click",
					() => {
						const cluster = this.root.querySelector<HTMLElement>(
							`[data-overview-cluster="${button.dataset.overviewFocus}"]`,
						);
						if (cluster) this.focusCluster(cluster);
					},
					{ signal },
				),
			);
		document.addEventListener(
			"keydown",
			(event) => {
				if (!this.mode) return;
				if (event.key === "Escape") {
					event.preventDefault();
					event.stopImmediatePropagation();
					this.leave();
				} else if (
					!event.ctrlKey &&
					!event.metaKey &&
					["+", "=", "-", "0"].includes(event.key)
				) {
					event.preventDefault();
					event.stopImmediatePropagation();
					if (event.key === "0") this.fit();
					else
						this.mapZoom(
							event.key === "-" ? 1 / 1.25 : 1.25,
							this.center(),
							true,
						);
				}
			},
			{ capture: true, signal },
		);
		this.viewport.addEventListener(
			"focusin",
			(event) => {
				const link = (event.target as Element).closest<HTMLElement>(
					"[data-map-node]",
				);
				if (!link) return;
				const rect = link.getBoundingClientRect(),
					bounds = this.viewport.getBoundingClientRect();
				if (
					rect.left < bounds.left ||
					rect.right > bounds.right ||
					rect.top < bounds.top ||
					rect.bottom > bounds.bottom ||
					this.targetMapScale < 0.4
				) {
					const cluster = link.closest<HTMLElement>(
						"[data-overview-cluster]",
					)!;
					this.focusCluster(cluster);
					this.targetMapX =
						this.viewport.clientWidth / 2 -
						(Number(cluster.dataset.x) +
							parseFloat(link.style.left)) *
							this.targetMapScale;
					this.targetMapY =
						this.viewport.clientHeight / 2 -
						(Number(cluster.dataset.y) +
							parseFloat(link.style.top)) *
							this.targetMapScale;
					this.limitMap();
					this.wake();
				}
				requestAnimationFrame(() => {
					this.viewport.scrollLeft = 0;
					this.viewport.scrollTop = 0;
				});
			},
			{ signal },
		);
		document.addEventListener("pointerdown", this.down, { signal });
		window.addEventListener("pointermove", this.move, {
			passive: false,
			signal,
		});
		window.addEventListener("pointerup", this.up, { signal });
		window.addEventListener("pointercancel", this.up, { signal });
		window.addEventListener(
			"resize",
			() => {
				if (this.mode) this.fit();
				else {
					this.fit(true);
					this.tx = clamp(this.tx, -innerWidth, innerWidth);
					this.ty = clamp(this.ty, -innerHeight, innerHeight);
				}
				this.wake();
			},
			{ passive: true, signal },
		);
		signal.addEventListener("abort", () => this.dispose(), { once: true });
	}
	private center() {
		return {
			x: this.viewport.clientWidth / 2,
			y: this.viewport.clientHeight / 2,
		};
	}
	private fit(immediate = false) {
		this.fitScale =
			Math.min(
				this.viewport.clientWidth / Number(this.world.dataset.width),
				this.viewport.clientHeight / Number(this.world.dataset.height),
			) * 0.94;
		this.targetMapScale = this.fitScale;
		this.targetMapX =
			(this.viewport.clientWidth -
				Number(this.world.dataset.width) * this.targetMapScale) /
			2;
		this.targetMapY =
			(this.viewport.clientHeight -
				Number(this.world.dataset.height) * this.targetMapScale) /
			2;
		this.returnRatio = 4;
		if (immediate) {
			this.mapX = this.targetMapX;
			this.mapY = this.targetMapY;
			this.mapScale = this.targetMapScale;
			this.syncLabelScale(true);
		}
		this.wake();
	}
	/**
	 * Label type is rendered in world units, so keeping it readable means
	 * inverting the map scale. That write invalidates style for every node,
	 * so it happens once the map settles instead of on every frame.
	 */
	private syncLabelScale(force = false) {
		if (!this.mode && this.progress < 0.001) return;
		const inverse = 1 / Math.max(0.05, this.mapScale);
		if (
			!force &&
			this.labelInverse &&
			Math.abs(inverse / this.labelInverse - 1) < 0.01
		)
			return;
		this.labelInverse = inverse;
		this.world.style.setProperty("--map-inverse", String(inverse));
	}
	private limitMap() {
		const w = this.viewport.clientWidth,
			h = this.viewport.clientHeight,
			spanX = Number(this.world.dataset.width) * this.targetMapScale,
			spanY = Number(this.world.dataset.height) * this.targetMapScale;
		if (spanX < w) {
			const center = (w - spanX) / 2,
				slack = Math.min(90, (w - spanX) / 2);
			this.targetMapX = clamp(
				this.targetMapX,
				center - slack,
				center + slack,
			);
		} else this.targetMapX = clamp(this.targetMapX, w - spanX - 120, 120);
		this.targetMapY =
			spanY < h
				? (h - spanY) / 2
				: clamp(this.targetMapY, h - spanY - 100, 100);
	}
	private focusCluster(cluster: HTMLElement) {
		const width = Number(cluster.dataset.width),
			height = Number(cluster.dataset.height);
		this.targetMapScale = Math.max(
			0.52,
			Math.min(
				this.viewport.clientWidth / (width + 100),
				this.viewport.clientHeight / (height + 70),
			) * 0.9,
		);
		this.targetMapX =
			this.viewport.clientWidth / 2 -
			(Number(cluster.dataset.x) + width / 2) * this.targetMapScale;
		this.targetMapY =
			this.viewport.clientHeight / 2 -
			(Number(cluster.dataset.y) + height / 2) * this.targetMapScale;
		this.returnRatio = Math.max(
			4,
			(this.targetMapScale / this.fitScale) * 1.35,
		);
		this.limitMap();
		this.wake();
	}
	enter(fromMinimum = false) {
		if (this.mode || this.navigating) return;
		this.previousFocus = document.activeElement as HTMLElement;
		if (!fromMinimum) {
			this.savedCamera = this.camera?.snapshot();
			this.savedDetail = {
				x: this.tx,
				y: this.ty,
				scale: this.targetLevel,
			};
		}
		this.pointers.clear();
		this.pan = undefined;
		this.dragging = false;
		this.mode = true;
		this.focusPending = true;
		this.lockedUntil = performance.now() + 600;
		this.navOpacity = -1;
		this.navScale = -1;
		this.mapMoving = false;
		this.floatTime = performance.now() / 1000;
		this.lastFloat = 0;
		this.main.style.transformOrigin = "0 0";
		this.fit(true);
		this.syncLabelScale(true);
		this.root.style.visibility = "visible";
		document.body.dataset.space = "overview";
		document
			.querySelector("[data-overview-toggle]")
			?.setAttribute("aria-pressed", "true");
		this.wake();
	}
	leave() {
		if (!this.mode || this.navigating) return;
		this.pointers.clear();
		this.pan = undefined;
		this.dragging = false;
		this.mode = false;
		this.lockedUntil = performance.now() + 700;
		this.targetLevel = this.savedDetail.scale;
		this.tx = this.savedDetail.x;
		this.ty = this.savedDetail.y;
		if (this.camera && this.savedCamera)
			this.camera.restore(this.savedCamera);
		document.body.dataset.space = "detail";
		document
			.querySelector("[data-overview-toggle]")
			?.setAttribute("aria-pressed", "false");
		this.wake();
	}
	private mapZoom(factor: number, pivot: Point, allowReturn: boolean) {
		const wanted = this.targetMapScale * factor;
		if (
			allowReturn &&
			factor > 1 &&
			wanted / this.fitScale >= this.returnRatio &&
			performance.now() > this.lockedUntil
		) {
			this.leave();
			return;
		}
		const next = clamp(
			wanted,
			this.fitScale * 0.7,
			Math.max(this.fitScale * this.returnRatio, 1.05),
		);
		const ratio = next / this.targetMapScale;
		this.targetMapX = pivot.x - (pivot.x - this.targetMapX) * ratio;
		this.targetMapY = pivot.y - (pivot.y - this.targetMapY) * ratio;
		this.targetMapScale = next;
		this.limitMap();
		this.wake();
	}
	private wheel = (event: WheelEvent) => {
		if (this.navigating) return;
		const element = event.target as Element;
		if (
			element.closest(
				"input,textarea,select,[data-filter-menu],.search-form,.article-prose",
			)
		)
			return;
		const explorable = [
			"home",
			"archive",
			"categories",
			"projects",
			"friends",
		].includes(document.body.dataset.view || "");
		if (!this.mode && !explorable) return;
		/* Index pages scroll; their wheels never scale the page. */
		if (
			!this.mode &&
			["categories", "projects", "friends"].includes(
				document.body.dataset.view || "",
			)
		)
			return;
		if (!this.mode && element.closest("[data-no-pan]")) return;
		event.preventDefault();
		event.stopImmediatePropagation();
		if (performance.now() < this.lockedUntil) return;
		const unit =
				event.deltaMode === 1
					? 16
					: event.deltaMode === 2
						? innerHeight
						: 1,
			delta = clamp(event.deltaY * unit, -180, 180);
		if (!delta) return;
		if (this.mode) {
			const rect = this.viewport.getBoundingClientRect();
			this.mapZoom(
				Math.exp(-delta * 0.003),
				{ x: event.clientX - rect.left, y: event.clientY - rect.top },
				delta < 0,
			);
			return;
		}
		this.main.getAnimations().forEach((animation) => animation.cancel());
		if (this.camera) {
			if (this.camera.snapshot().scale >= 0.55)
				this.savedCamera = this.camera.snapshot();
			this.camera.zoomBy(delta, { x: event.clientX, y: event.clientY });
			this.wake();
			return;
		}
		if (this.targetLevel >= 0.65)
			this.savedDetail = {
				x: this.tx,
				y: this.ty,
				scale: this.targetLevel,
			};
		const wanted = this.targetLevel * Math.exp(-delta * 0.0025),
			next = clamp(wanted, 0.4, 1.4),
			ratio = next / this.targetLevel;
		this.tx = event.clientX - (event.clientX - this.tx) * ratio;
		this.ty = event.clientY - (event.clientY - this.ty) * ratio;
		this.targetLevel = next;
		if (wanted < 0.4 && delta > 0) this.enter(true);
		this.wake();
	};
	private down = (event: PointerEvent) => {
		if (event.button !== 0 || this.navigating) return;
		const element = event.target as Element;
		if (this.mode) {
			if (!this.viewport.contains(element)) return;
			this.pointers.set(event.pointerId, {
				x: event.clientX,
				y: event.clientY,
			});
			this.start = { x: event.clientX, y: event.clientY };
			this.pinch = 0;
		} else if (
			!this.camera &&
			event.pointerType !== "touch" &&
			["categories", "projects", "friends"].includes(
				document.body.dataset.view || "",
			)
		) {
			if (element.closest("input,select,textarea,[data-no-pan]")) return;
			const pane = element.closest<HTMLElement>(".branch-stage");
			if (!pane) return;
			this.pan = pane;
			this.pointers.set(event.pointerId, {
				x: event.clientX,
				y: event.clientY,
			});
			this.start = { x: event.clientX, y: event.clientY };
		}
	};
	private move = (event: PointerEvent) => {
		const previous = this.pointers.get(event.pointerId);
		if (!previous || !this.start) return;
		const point = { x: event.clientX, y: event.clientY };
		this.pointers.set(event.pointerId, point);
		if (this.pointers.size > 1 && this.mode) {
			event.preventDefault();
			const [a, b] = [...this.pointers.values()];
			const d = Math.hypot(a.x - b.x, a.y - b.y);
			const rect = this.viewport.getBoundingClientRect();
			if (this.pinch)
				this.mapZoom(
					d / this.pinch,
					{
						x: (a.x + b.x) / 2 - rect.left,
						y: (a.y + b.y) / 2 - rect.top,
					},
					false,
				);
			this.pinch = d;
			this.dragging = true;
		} else {
			if (
				!this.dragging &&
				Math.hypot(point.x - this.start.x, point.y - this.start.y) < 6
			)
				return;
			this.dragging = true;
			event.preventDefault();
			if (this.mode) {
				this.targetMapX += point.x - previous.x;
				this.targetMapY += point.y - previous.y;
				this.limitMap();
				this.wake();
			} else if (this.pan)
				this.pan.scrollTop -= (point.y - previous.y) / this.level;
		}
		this.draggedUntil = performance.now() + 320;
		document.body.classList.add("scene-dragging");
	};
	private up = (event: PointerEvent) => {
		this.pointers.delete(event.pointerId);
		this.pinch = 0;
		if (!this.pointers.size) {
			this.start = undefined;
			this.pan = undefined;
			this.dragging = false;
			document.body.classList.remove("scene-dragging");
		}
	};
	prepareDeparture(origin: Point): Promise<unknown> | undefined {
		if (!this.mode) return;
		this.navigating = true;
		this.main.style.visibility = "hidden";
		this.root.style.transformOrigin = `${origin.x}px ${origin.y}px`;
		const animation = this.root.animate(
			[
				{ opacity: 1, transform: "scale(1)" },
				{ opacity: 0, transform: "scale(1.18)" },
			],
			{
				duration: reducedMotion.matches ? 0 : 560,
				easing: "cubic-bezier(.4,0,.2,1)",
				fill: "forwards",
			},
		);
		this.signal.addEventListener("abort", () => animation.cancel(), {
			once: true,
		});
		return animation.finished.catch(() => {});
	}
	private floatFrame = (_time: number, _dt: number) => {
		if (this.signal.aborted) return false;
		if (
			document.body.dataset.space !== "overview" ||
			reducedMotion.matches
		) {
			this.resetFloat();
			return false;
		}
		if (
			this.mapMoving ||
			document.body.classList.contains("scene-dragging")
		)
			return true;
		const now = performance.now();
		if (now - this.lastFloat < 32) return true;
		this.lastFloat = now;
		this.floatTime = now / 1000;
		this.drawFloat();
		return true;
	};
	private drawFloat() {
		const time = this.floatTime;
		for (const cluster of this.floatClusters) {
			for (const node of cluster.nodes) {
				const phase = node.phase;
				const dx =
					Math.sin(time * 0.52 + phase * 1.7) * 9 +
					Math.sin(time * 0.21 + phase) * 3;
				const dy =
					Math.cos(time * 0.45 + phase * 1.3) * 7 +
					Math.cos(time * 0.18 + phase * 0.6) * 2.5;
				node.dx = dx;
				node.dy = dy;
				node.el.style.translate = `${dx.toFixed(2)}px ${dy.toFixed(2)}px`;
			}
			if (!cluster.path) continue;
			let d = "";
			for (const [a, b] of cluster.edges) {
				const from = cluster.nodes[a],
					to = cluster.nodes[b];
				if (!from || !to) continue;
				d +=
					`M${(from.x + from.dx).toFixed(1)} ${(from.y + from.dy).toFixed(1)}` +
					`L${(to.x + to.dx).toFixed(1)} ${(to.y + to.dy).toFixed(1)}`;
			}
			cluster.path.setAttribute("d", d);
		}
	}
	private resetFloat() {
		for (const cluster of this.floatClusters) {
			for (const node of cluster.nodes) {
				node.dx = 0;
				node.dy = 0;
				node.el.style.removeProperty("translate");
			}
			cluster.path?.setAttribute("d", cluster.base);
		}
	}
	private frame = (_time: number, dt: number) => {
		if (this.signal.aborted) return false;
		const changing =
			Math.abs((this.mode ? 1 : 0) - this.progress) > 0.0005 ||
			Math.abs(this.targetLevel - this.level) > 0.0005 ||
			Math.abs(this.targetMapX - this.mapX) +
				Math.abs(this.targetMapY - this.mapY) +
				Math.abs(this.targetMapScale - this.mapScale) * 500 >
				0.04 ||
			Math.abs(this.tx - this.x) + Math.abs(this.ty - this.y) > 0.04;
		if (!this.dirty && !changing) return false;
		this.dirty = false;
		const w = this.viewport.clientWidth,
			h = this.viewport.clientHeight;
		const blend = reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 6.5);
		const target = this.mode ? 1 : 0;
		this.progress += (target - this.progress) * blend;
		this.level += (this.targetLevel - this.level) * blend;
		this.x += (this.tx - this.x) * blend;
		this.y += (this.ty - this.y) * blend;
		this.mapX += (this.targetMapX - this.mapX) * blend;
		this.mapY += (this.targetMapY - this.mapY) * blend;
		this.mapScale += (this.targetMapScale - this.mapScale) * blend;
		this.mapMoving =
			Math.abs(this.targetMapScale - this.mapScale) > 0.0005 ||
			Math.abs(this.targetMapX - this.mapX) +
				Math.abs(this.targetMapY - this.mapY) >
				0.5;
		document.body.classList.toggle(
			"scene-zooming",
			Math.abs(this.targetLevel - this.level) > 0.003 ||
				this.progress > 0.002,
		);
		const p = ease(this.progress),
			opacity = 1 - ease((p - 0.03) / 0.82),
			retreat = 1 - p * 0.2;
		/* Once the map is fully open its chrome is static; leave it untouched
		   so panning and zooming only pay for the world transform. */
		if (!this.mode || this.progress < 0.995) {
			this.main.style.opacity = String(opacity);
			this.main.style.transform = this.camera
				? `translate3d(${(innerWidth * (1 - retreat)) / 2}px,${(innerHeight * (1 - retreat)) / 2}px,0) scale(${retreat})`
				: `translate3d(${this.x + (innerWidth * (1 - retreat)) / 2}px,${this.y + (innerHeight * (1 - retreat)) / 2}px,0) scale(${this.level * retreat})`;
			this.main.inert = p > 0.22;
			this.nav.inert = p > 0.22;
			this.avatar.inert = p > 0.22;
			if (Math.abs(opacity - this.navOpacity) > 0.004) {
				this.navOpacity = opacity;
				this.nav.style.opacity = String(opacity);
				this.avatar.style.opacity = String(opacity);
			}
			if (document.body.dataset.view === "home") {
				const scale = this.level * retreat;
				if (Math.abs(scale - this.navScale) > 0.002) {
					this.navScale = scale;
					this.nav.style.transform = `scale(${scale})`;
					this.avatar.style.transform = `translate(-50%, -50%) scale(${scale})`;
				}
			}
			this.root.style.opacity = String(ease((p - 0.12) / 0.88));
			this.root.inert = p < 0.65;
		}
		const growth = 0.8 + 0.2 * p;
		this.world.style.transform = `translate3d(${this.mapX + (w * (1 - growth)) / 2}px,${this.mapY + (h * (1 - growth)) / 2}px,0) scale(${this.mapScale * growth})`;
		if (
			Math.abs(this.targetMapScale - this.mapScale) < 0.001 &&
			Math.abs(this.targetMapX - this.mapX) +
				Math.abs(this.targetMapY - this.mapY) <
				0.5
		)
			this.syncLabelScale();
		if (this.focusPending && p > 0.8) {
			this.focusPending = false;
			this.viewport.focus({ preventScroll: true });
		}
		if (!this.mode && p < 0.002) {
			this.progress = 0;
			this.main.style.opacity = "1";
			this.nav.style.opacity = "1";
			this.avatar.style.opacity = "1";
			this.navOpacity = 1;
			if (document.body.dataset.view === "home") {
				this.nav.style.transform = `scale(${this.level})`;
				this.avatar.style.transform = `translate(-50%, -50%) scale(${this.level})`;
				this.navScale = this.level;
			}
			this.root.style.visibility = "hidden";
			this.root.inert = true;
			delete document.body.dataset.space;
			clock.wake();
			if (this.previousFocus) {
				const focus = this.previousFocus;
				this.previousFocus = null;
				if (document.contains(focus))
					focus.focus({ preventScroll: true });
			}
		}
		return (
			Math.abs(target - this.progress) > 0.001 ||
			Math.abs(this.targetLevel - this.level) > 0.001 ||
			Math.abs(this.targetMapX - this.mapX) +
				Math.abs(this.targetMapY - this.mapY) +
				Math.abs(this.targetMapScale - this.mapScale) * 500 >
				0.05 ||
			Math.abs(this.tx - this.x) + Math.abs(this.ty - this.y) > 0.05
		);
	};
	private dispose() {
		this.removeFrame();
		this.removeFloat?.();
		this.resetFloat();
		if (this.camera) this.camera.onMinimum = undefined;
		this.main.inert = false;
		this.main.style.removeProperty("opacity");
		this.main.style.removeProperty("transform");
		this.main.style.removeProperty("transform-origin");
		this.main.style.removeProperty("visibility");
		this.nav.inert = false;
		this.avatar.inert = false;
		this.nav.style.removeProperty("opacity");
		this.nav.style.removeProperty("transform");
		this.avatar.style.removeProperty("opacity");
		this.avatar.style.removeProperty("transform");
		this.root.inert = true;
		this.root.style.visibility = "hidden";
		this.root.style.opacity = "0";
		this.root.style.removeProperty("transform-origin");
		delete document.body.dataset.space;
		document.body.classList.remove("scene-dragging", "scene-zooming");
	}
}
