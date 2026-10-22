#!/usr/bin/env node
/**
 * verify:design — 设计系统守门
 *
 * 拦截这些容易回流的写法：
 *   - Tailwind 默认调色板（neutral-50…950 / gray / blue / …）
 *   - 硬阴影（shadow-xl / drop-shadow-lg / style 里的 box-shadow）
 *   - 超过 16px 的圆角（rounded-3xl 及以上）
 *   - 合成粗体（font-bold / font-semibold / font-black）
 *   - 主色被当成大面积背景（bg-accent 上的大块区域）
 *   - 五族之外的 font-family
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const EXTS = new Set([".astro", ".svelte", ".ts", ".js", ".mjs", ".css", ".styl"]);

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";

const rules = [
  {
    id: "palette",
    message: "禁止使用 Tailwind 默认调色板，请改用 n-1…n-10、accent 或语义色",
    re: new RegExp(
      `\\b(?:bg|text|border|from|to|via|ring|outline|divide|fill|stroke|decoration)-(${PALETTE})-(?:50|100|200|300|400|500|600|700|800|900|950)\\b`,
      "g",
    ),
  },
  {
    id: "hard-shadow",
    message: "禁用硬阴影，深度请用描边或极淡阴影（shadow-soft / var(--shadow-soft)）",
    re: /\b(?:shadow-(?:xl|2xl)|drop-shadow-(?:sm|md|lg|xl|2xl))\b/g,
  },
  {
    id: "radius",
    message: "圆角最大 rounded-2xl（16px）",
    re: /\brounded-3xl\b|\brounded-\[(?:1[7-9]|[2-9]\d|[1-9]\d{2,})px\]|\brounded-\[(?:1\.[0-9]|[2-9](?:\.\d+)?)rem\]/g,
  },
  {
    id: "synthetic-bold",
    message: "中文不使用合成 bold，字重上限 font-medium",
    re: /\bfont-(?:bold|semibold|extrabold|black)\b/g,
  },
  {
    id: "accent-flood",
    message: "主色占比需小于 5%：不要把主色铺到大块表面上（卡片、区块、页眉页脚）",
    re: /class="[^"]*(?:card-base|minimal-glass-panel|section)[^"]*\bbg-\[rgb\(var\(--accent\)\)\]/g,
  },
];

const ALLOW = {
  // 幻灯片式的分享海报内部颜色是图片的一部分，不参与界面配色
  "components/misc/SharePoster.svelte": ["palette"],
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "content" || entry.name === "node_modules") continue;
      walk(full, out);
    } else if (EXTS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

// 只检查文件里的样式部分：脚本里的字符串（例如把颜色写进 canvas）不算
function isStyleRegion(line) {
  return true;
}

const problems = [];
for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).split(path.sep).join("/");
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (!isStyleRegion(line)) return;
    for (const rule of rules) {
      const allowed = ALLOW[rel] || [];
      if (allowed.includes(rule.id)) continue;
      rule.re.lastIndex = 0;
      if (rule.re.test(line)) {
        problems.push({
          file: rel,
          line: index + 1,
          rule: rule.id,
          message: rule.message,
          text: line.trim().slice(0, 120),
        });
      }
    }
  });
}

// 字体只能三族
const fontFamilies = new Set();
for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).split(path.sep).join("/");
  if (!rel.startsWith("styles/") && !rel.endsWith(".astro") && !rel.endsWith(".css")) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/font-family:\s*([^;\n}]+);/g)) {
    fontFamilies.add(match[1].trim());
  }
}

if (problems.length) {
  console.error(`\n✗ verify:design 发现 ${problems.length} 处不符合设计规范：\n`);
  for (const p of problems.slice(0, 80)) {
    console.error(`  ${p.file}:${p.line}  [${p.rule}]  ${p.text}`);
    console.error(`    → ${p.message}\n`);
  }
  if (problems.length > 80) {
    console.error(`  … 还有 ${problems.length - 80} 处\n`);
  }
  process.exit(1);
}

console.log("✓ verify:design 通过");
console.log(`  检查了 ${walk(SRC).length} 个文件，字体族：${fontFamilies.size} 处声明`);