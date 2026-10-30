type Frame = (time: number, delta: number) => boolean;
/** One clock for the water and camera. Hidden tabs do no animation work. */
class Clock {
	private callbacks = new Set<Frame>();
	private id = 0;
	private previous = 0;
	private elapsed = 0;
	constructor() {
		document.addEventListener("visibilitychange", () => {
			cancelAnimationFrame(this.id);
			this.id = 0;
			this.previous = 0;
			if (!document.hidden) this.wake();
		});
	}
	add(callback: Frame) {
		this.callbacks.add(callback);
		this.wake();
		return () => this.callbacks.delete(callback);
	}
	wake = () => {
		if (!this.id && !document.hidden)
			this.id = requestAnimationFrame(this.frame);
	};
	private frame = (now: number) => {
		this.id = 0;
		const dt = Math.min(
			0.04,
			Math.max(0.001, (now - (this.previous || now - 16.67)) / 1000),
		);
		this.previous = now;
		this.elapsed += dt;
		let active = false;
		for (const callback of this.callbacks)
			active = callback(this.elapsed, dt) || active;
		if (active) this.wake();
		else this.previous = 0;
	};
}
export const clock = new Clock();
export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
