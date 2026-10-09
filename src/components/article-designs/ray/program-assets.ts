export type { ProgramTrace } from "./comet-program";
export const programSource = [
	"back = renderStars(memory.stars);",
	"for (P4 of pixelGroups(back)) {",
	"  bg = load4(back, P4);",
	"  [d, n] = distanceToTrail(P4, memory.path);",
	"  a = coverage(d);",
	"  if (all(a == 0)) {",
	"    store4(back, P4, bg); continue;",
	"  }",
	"  glass = sampleStars(P4 + n * refraction);",
	"  rgb = mix(bg, glass + rim(d), a);",
	"  store4(back, P4, rgb);",
	"}",
	"presentCompletedFrame(back);",
];
export function sourceCanvas() {
	const canvas = document.createElement("canvas");
	canvas.width = 1280;
	canvas.height = 720;
	const c = canvas.getContext("2d")!;
	c.fillStyle = "#060e19";
	c.fillRect(0, 0, 1280, 720);
	c.font = "500 29px Consolas,monospace";
	c.fillStyle = "#e7f5ff";
	c.fillText("RAY / renderMemory()", 62, 66);
	c.font = "17px Consolas,monospace";
	c.fillStyle = "#6a94aa";
	c.fillText("CPU SOFTWARE RENDERER  /  STARS + STORED TRAJECTORY", 62, 105);
	c.font = "24px Consolas,monospace";
	programSource.forEach((line, i) => {
		c.fillStyle = "#42677c";
		c.fillText(String(i + 1).padStart(2, "0"), 62, 153 + i * 37);
		c.fillStyle = line.includes("store")
			? "#ffd497"
			: line.includes("if")
				? "#d2b3ff"
				: "#b0dfe9";
		c.fillText(line, 112, 153 + i * 37);
	});
	return canvas;
}
