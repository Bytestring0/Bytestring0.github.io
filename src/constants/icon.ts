import type { Favicon } from "@/types/config.ts";

export const defaultFavicons: Favicon[] = [
	{
		// 修改图标后同步更新版本号，避免浏览器和 CDN 继续使用旧 favicon。
		src: "/favicon/favicon.ico?v=20260802",
		sizes: "any",
	},
];
