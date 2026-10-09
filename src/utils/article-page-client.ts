// Public browser-side bridge for authored navigation and table-of-contents UI.
export { setTheme, getStoredTheme, setHue, getHue } from "./setting-utils";

export interface ArticleHeading {
	id: string;
	text: string;
	depth: number;
	element: HTMLElement;
}

export function getArticleHeadings(): ArticleHeading[] {
	return [
		...document.querySelectorAll<HTMLElement>(
			"#post-container h1[id], #post-container h2[id], #post-container h3[id], #post-container h4[id], #post-container h5[id], #post-container h6[id]",
		),
	].map((heading) => {
		const clone = heading.cloneNode(true) as HTMLElement;
		clone
			.querySelectorAll(".anchor, [data-pagefind-ignore]")
			.forEach((node) => node.remove());
		return {
			id: heading.id,
			text: clone.textContent || "",
			depth: Number(heading.tagName.slice(1)),
			element: heading,
		};
	});
}

export function notifyArticleContentReady(): void {
	document.dispatchEvent(new CustomEvent("article:content-ready"));
}
