#!/usr/bin/env node
/**
 * 抓取 GitHub 仓库信息，生成项目时间线所需的数据。
 *
 * - 构建期运行一次，写入 src/data/github-repos.json
 * - 网络不可用时保留旧文件，不会让构建失败
 * - 可用 GITHUB_TOKEN 提高速率限制
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const USER = "Bytestring0";
const OUT = path.join(process.cwd(), "src", "data", "github-repos.json");

const headers = {
	"User-Agent": "mizuki-blog-build",
	Accept: "application/vnd.github+json",
};
if (process.env.GITHUB_TOKEN) {
	headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function main() {
	const url = `https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`;
	const res = await fetch(url, { headers });
	if (!res.ok) throw new Error(`GitHub API ${res.status}`);

	const repos = await res.json();
	const list = repos
		.filter((repo) => !repo.archived)
		.map((repo) => ({
			name: repo.name,
			fullName: repo.full_name,
			description: repo.description || "",
			url: repo.html_url,
			homepage: repo.homepage || "",
			language: repo.language || "",
			topics: Array.isArray(repo.topics) ? repo.topics : [],
			stars: repo.stargazers_count ?? 0,
			forks: repo.forks_count ?? 0,
			fork: Boolean(repo.fork),
			createdAt: repo.created_at,
			pushedAt: repo.pushed_at,
			updatedAt: repo.updated_at,
		}))
		.sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));

	const payload = {
		user: USER,
		fetchedAt: new Date().toISOString(),
		repos: list,
	};

	fs.mkdirSync(path.dirname(OUT), { recursive: true });
	fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
	console.log(`✓ github: ${list.length} repos -> src/data/github-repos.json`);
}

main().catch((error) => {
	const fallback = fs.existsSync(OUT);
	console.warn(
		`⚠ github fetch failed: ${error.message}` +
			(fallback ? "（沿用上次的 github-repos.json）" : ""),
	);
	process.exit(0);
});
