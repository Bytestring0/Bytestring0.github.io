import analysis from "./analysis.json";
import { chapters, lyrics, formatTime } from "./score";
import { FilmRenderer } from "./film-renderer";
import type { ProgramTrace } from "./comet-program";

class RayPV extends HTMLElement {
	audio!: HTMLAudioElement;
	canvas!: HTMLCanvasElement;
	dust!: HTMLCanvasElement;
	cpu?: { trace?: ProgramTrace };
	film?: FilmRenderer;
	gl: WebGLRenderingContext | null = null;
	program: WebGLProgram | null = null;
	quadBuffer: WebGLBuffer | null = null;
	textures: WebGLTexture[] = [];
	worker?: Worker;
	outputReady = false;
	uniforms: Record<string, WebGLUniformLocation | null> = {};
	abort?: AbortController;
	resizeObserver?: ResizeObserver;
	visibility?: IntersectionObserver;
	frame = 0;
	lastFrame = 0;
	lowMotion = false;
	inView = true;
	scale = 0.85;
	slowFrames = 0;
	width = 0;
	height = 0;
	chapterIndex = -1;
	lyricIndex = -2;
	accent = [0.35, 0.72, 0.9];
	context?: AudioContext;
	analyser?: AnalyserNode;
	spectrum = new Uint8Array(512);
	source?: MediaElementAudioSourceNode;
	reduced = matchMedia("(prefers-reduced-motion: reduce)");

	connectedCallback() {
		if (this.abort) return;
		this.abort = new AbortController();
		const signal = this.abort.signal;
		this.audio = this.querySelector("audio")!;
		this.canvas = this.querySelector("[data-gpu]")!;
		this.dust = this.querySelector("[data-dust]")!;
		this.cpu = {};
		this.lowMotion = this.reduced.matches;
		this.classList.toggle("low-motion", this.lowMotion);
		this.audio.volume = 0.8;
		this.audio.controls = false;
		this.initGPU();
		this.runProgram();
		this.classList.add("is-ready");
		this.querySelector("[data-motion]")!.setAttribute(
			"aria-pressed",
			String(this.lowMotion),
		);
		this.resizeObserver = new ResizeObserver(() => {
			this.resize();
			this.draw();
		});
		this.resizeObserver.observe(this.querySelector("[data-stage]")!);
		this.visibility = new IntersectionObserver(
			([entry]) => {
				this.inView = entry.isIntersecting;
				if (this.inView) this.schedule();
				else {
					cancelAnimationFrame(this.frame);
					this.frame = 0;
				}
			},
			{ threshold: 0 },
		);
		this.visibility.observe(this.querySelector("[data-stage]")!);
		this.addEventListener(
			"click",
			(e) => {
				const button = (e.target as Element).closest<HTMLElement>(
					"[data-action],[data-seek]",
				);
				if (!button) return;
				if (button.dataset.seek !== undefined) {
					this.seek(Number(button.dataset.seek));
					return;
				}
				switch (button.dataset.action) {
					case "play":
						void this.togglePlay();
						break;
					case "restart":
						this.seek(0);
						break;
					case "motion":
						this.setMotion(!this.lowMotion);
						break;
					case "lyrics": {
						const active =
							button.getAttribute("aria-pressed") !== "true";
						button.setAttribute("aria-pressed", String(active));
						this.classList.toggle("without-lyrics", !active);
						break;
					}
					case "fullscreen":
						void this.fullscreen();
						break;
					case "mute":
						this.audio.muted = !this.audio.muted;
						this.syncVolume();
						break;
				}
			},
			{ signal },
		);
		this.querySelector<HTMLInputElement>(
			"[data-progress]",
		)!.addEventListener(
			"input",
			(e) => this.seek(Number((e.target as HTMLInputElement).value)),
			{ signal },
		);
		this.querySelector<HTMLInputElement>("[data-volume]")!.addEventListener(
			"input",
			(e) => {
				this.audio.volume = Number(
					(e.target as HTMLInputElement).value,
				);
				this.audio.muted = false;
				this.syncVolume();
			},
			{ signal },
		);
		this.audio.addEventListener(
			"timeupdate",
			() => {
				this.sync();
				if (this.lowMotion || this.audio.paused) this.draw();
			},
			{ signal },
		);
		this.audio.addEventListener(
			"seeking",
			() => {
				this.sync();
				this.draw();
			},
			{ signal },
		);
		this.audio.addEventListener("loadedmetadata", () => this.sync(), {
			signal,
		});
		this.audio.addEventListener(
			"play",
			() => {
				this.classList.add("is-playing", "has-started");
				this.syncPlay();
				this.schedule();
			},
			{ signal },
		);
		this.audio.addEventListener(
			"pause",
			() => {
				this.classList.remove("is-playing");
				this.syncPlay();
				cancelAnimationFrame(this.frame);
				this.frame = 0;
				this.draw();
			},
			{ signal },
		);
		this.audio.addEventListener(
			"ended",
			() => {
				this.classList.remove("is-playing");
				this.syncPlay();
				this.draw();
			},
			{ signal },
		);
		this.audio.addEventListener(
			"error",
			() => {
				this.setStatus(
					"音源を読み込めませんでした。再読み込みしてください。",
				);
				this.audio.controls = true;
			},
			{ signal },
		);
		this.canvas.addEventListener(
			"webglcontextlost",
			(e) => {
				e.preventDefault();
				this.gl = null;
				this.classList.add("no-gpu");
				this.draw();
			},
			{ signal },
		);
		document.addEventListener(
			"visibilitychange",
			() => {
				if (document.hidden) {
					cancelAnimationFrame(this.frame);
					this.frame = 0;
				} else this.schedule();
			},
			{ signal },
		);
		document.addEventListener(
			"fullscreenchange",
			() => {
				this.querySelector('[data-action="fullscreen"]')!.setAttribute(
					"aria-pressed",
					String(document.fullscreenElement === this),
				);
				this.resize();
				this.draw();
			},
			{ signal },
		);
		this.reduced.addEventListener(
			"change",
			(e) => this.setMotion(e.matches),
			{ signal },
		);
		this.addEventListener(
			"keydown",
			(e) => {
				const el = e.target as HTMLElement;
				if (
					el.closest("input,button,a,summary,textarea,select") ||
					e.altKey ||
					e.ctrlKey ||
					e.metaKey
				)
					return;
				if (e.code === "Space") {
					e.preventDefault();
					void this.togglePlay();
				}
				if (e.code === "ArrowRight") {
					e.preventDefault();
					this.seek(this.audio.currentTime + 5);
				}
				if (e.code === "ArrowLeft") {
					e.preventDefault();
					this.seek(this.audio.currentTime - 5);
				}
				if (e.code === "KeyF") {
					e.preventDefault();
					void this.fullscreen();
				}
			},
			{ signal },
		);
		this.resize();
		this.sync();
		this.draw();
	}

	initGPU() {
		try {
			this.film = new FilmRenderer(this.canvas);
			this.gl =
				this.film.renderer.getContext() as unknown as WebGLRenderingContext;
		} catch (error) {
			console.warn("RAY: 3D renderer unavailable", error);
			this.classList.add("no-gpu");
		}
	}

	runProgram() {
		this.outputReady = false;
		this.worker = new Worker(
			new URL("./ray-program.worker.ts", import.meta.url),
			{ type: "module" },
		);
		this.worker.onmessage = ({ data }) => {
			this.cpu!.trace = data.trace;
			this.film?.setProgram(data);
			this.outputReady = true;
			this.draw();
			this.worker?.terminate();
			this.worker = undefined;
		};
		this.worker.onerror = () =>
			this.setStatus(
				"レンダリングを完了できませんでした。再読み込みしてください。",
			);
		this.worker.postMessage("render");
	}

	resize() {
		const stage = this.querySelector<HTMLElement>("[data-stage]")!;
		this.width = stage.clientWidth;
		this.height = stage.clientHeight;
		const ratio = Math.min(devicePixelRatio || 1, 1.5) * this.scale;
		this.canvas.width = Math.max(1, Math.round(this.width * ratio));
		this.canvas.height = Math.max(1, Math.round(this.height * ratio));
		if (this.width && this.height)
			this.film?.resize(this.width, this.height, this.scale);
		this.dust.width = Math.round(
			this.width * Math.min(devicePixelRatio || 1, 1.5),
		);
		this.dust.height = Math.round(
			this.height * Math.min(devicePixelRatio || 1, 1.5),
		);
		const value = getComputedStyle(this)
			.getPropertyValue("--primary")
			.trim();
		if (value) {
			const sample = document.createElement("canvas").getContext("2d");
			if (sample) {
				sample.fillStyle = value;
				sample.fillRect(0, 0, 1, 1);
				const pixel = sample.getImageData(0, 0, 1, 1).data;
				this.accent = [pixel[0] / 255, pixel[1] / 255, pixel[2] / 255];
			}
		}
	}

	async togglePlay() {
		if (!this.audio.paused) {
			this.audio.pause();
			return;
		}
		try {
			// Browser audio clock remains the sole sync source, including after seeking.
			if (!this.context) {
				try {
					this.context = new AudioContext();
					this.source = this.context.createMediaElementSource(
						this.audio,
					);
					this.analyser = this.context.createAnalyser();
					this.analyser.fftSize = 1024;
					this.analyser.smoothingTimeConstant = 0.65;
					this.source.connect(this.analyser);
					this.analyser.connect(this.context.destination);
				} catch {
					/* Precomputed score also works without Web Audio. */
				}
			}
			if (this.context?.state === "suspended")
				await this.context.resume();
			if (this.audio.ended) this.seek(0);
			await this.audio.play();
			this.setStatus("");
		} catch {
			this.setStatus(
				"再生できませんでした。もう一度再生ボタンを押してください。",
			);
		}
	}

	seek(time: number) {
		this.audio.currentTime = Math.max(
			0,
			Math.min(
				Number.isFinite(this.audio.duration)
					? this.audio.duration
					: analysis.duration,
				time,
			),
		);
		this.sync();
		this.draw();
	}
	setMotion(value: boolean) {
		this.lowMotion = value;
		this.classList.toggle("low-motion", value);
		this.querySelector("[data-motion]")!.setAttribute(
			"aria-pressed",
			String(value),
		);
		cancelAnimationFrame(this.frame);
		this.frame = 0;
		this.draw();
		this.schedule();
	}
	async fullscreen() {
		try {
			if (document.fullscreenElement === this)
				await document.exitFullscreen();
			else await this.requestFullscreen();
		} catch {
			this.setStatus("このブラウザでは全画面表示を利用できません。");
		}
	}
	setStatus(text: string) {
		this.querySelector("[data-status]")!.textContent = text;
	}
	syncPlay() {
		this.querySelectorAll<HTMLButtonElement>(
			'[data-action="play"]',
		).forEach((b) => {
			b.setAttribute(
				"aria-label",
				this.audio.paused ? "再生" : "一時停止",
			);
			b.setAttribute("aria-pressed", String(!this.audio.paused));
		});
	}
	syncVolume() {
		const muted = this.audio.muted || this.audio.volume === 0;
		this.querySelector('[data-action="mute"]')!.setAttribute(
			"aria-pressed",
			String(muted),
		);
		this.querySelector('[data-action="mute"]')!.setAttribute(
			"aria-label",
			muted ? "ミュート解除" : "ミュート",
		);
	}
	sync() {
		const time = this.audio.currentTime;
		const duration = Number.isFinite(this.audio.duration)
			? this.audio.duration
			: analysis.duration;
		const progress =
			this.querySelector<HTMLInputElement>("[data-progress]")!;
		progress.max = String(duration);
		progress.value = String(time);
		progress.style.setProperty("--progress", `${(time / duration) * 100}%`);
		progress.setAttribute(
			"aria-valuetext",
			`${formatTime(time)} / ${formatTime(duration)}`,
		);
		this.querySelector("[data-clock]")!.textContent = formatTime(time);
		let ci = 0;
		for (let i = 0; i < chapters.length; i++)
			if (time >= chapters[i].time) ci = i;
		if (ci !== this.chapterIndex) {
			this.chapterIndex = ci;
			const chapter = chapters[ci];
			this.dataset.scene = String(chapter.scene);
			this.querySelector("[data-chapter-name]")!.textContent =
				chapter.title;
			this.querySelector("[data-chapter-number]")!.textContent = String(
				ci + 1,
			).padStart(2, "0");
			this.querySelectorAll<HTMLElement>("[data-chapter]").forEach(
				(b, i) => {
					b.setAttribute("aria-current", String(i === ci));
				},
			);
		}
		const li = lyrics.findIndex((l) => time >= l.time && time < l.end);
		if (li !== this.lyricIndex) {
			this.lyricIndex = li;
			const line = this.querySelector<HTMLElement>("[data-lyric]")!;
			line.textContent = li >= 0 ? lyrics[li].text : "";
			line.classList.remove("line-enter");
			void line.offsetWidth;
			line.classList.add("line-enter");
			this.querySelectorAll("[data-lyric-row]").forEach((row, i) =>
				row.setAttribute("aria-current", String(i === li)),
			);
		}
		this.classList.toggle("is-intro", time < 6);
		this.classList.toggle("is-ending", time >= 273);
		this.syncPlay();
	}

	schedule() {
		if (
			this.frame ||
			this.audio.paused ||
			this.lowMotion ||
			!this.inView ||
			document.hidden
		)
			return;
		this.frame = requestAnimationFrame((stamp) => {
			this.frame = 0;
			if (this.lastFrame && stamp - this.lastFrame > 55)
				this.slowFrames++;
			else this.slowFrames = Math.max(0, this.slowFrames - 1);
			if (this.slowFrames > 35 && this.scale > 0.5) {
				this.scale -= 0.15;
				this.slowFrames = 0;
				this.resize();
			}
			this.lastFrame = stamp;
			this.draw();
			this.sync();
			this.schedule();
		});
	}

	draw() {
		if (!this.width || !this.height) return;
		const t = this.audio.currentTime || 0;
		let index = 0;
		for (let i = 0; i < chapters.length; i++)
			if (t >= chapters[i].time) index = i;
		const chapter = chapters[index];
		const motionTime = this.lowMotion ? chapter.time + 2 : t;
		this.film?.draw(motionTime, this.width, this.height, this.lowMotion);
		const opening = this.querySelector<HTMLElement>(".ray-opening")!;
		opening.style.opacity = String(Math.max(0, Math.min(1, (8 - t) / 2)));
		opening.style.filter = "none";
		this.style.setProperty(
			"--line-progress",
			this.lyricIndex >= 0
				? String(
						Math.max(
							0,
							Math.min(
								1,
								(t - lyrics[this.lyricIndex].time) /
									(lyrics[this.lyricIndex].end -
										lyrics[this.lyricIndex].time),
							),
						),
					)
				: "0",
		);
	}

	disconnectedCallback() {
		this.audio?.pause();
		cancelAnimationFrame(this.frame);
		this.frame = 0;
		this.abort?.abort();
		this.abort = undefined;
		this.resizeObserver?.disconnect();
		this.visibility?.disconnect();
		this.source?.disconnect();
		this.analyser?.disconnect();
		void this.context?.close();
		this.context = undefined;
		this.source = undefined;
		this.analyser = undefined;
		if (this.gl) {
			if (this.program) this.gl.deleteProgram(this.program);
			if (this.quadBuffer) this.gl.deleteBuffer(this.quadBuffer);
			this.textures.forEach((texture) => this.gl!.deleteTexture(texture));
		}
		this.worker?.terminate();
		this.worker = undefined;
		this.film?.dispose();
		this.film = undefined;
		this.textures = [];
		this.quadBuffer = null;
		// A media element can only be attached to one Web Audio source in its
		// lifetime. A fresh element keeps reconnection audible after closing it.
		this.audio?.replaceWith(this.audio.cloneNode(true));
		this.gl = null;
		this.program = null;
		this.lastFrame = 0;
		this.chapterIndex = -1;
		this.lyricIndex = -2;
		this.cpu = undefined;
	}
}

if (!customElements.get("ray-audiovisual"))
	customElements.define("ray-audiovisual", RayPV);

// Custom element definitions persist through HMR; reload to show the new film.
if (import.meta.hot) import.meta.hot.accept(() => location.reload());
