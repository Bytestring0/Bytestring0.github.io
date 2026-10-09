import { createHash } from "node:crypto";
import path from "node:path";

export function articleIdentity(filePath, root) {
	const posts = path.resolve(root, "src/content/posts");
	const source = path
		.relative(posts, path.resolve(root, filePath))
		.replaceAll("\\", "/");
	if (
		!source ||
		source.startsWith("../") ||
		path.isAbsolute(source) ||
		!/\.mdx?$/i.test(source)
	) {
		throw new Error(
			"文章必须位于 src/content/posts，且为 .md 或 .mdx 文件。",
		);
	}
	const key = createHash("sha256")
		.update(source.normalize("NFC"))
		.digest("hex")
		.slice(0, 20);
	return { source, key };
}

// Changing the opt-in switch or checkout line endings must not invalidate a design.
export function articleFingerprint(source) {
	const normalized = source.replace(/^\uFEFF/, "").replaceAll("\r\n", "\n");
	const content = normalized.replace(
		/^(---\n)([\s\S]*?)(\n---(?:\n|$))/,
		(_, start, yaml, end) =>
			start +
			yaml
				.split("\n")
				.filter((line) => !/^create\s*:/.test(line))
				.join("\n") +
			end,
	);
	return createHash("sha256").update(content).digest("hex");
}
