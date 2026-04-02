import { execSync } from 'node:child_process';

function run(command) {
	console.log(`\n> ${command}`);
	execSync(command, { stdio: 'inherit' });
}

function getTimestamp() {
	const now = new Date();
	const pad = (n) => String(n).padStart(2, '0');
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

try {
	console.log('开始构建项目...');
	run('pnpm build');

	console.log('\n开始提交并推送到 GitHub...');
	run('git add -A');

	let hasChanges = true;
	try {
		execSync('git diff --cached --quiet', { stdio: 'ignore' });
		hasChanges = false;
	} catch {
		hasChanges = true;
	}

	if (!hasChanges) {
		console.log('没有检测到变更，已跳过 commit 和 push。');
		process.exit(0);
	}

	const message = `chore: deploy ${getTimestamp()}`;
	run(`git commit -m "${message}"`);
	run('git push');

	console.log('\n部署完成 ✅');
} catch (error) {
	console.error('\n部署失败 ❌');
	process.exit(error?.status || 1);
}
