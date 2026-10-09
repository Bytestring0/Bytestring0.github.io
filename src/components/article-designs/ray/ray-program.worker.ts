import { renderMemory } from "./comet-program";
self.onmessage = () => {
	const result = renderMemory();
	self.postMessage(result, {
		transfer: [
			result.pixels.buffer,
			result.background.buffer,
			result.field.buffer,
		],
	});
};
