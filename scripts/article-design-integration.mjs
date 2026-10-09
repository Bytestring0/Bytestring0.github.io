import { fileURLToPath } from "node:url";
import { pruneArticleDesigns } from "./lib/article-design-prune.mjs";

export default function articleDesignIntegration() {
	return {
		name: "mizuki-article-design",
		hooks: {
			"astro:config:setup": ({
				command,
				config,
				logger,
				updateConfig,
			}) => {
				if (
					command === "dev" &&
					process.env.MIZUKI_ARTICLE_CHECK === "1"
				)
					updateConfig({
						devToolbar: { enabled: false },
						...(process.env.MIZUKI_ARTICLE_CHECK_CACHE
							? {
									vite: {
										cacheDir:
											process.env
												.MIZUKI_ARTICLE_CHECK_CACHE,
									},
								}
							: {}),
					});
				if (command !== "build") return;
				const report = pruneArticleDesigns(fileURLToPath(config.root), {
					apply: true,
				});
				for (const item of report.candidates)
					logger.info(
						`已清理删除文章的设计：${item.source} (${item.key})`,
					);
				for (const item of report.skipped)
					logger.warn(`保留 ${item.file}：${item.reason}`);
			},
		},
	};
}
