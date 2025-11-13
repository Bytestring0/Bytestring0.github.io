const ESCAPE_SEQUENCE = "!!";

const escapeHtml = (value) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

const splitSpoilers = (value) => {
	const segments = [];
	let buffer = "";
	let index = 0;

	while (index < value.length) {
		const char = value[index];

		if (char === "\\" && value[index + 1] === "!" && value[index + 2] === "!") {
			buffer += ESCAPE_SEQUENCE;
			index += 3;
			continue;
		}

		if (char === "!" && value[index + 1] === "!") {
			const end = value.indexOf(ESCAPE_SEQUENCE, index + 2);
			if (end === -1) {
				buffer += value.slice(index);
				index = value.length;
				break;
			}

			const hiddenText = value.slice(index + 2, end);

			if (buffer) {
				segments.push({ type: "text", value: buffer });
				buffer = "";
			}

			segments.push({ type: "spoiler", value: hiddenText });
			index = end + 2;
			continue;
		}

		buffer += char;
		index += 1;
	}

	if (buffer) {
		segments.push({ type: "text", value: buffer });
	}

	return segments;
};

const transformNode = (node) => {
	if (!node?.children || node.children.length === 0) {
		return;
	}

	for (let i = 0; i < node.children.length; i += 1) {
		const child = node.children[i];

		if (child.type === "text" && typeof child.value === "string") {
			const parts = splitSpoilers(child.value);
			if (parts.length === 1 && parts[0].type === "text") {
				continue;
			}

			const newNodes = parts.map((part) => {
				if (part.type === "text") {
					return { type: "text", value: part.value };
				}

				const escaped = escapeHtml(part.value);
				return {
					type: "html",
					value: `<span class="hover-reveal" tabindex="0"><span class="hover-reveal__mask">${escaped}</span></span>`,
				};
			});

			node.children.splice(i, 1, ...newNodes);
			i += newNodes.length - 1;
			continue;
		}

		if (child.children && child.children.length > 0) {
			transformNode(child);
		}
	}
};

export function remarkSpoiler() {
	return (tree) => {
		transformNode(tree);
	};
}
