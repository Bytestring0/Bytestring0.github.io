import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import {
	articleIdentity,
	articleFingerprint,
} from "./lib/article-design-core.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const usage = `用法：pnpm article-design:check "src/content/posts/文章.md" --route /文章地址/
  --url http://127.0.0.1:4321/文章地址/  使用已有服务，不自动启动
  --out .astro/article-design-check/目录 --widths 390,768,1440 --height 900
  --browser msedge|chrome|chromium --full-page --password-env 环境变量名
输出截图、report.json、report.html；错误时退出码为 1。`;

function options(argv) {
	if (!argv.length || argv.includes("--help")) {
		console.log(usage);
		return null;
	}
	const result = {
		file: argv[0],
		widths: [390, 768, 1440],
		height: 900,
		browser: process.platform === "win32" ? "msedge" : "chromium",
		fullPage: false,
	};
	const names = {
		"--route": "route",
		"--url": "url",
		"--out": "out",
		"--browser": "browser",
		"--widths": "widths",
		"--height": "height",
		"--password-env": "passwordEnv",
	};
	for (let i = 1; i < argv.length; i++) {
		if (argv[i] === "--full-page") {
			result.fullPage = true;
			continue;
		}
		const name = names[argv[i]];
		if (!name || !argv[i + 1] || argv[i + 1].startsWith("--"))
			throw new Error(`参数无效：${argv[i]}\n${usage}`);
		result[name] = argv[++i];
	}
	if (typeof result.widths === "string")
		result.widths = result.widths.split(",").map(Number);
	result.height = Number(result.height);
	if (
		!result.widths.length ||
		[...result.widths, result.height].some(
			(n) => !Number.isInteger(n) || n < 240 || n > 4000,
		)
	)
		throw new Error("视口尺寸必须为 240–4000 的整数。");
	if (
		!result.url &&
		(!result.route?.startsWith("/") || result.route.startsWith("//"))
	)
		throw new Error("请给出 --route /文章地址/ 或 --url 完整地址。");
	if (result.url && !/^https?:\/\//.test(result.url))
		throw new Error("--url 必须为 HTTP(S) 地址。");
	if (!["msedge", "chrome", "chromium"].includes(result.browser))
		throw new Error("不支持的浏览器。");
	return result;
}

// Runs in the page. No assumptions about the authored layout or animation library.
function inspectPage() {
	const selectors = [
		"main",
		"[data-article-page]",
		"[data-blog-navigation]",
		"[data-blog-toc]",
		"[data-blog-comments]",
		"#post-container",
	];
	const counts = Object.fromEntries(
		selectors.map((selector) => [
			selector,
			document.querySelectorAll(selector).length,
		]),
	);
	const blocks = [...document.querySelectorAll("[data-source-block]")].map(
		(element) => {
			const clone = element.cloneNode(true);
			clone
				.querySelectorAll(
					"script, style, [data-pagefind-ignore], .copy-btn, .os-scrollbar",
				)
				.forEach((node) => node.remove());
			let hidden = element.getClientRects().length === 0;
			for (let node = element; node; node = node.parentElement) {
				const style = getComputedStyle(node);
				if (
					style.display === "none" ||
					style.visibility === "hidden" ||
					Number(style.opacity) === 0
				)
					hidden = true;
			}
			return {
				id: element.getAttribute("data-source-block"),
				text: clone.textContent.trim(),
				hidden,
				mermaid: !!element.querySelector(".mermaid svg"),
			};
		},
	);
	const headings = [
		...document.querySelectorAll(
			"#post-container :is(h1,h2,h3,h4,h5,h6)[id]",
		),
	].map((element) => element.id);
	const toc = [
		...document.querySelectorAll("[data-blog-toc] a[href^='#']"),
	].map((link) => {
		let id;
		try {
			id = decodeURIComponent(link.hash.slice(1));
		} catch {
			id = "";
		}
		return { id, exists: !!document.getElementById(id) };
	});
	const duplicates = [
		...new Set(
			[...document.querySelectorAll("[id]")].map((node) => node.id),
		),
	].filter(
		(id) =>
			[...document.querySelectorAll("[id]")].filter(
				(node) => node.id === id,
			).length > 1,
	);
	return {
		counts,
		key: document
			.querySelector("[data-article-page]")
			?.getAttribute("data-article-page"),
		blocks,
		headings,
		toc,
		duplicates,
		overflow:
			document.documentElement.scrollWidth >
			document.documentElement.clientWidth + 1,
		dark: document.documentElement.classList.contains("dark"),
	};
}

function referenceBlocks(html) {
	const document = new DOMParser().parseFromString(html, "text/html");
	return [...document.querySelectorAll("[data-source-block]")].map((node) => {
		node.querySelectorAll(
			"script, style, [data-pagefind-ignore], .copy-btn, .os-scrollbar",
		).forEach((child) => child.remove());
		return {
			id: node.getAttribute("data-source-block"),
			text: node.textContent.trim(),
		};
	});
}

const escape = (value) =>
	String(value).replace(
		/[&<>"']/g,
		(c) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[c],
	);
function writeReport(out, report) {
	fs.writeFileSync(
		path.join(out, "report.json"),
		JSON.stringify(report, null, 2),
	);
	const issues = [
		...report.errors.map((text) => `错误：${text}`),
		...report.warnings.map((text) => `待人工检查：${text}`),
	];
	fs.writeFileSync(
		path.join(out, "report.html"),
		`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>文章设计验收</title><style>body{font:16px/1.8 system-ui,"Microsoft YaHei",sans-serif;max-width:1200px;margin:32px auto;padding:0 24px;background:#f4f5f7;color:#20252d}h1{font-size:28px}.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}figure{margin:0;background:white;padding:16px}img{width:100%;max-height:720px;object-fit:contain;object-position:top}pre{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#265e9b}</style><h1>文章设计验收：${report.errors.length ? "未通过" : "自动检查通过"}</h1><p>${escape(report.source)} · <a href="${escape(report.url)}">页面地址</a> · <a href="report.json">JSON 报告</a></p><p>自动检查不能判断风格是否合适。请查看截图，并测试该页面特有的交互。</p><pre>${escape(issues.join("\n") || "未发现自动检查错误。")}</pre><div class="shots">${report.shots.map((shot) => `<figure><figcaption>${escape(shot.label)}</figcaption><a href="${escape(shot.file)}"><img src="${escape(shot.file)}" alt="${escape(shot.label)}"></a></figure>`).join("")}</div></html>`,
	);
}

async function freePort() {
	const server = net.createServer();
	await new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", resolve);
	});
	const port = server.address().port;
	await new Promise((resolve) => server.close(resolve));
	return port;
}

async function main() {
	const args = options(process.argv.slice(2));
	if (!args) return;
	const { source, key } = articleIdentity(args.file, root);
	const input = fs.readFileSync(path.resolve(root, args.file), "utf8");
	const manifest = JSON.parse(
		fs.readFileSync(
			path.join(
				root,
				"src/components/article-designs/generated",
				`${key}.json`,
			),
			"utf8",
		),
	);
	if (
		manifest.source !== source ||
		manifest.scope !== "page" ||
		manifest.version !== 1
	)
		throw new Error("设计清单绑定无效。");
	const out = path.resolve(
		root,
		args.out || `.astro/article-design-check/${key}`,
	);
	fs.mkdirSync(out, { recursive: true });
	const report = {
		source,
		key,
		url: args.url,
		errors: [],
		warnings: [],
		warmupErrors: [],
		shots: [],
		checks: [],
	};
	if (manifest.sourceHash !== articleFingerprint(input))
		report.warnings.push("原文指纹已变化，请检查适配后 accept-source。");
	let server, browser;
	const addError = (message) => {
		if (!report.errors.includes(message)) report.errors.push(message);
	};
	try {
		if (!args.url) {
			const port = await freePort();
			const log = fs.openSync(path.join(out, "server.log"), "w");
			server = spawn(
				process.execPath,
				[
					path.join(root, "node_modules/astro/bin/astro.mjs"),
					"dev",
					"--host",
					"127.0.0.1",
					"--port",
					String(port),
				],
				{
					cwd: root,
					env: {
						...process.env,
						MIZUKI_ARTICLE_CHECK: "1",
						MIZUKI_ARTICLE_CHECK_CACHE: path.join(
							out,
							"vite-cache",
						),
					},
					windowsHide: true,
					detached: process.platform !== "win32",
					stdio: ["ignore", log, log],
				},
			);
			fs.closeSync(log);
			server.on("error", (error) =>
				addError(`服务启动失败：${error.message}`),
			);
			report.url = new URL(args.route, `http://127.0.0.1:${port}`).href;
			const deadline = Date.now() + 60000;
			let ready = false;
			while (Date.now() < deadline && server.exitCode === null) {
				try {
					await fetch(report.url, {
						signal: AbortSignal.timeout(10000),
					});
					ready = true;
					break;
				} catch {
					await new Promise((resolve) => setTimeout(resolve, 300));
				}
			}
			if (!ready) throw new Error("本地服务未就绪，详见 server.log。");
		}
		try {
			browser = await chromium.launch({
				headless: true,
				// Playwright hides native scrollbars in headless mode by default.
				// Keep them visible so screenshots represent the reader's page.
				ignoreDefaultArgs: ["--hide-scrollbars"],
				...(args.browser === "chromium"
					? {}
					: { channel: args.browser }),
			});
		} catch (error) {
			throw new Error(
				`浏览器启动失败。可安装 Edge/Chrome，或运行 pnpm exec playwright install chromium 后加 --browser chromium。${error.message}`,
			);
		}
		if (server) {
			// Vite can reload while discovering dependencies on its first browser visit.
			// Prepare both routes before measuring; preserve these logs separately.
			const warmup = await browser.newPage();
			warmup.on("console", (message) => {
				if (message.type() === "error")
					report.warmupErrors.push(message.text());
			});
			for (const url of [report.url, new URL("/", report.url).href]) {
				await warmup.goto(url, {
					waitUntil: "domcontentloaded",
					timeout: 30000,
				});
				await warmup.waitForTimeout(1500);
				await warmup.waitForLoadState("networkidle", {
					timeout: 15000,
				});
			}
			await warmup.close();
			if (report.warmupErrors.length)
				report.warnings.push(
					"dev 预热阶段发生依赖优化重载，日志在 warmupErrors；正式检查阶段的错误仍全部计入失败。",
				);
		}
		let page;
		const listen = (page) => {
			page.on("pageerror", (error) => addError(`JS：${error.message}`));
			page.on("console", (message) => {
				if (message.type() === "error")
					addError(`Console：${message.text()}`);
			});
			page.on("response", (response) => {
				if (
					response.status() >= 400 &&
					!new URL(response.url()).pathname.endsWith("/favicon.ico")
				)
					addError(`HTTP ${response.status()}：${response.url()}`);
			});
			page.on("requestfailed", (request) => {
				if (request.failure()?.errorText !== "net::ERR_ABORTED")
					addError(
						`请求失败：${request.url()} ${request.failure()?.errorText}`,
					);
			});
		};
		let expected;
		const check = async (label) => {
			const state = await page.evaluate(inspectPage);
			for (const [selector, count] of Object.entries(state.counts))
				if (count !== 1)
					addError(`${label}：${selector} 数量应为 1，实际 ${count}`);
			if (state.key !== key)
				addError(`${label}：页面不是目标文章的专属设计。`);
			if (state.overflow) addError(`${label}：页面横向溢出。`);
			if (state.duplicates.length)
				addError(`${label}：重复 id：${state.duplicates.join(", ")}`);
			if (
				state.headings.join("|") !==
				state.toc.map((item) => item.id).join("|")
			)
				addError(`${label}：目录与正文标题或顺序不一致。`);
			if (state.toc.some((item) => !item.exists))
				addError(`${label}：目录有无效锚点。`);
			if (expected) {
				if (state.blocks.length !== expected.length)
					addError(`${label}：客户端缺失或重复原文块。`);
				for (const block of expected) {
					const matches = state.blocks.filter(
						(actual) => actual.id === block.id,
					);
					if (matches.length !== 1)
						addError(`${label}：原文块 ${block.id} 缺失或重复。`);
					else if (matches[0].text !== block.text) {
						if (matches[0].mermaid)
							report.warnings.push(
								`${label}：${block.id} 经 Mermaid 转换，请人工核对图形。`,
							);
						else
							addError(
								`${label}：原文块 ${block.id} 的客户端文字发生变化。`,
							);
					}
				}
			}
			const hidden = state.blocks
				.filter((block) => block.hidden)
				.map((block) => block.id);
			if (hidden.length)
				report.warnings.push(
					`${label}：正文块 ${hidden.join(",")} 当前隐藏；分屏/动画需验证可达性。`,
				);
			report.checks.push({
				label,
				...state,
				blocks: state.blocks.map(({ text, ...block }) => block),
			});
		};
		for (const theme of ["light", "dark"]) {
			await page?.close();
			page = await browser.newPage({
				storageState: {
					cookies: [],
					origins: [
						{
							origin: new URL(report.url).origin,
							localStorage: [{ name: "theme", value: theme }],
						},
					],
				},
			});
			listen(page);
			for (const width of args.widths) {
				await page.setViewportSize({ width, height: args.height });
				const response = await page.goto(report.url, {
					waitUntil: "networkidle",
					timeout: 30000,
				});
				if (response?.status() !== 200)
					addError(`文章返回 HTTP ${response?.status()}。`);
				const html =
					(await response
						?.text()
						.catch(async () => (await fetch(report.url)).text())) ||
					"";
				if (!expected)
					expected = await page.evaluate(referenceBlocks, html);
				if (await page.locator("#password-protection").count()) {
					const password =
						args.passwordEnv && process.env[args.passwordEnv];
					if (!password)
						throw new Error(
							"加密文章需要 --password-env 指定密码环境变量；密码不会写入报告。",
						);
					await page.locator("#password-input").fill(password);
					await page.locator("#unlock-btn").click();
					await page.locator("#post-container").waitFor();
					if (!expected.length) {
						expected = await page.evaluate(
							referenceBlocks,
							await page.content(),
						);
						report.warnings.push(
							"加密文章以解锁后的 DOM 为基线，原文保护由服务端 ArticleContent 校验。",
						);
					}
				}
				await page.waitForTimeout(500);
				const label = `${theme}-${width}`;
				await check(label);
				if (
					(await page.evaluate(() =>
						document.documentElement.classList.contains("dark"),
					)) !==
					(theme === "dark")
				)
					addError(`${label}：主题切换未生效。`);
				const file = `${label}.png`;
				await page.screenshot({
					path: path.join(out, file),
					fullPage: args.fullPage,
				});
				report.shots.push({ label, file });
			}
		}
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.waitForTimeout(300);
		await check("reduced-motion");
		await page.screenshot({
			path: path.join(out, "reduced-motion.png"),
			fullPage: args.fullPage,
		});
		report.shots.push({
			label: "减少动态偏好",
			file: "reduced-motion.png",
		});
		// Exercise real Swup replacement from ordinary page, not just a hard reload.
		await page.setViewportSize({
			width: Math.max(...args.widths),
			height: args.height,
		});
		await page.goto(new URL("/", report.url).href, {
			waitUntil: "networkidle",
		});
		await page.evaluate((url) => {
			window.__articleCheckSentinel = true;
			const link = document.createElement("a");
			link.id = "article-check-enter";
			link.href = url;
			link.textContent = "文章验收入口";
			document.querySelector("main").prepend(link);
		}, report.url);
		await page.locator("#article-check-enter").click();
		await page.waitForURL(report.url);
		// Route changes can finish before new module scripts register the TOC.
		// Wait for its observable contract instead of an arbitrary 800 ms delay;
		// a genuinely missing TOC still fails the following check on timeout.
		if (!args.passwordEnv) {
			await page
				.waitForFunction(
					() => {
						const headings = [
							...document.querySelectorAll(
								"#post-container :is(h1,h2,h3,h4,h5,h6)[id]",
							),
						].map((node) => node.id);
						const links = [
							...document.querySelectorAll(
								"[data-blog-toc] a[href^='#']",
							),
						].map((node) => decodeURIComponent(node.hash.slice(1)));
						return (
							!!document.querySelector("[data-blog-toc]") &&
							headings.join("|") === links.join("|")
						);
					},
					{},
					{ timeout: 5000 },
				)
				.catch(() => {});
		}
		if (!(await page.evaluate(() => window.__articleCheckSentinel)))
			addError("页面切入触发了完整刷新，未验证 Swup 交互。");
		if (!args.passwordEnv) await check("ordinary-to-design");
		await page.goBack();
		await page.waitForTimeout(500);
		if (await page.locator("[data-article-page]").count())
			addError("返回普通页面后仍残留专属布局。");
		report.warnings.push(
			"还需人工查看截图，测试目录点击、自定义动画/分屏、菜单、搜索及评论交互。自动检查不判断审美，也不能证明所有交互正确。",
		);
	} catch (error) {
		addError(error.message);
	} finally {
		await browser?.close();
		if (server?.pid) {
			if (process.platform === "win32") {
				try {
					execFileSync(
						"taskkill",
						["/pid", String(server.pid), "/t", "/f"],
						{ windowsHide: true, stdio: "ignore" },
					);
				} catch {}
			} else {
				try {
					process.kill(-server.pid, "SIGTERM");
				} catch {}
			}
		}
		writeReport(out, report);
	}
	console.log(
		`${report.errors.length ? "未通过" : "自动检查通过"}：${report.errors.length} 个错误，${report.shots.length} 张截图。\n${path.join(out, "report.html")}`,
	);
	if (report.errors.length) {
		report.errors.slice(0, 12).forEach((error) => console.error(error));
		process.exitCode = 1;
	}
}
main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
