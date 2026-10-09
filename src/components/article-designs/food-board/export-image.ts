import type { FoodCard } from "./model";
import { safeImage } from "./model";

function loadImage(url: string): Promise<HTMLImageElement | null> {
	if (!safeImage(url)) return Promise.resolve(null);
	return new Promise((resolve) => {
		const image = new Image();
		image.crossOrigin = "anonymous";
		const timeout = window.setTimeout(() => {
			image.src = "";
			resolve(null);
		}, 8000);
		image.onload = () => {
			clearTimeout(timeout);
			resolve(image);
		};
		image.onerror = () => {
			clearTimeout(timeout);
			resolve(null);
		};
		image.src = url;
	});
}
function cover(
	ctx: CanvasRenderingContext2D,
	image: HTMLImageElement,
	x: number,
	y: number,
	width: number,
	height: number,
) {
	const factor = Math.max(
		width / image.naturalWidth,
		height / image.naturalHeight,
	);
	const sourceWidth = width / factor,
		sourceHeight = height / factor;
	ctx.drawImage(
		image,
		(image.naturalWidth - sourceWidth) / 2,
		(image.naturalHeight - sourceHeight) / 2,
		sourceWidth,
		sourceHeight,
		x,
		y,
		width,
		height,
	);
}
function wrap(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	width: number,
	lineHeight: number,
) {
	let line = "";
	for (const char of text) {
		if (ctx.measureText(line + char).width > width && line) {
			ctx.fillText(line, x, y);
			line = char;
			y += lineHeight;
		} else line += char;
	}
	ctx.fillText(line, x, y);
}
export async function exportBoardImage(
	board: HTMLElement,
	cards: FoodCard[],
): Promise<{ blob: Blob; missing: number }> {
	await document.fonts.ready;
	const rect = board.getBoundingClientRect();
	const margin = 28,
		top = 66,
		bottom = 45;
	const canvas = document.createElement("canvas");
	const scale = 2;
	canvas.width = Math.ceil(rect.width + margin * 2) * scale;
	canvas.height = Math.ceil(rect.height + top + bottom) * scale;
	const ctx = canvas.getContext("2d")!;
	ctx.scale(scale, scale);
	const theme = getComputedStyle(board);
	const ink = theme.getPropertyValue("--food-ink").trim();
	const paper = theme.getPropertyValue("--food-paper").trim();
	const line = theme.getPropertyValue("--food-line").trim();
	const muted = theme.getPropertyValue("--food-muted").trim();
	ctx.fillStyle = paper;
	ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
	ctx.fillStyle = ink;
	ctx.font = '700 25px "Microsoft YaHei", sans-serif';
	ctx.fillText("北门食评分档板", margin, 43);
	ctx.fillStyle = muted;
	ctx.font = '11px "Microsoft YaHei", sans-serif';
	const assets = new Map(
		await Promise.all(
			cards.map(
				async (card) =>
					[
						card.id,
						await loadImage(card.imageDisplay || card.imageUrl),
					] as const,
			),
		),
	);
	let missing = 0;
	ctx.save();
	ctx.translate(margin, top);
	const rows = [...board.querySelectorAll<HTMLElement>(".tier-row")];
	for (const row of rows) {
		const rowRect = row.getBoundingClientRect();
		const y = rowRect.top - rect.top;
		const label = row.querySelector<HTMLElement>(".tier-label")!;
		const style = getComputedStyle(label);
		const labelWidth = label.getBoundingClientRect().width;
		ctx.fillStyle = style.backgroundColor;
		ctx.fillRect(0, y, labelWidth, rowRect.height);
		ctx.fillStyle = style.color;
		ctx.font = `800 ${style.getPropertyValue("font-size")} "Microsoft YaHei", sans-serif`;
		ctx.textAlign = "center";
		ctx.font = `800 ${getComputedStyle(label.querySelector("strong")!).fontSize} "Microsoft YaHei", sans-serif`;
		ctx.fillText(
			label.querySelector("strong")!.textContent!,
			labelWidth / 2,
			y + rowRect.height / 2 + 10,
		);
		ctx.textAlign = "left";
		const stage = row.querySelector<HTMLElement>(".tier-cards")!;
		for (let dotY = y + 8; dotY < y + rowRect.height; dotY += 16) {
			for (let dotX = labelWidth + 8; dotX < rect.width; dotX += 16) {
				ctx.fillStyle = line;
				ctx.beginPath();
				ctx.arc(dotX, dotY, 0.65, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		for (const element of stage.querySelectorAll<HTMLElement>(
			".postcard",
		)) {
			const card = cards.find(
				(item) => item.id === element.dataset.cardId,
			)!;
			const x = labelWidth + element.offsetLeft,
				cardY = y + element.offsetTop;
			const width = element.offsetWidth,
				height = element.offsetHeight;
			ctx.save();
			ctx.translate(x + width / 2, cardY + height / 2);
			ctx.rotate((card.layout.rotation * Math.PI) / 180);
			ctx.translate(-width / 2, -height / 2);
			ctx.shadowColor = "#23272325";
			ctx.shadowBlur = 7;
			ctx.shadowOffsetY = 4;
			ctx.fillStyle = paper;
			ctx.fillRect(0, 0, width, height);
			ctx.shadowColor = "transparent";
			ctx.strokeStyle = line;
			ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
			const photo = element.querySelector<HTMLElement>(".photo")!;
			const photoWidth = photo.clientWidth,
				photoHeight = photo.clientHeight;
			const image = assets.get(card.id);
			if (image) cover(ctx, image, 9, 9, photoWidth, photoHeight);
			else {
				ctx.fillStyle = theme.getPropertyValue("--food-wash");
				ctx.fillRect(9, 9, photoWidth, photoHeight);
				ctx.fillStyle = muted;
				ctx.font = "32px serif";
				ctx.textAlign = "center";
				ctx.fillText(
					"食",
					9 + photoWidth / 2,
					9 + photoHeight / 2 + 10,
				);
				ctx.textAlign = "left";
				if (card.imageDisplay || card.imageUrl) missing++;
			}
			ctx.fillStyle = ink;
			ctx.font = '600 13px "Microsoft YaHei", sans-serif';
			wrap(ctx, card.name, 12, photoHeight + 32, width - 36, 19);
			ctx.restore();
		}
		ctx.strokeStyle = line;
		ctx.beginPath();
		ctx.moveTo(0, y + rowRect.height);
		ctx.lineTo(rect.width, y + rowRect.height);
		ctx.stroke();
	}
	ctx.strokeStyle = line;
	ctx.strokeRect(0.5, 0.5, rect.width - 1, rect.height - 1);
	ctx.restore();
	ctx.fillStyle = muted;
	ctx.font = '11px "Microsoft YaHei", sans-serif';
	ctx.fillText(
		"个人喜好，仅供参考 · 锐评北门食堂",
		margin,
		top + rect.height + 28,
	);
	const blob = await new Promise<Blob>((resolve, reject) =>
		canvas.toBlob(
			(result) =>
				result ? resolve(result) : reject(new Error("PNG 生成失败")),
			"image/png",
		),
	);
	return { blob, missing };
}
