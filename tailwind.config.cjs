/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

// 中性色 / 主色 / 语义色都来自 src/styles/tokens.css 的 CSS 变量。
// 禁用 Tailwind 默认调色板，避免 neutral-50…950 这类颜色再次混进界面。
const channel = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const n = Object.fromEntries(
	[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => [step, channel(`n-${step}`)]),
);

module.exports = {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,mjs}"],
	darkMode: "class",
	theme: {
		colors: {
			transparent: "transparent",
			current: "currentColor",
			inherit: "inherit",
			white: "#ffffff",
			black: "#000000",
			n,
			accent: {
				DEFAULT: channel("accent"),
				hover: channel("accent-hover"),
				soft: channel("accent-soft"),
				strong: channel("accent-soft-strong"),
				contrast: channel("accent-contrast"),
			},
			blue: { DEFAULT: channel("blue"), soft: channel("blue-soft") },
			success: { DEFAULT: channel("success"), soft: channel("success-soft") },
			warning: { DEFAULT: channel("warning"), soft: channel("warning-soft") },
			danger: { DEFAULT: channel("danger"), soft: channel("danger-soft") },
			info: { DEFAULT: channel("info"), soft: channel("info-soft") },
		},
		fontFamily: {
			sans: [
				"Inter",
				"PingFang SC",
				"Hiragino Sans GB",
				"Microsoft YaHei",
				"Source Han Sans SC",
				"Noto Sans SC",
				"WenQuanYi Micro Hei",
				...defaultTheme.fontFamily.sans,
			],
			serif: [
				"Source Serif 4",
				"Songti SC",
				"Noto Serif SC",
				"Source Han Serif SC",
				"SimSun",
				"Georgia",
				...defaultTheme.fontFamily.serif,
			],
			mono: [
				"JetBrains Mono",
				"MapleMonoNormal-NF-CN-Regular",
				"ui-monospace",
				"SFMono-Regular",
				"Cascadia Code",
				"Sarasa Mono SC",
				"Noto Sans Mono CJK SC",
				"Menlo",
				"Consolas",
				...defaultTheme.fontFamily.mono,
			],
		},
		// 圆角上限 16px，超过 2xl 的一律压回 16px
		borderRadius: {
			none: "0",
			sm: "6px",
			DEFAULT: "8px",
			md: "10px",
			lg: "12px",
			xl: "14px",
			"2xl": "16px",
			"3xl": "16px",
			full: "9999px",
		},
		// 只有极淡的阴影，不允许硬阴影
		boxShadow: {
			none: "none",
			sm: "0 1px 2px rgb(22 26 23 / 0.04)",
			DEFAULT: "0 1px 2px rgb(22 26 23 / 0.04)",
			md: "0 2px 8px rgb(22 26 23 / 0.05)",
			lg: "0 2px 8px rgb(22 26 23 / 0.05)",
			xl: "0 2px 8px rgb(22 26 23 / 0.05)",
			"2xl": "0 2px 8px rgb(22 26 23 / 0.05)",
			inner: "inset 0 0 0 1px rgb(22 26 23 / 0.04)",
			soft: "0 1px 2px rgb(22 26 23 / 0.04)",
			"soft-lg": "0 2px 8px rgb(22 26 23 / 0.05)",
		},
		extend: {
			screens: {
				md: "768px",
				lg: "1280px",
			},
		},
	},
	plugins: [require("@tailwindcss/typography")],
};
