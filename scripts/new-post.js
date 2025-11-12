import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const POSTS_ROOT = path.resolve(ROOT_DIR, "src", "content", "posts");
const DEFAULT_TEMPLATE = path.resolve(
	ROOT_DIR,
	"scripts",
	"templates",
	"post.md",
);
const IMAGES_POOL_FILE = path.resolve(ROOT_DIR, "scripts", "images.yml");

function usage() {
	console.log(`Usage:
  pnpm new post "你的文章标题" [options]
  pnpm new-post "你的文章标题" [options]

Options:
  --dir <subdir>        指定分类目录（相对于 src/content/posts）
  --tags <t1,t2>        逗号分隔的标签列表
  --category <name>     指定分类名称
  --author <name>       指定作者名称
  --img <url>           指定封面图片地址（覆盖随机选择）
  --draft               以草稿状态创建（production 不会展示）
  --folder              以文件夹 + index.md 结构创建文章
  --template <path>     使用自定义模板（可使用 {{title}} 等占位符）
  --force               覆盖已存在的文件
`);
}

function loadImagePool() {
	if (!fs.existsSync(IMAGES_POOL_FILE)) {
		return [];
	}
	const raw = fs.readFileSync(IMAGES_POOL_FILE, "utf-8");
	return raw
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith("#"))
		.map((line) => line.replace(/^[-\s]+/, "").trim())
		.filter(Boolean);
}

function pickRandomImage(pool) {
	if (!pool.length) {
		return "";
	}
	const index = Math.floor(Math.random() * pool.length);
	return pool[index];
}

function getDate() {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function getDateTime() {
	return new Date().toISOString();
}

function slugify(input) {
	return (
		input
			.trim()
			.toLowerCase()
			.replace(/[\s_]+/g, "-")
			.replace(/[^a-z0-9\u3400-\u9fff-]/g, "")
			.replace(/-+/g, "-")
			.replace(/^-+|-+$/g, "") || "untitled"
	);
}

function parseList(value) {
	if (!value) return [];
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function fillTemplate(template, context) {
	return Object.entries(context).reduce((result, [key, value]) => {
		const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
		return result.replace(pattern, value ?? "");
	}, template);
}

const rawArgs = process.argv.slice(2);

if (
	rawArgs.length === 0 ||
	rawArgs.some((arg) => ["--help", "-h"].includes(arg)) ||
	(rawArgs[0] && rawArgs[0].toLowerCase() === "help")
) {
	usage();
	process.exit(rawArgs.length === 0 ? 1 : 0);
}

let resourceType = "post";
if (rawArgs[0] && !rawArgs[0].startsWith("--")) {
	const first = rawArgs[0].toLowerCase();
	if (["post"].includes(first)) {
		resourceType = first;
		rawArgs.shift();
	}
}

if (resourceType !== "post") {
	console.error(
		`Unsupported resource type: ${resourceType}. Currently only "post" is supported.`,
	);
	process.exit(1);
}

const options = {
	postDir: "",
	category: "未分类",
	tags: [],
	author: "Bytestring",
	image: "",
	draft: false,
	folder: false,
	template: "",
	force: false,
};

const titleParts = [];
let i = 0;
while (i < rawArgs.length) {
	const arg = rawArgs[i];
	if (arg.startsWith("--")) {
		const [flag, inlineValue] = arg.split("=", 2);
		let value = inlineValue;
		if (
			value === undefined &&
			rawArgs[i + 1] &&
			!rawArgs[i + 1].startsWith("--")
		) {
			value = rawArgs[i + 1];
			i += 1;
		}
		switch (flag) {
			case "--dir":
				options.postDir = value ? value.trim() : "";
				options.category = options.postDir;
				break;
			case "--category":
				options.category = value ? value.trim() : "";
				break;
			case "--tags":
				options.tags = parseList(value);
				break;
			case "--author":
				options.author = value ? value.trim() : "Bytestring";
				break;
			case "--img":
				options.image = value ? value.trim() : "";
				break;
			case "--draft":
				options.draft = value ? value !== "false" : true;
				break;
			case "--folder":
				options.folder = value ? value !== "false" : true;
				break;
			case "--template":
				options.template = value ? value.trim() : "";
				break;
			case "--force":
				options.force = true;
				break;
			default:
				console.warn(`Unknown option ignored: ${flag}`);
		}
	} else {
		titleParts.push(arg);
	}
	i += 1;
}

const title = titleParts.join(" ").trim();

if (!title) {
	console.error("Error: Title is required. Use --help to see usage.");
	usage();
	process.exit(1);
}

const slug = options.slug ? slugify(options.slug) : slugify(title);
const date = getDate();
const dateTime = getDateTime();
const tags = options.tags;
const tagsJson = tags.length
	? `[${tags.map((tag) => `"${tag}"`).join(", ")}]`
	: "[]";
const tagsFrontMatter = tags.length
	? `tags:\n${tags.map((tag) => `  - ${tag}`).join("\n")}`
	: "tags: []";

const baseDir = options.postDir
	? path.join(POSTS_ROOT, options.postDir)
	: POSTS_ROOT;
const targetDir = options.folder ? path.join(baseDir, slug) : baseDir;
const fileName = options.folder ? "index.md" : `${slug}.md`;
const targetPath = path.join(targetDir, fileName);

if (fs.existsSync(targetPath) && !options.force) {
	console.error(
		`Error: File already exists -> ${targetPath}\nUse --force 覆盖或更换 slug/title。`,
	);
	process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

const templatePath = options.template
	? path.resolve(process.cwd(), options.template)
	: DEFAULT_TEMPLATE;

let templateContent = "";
if (fs.existsSync(templatePath)) {
	templateContent = fs.readFileSync(templatePath, "utf-8");
} else {
	templateContent = `---\ntitle: "{{title}}"\nslug: "{{slug}}"\npublished: {{date}}\nupdated: {{date}}\ndescription: ""\n${tagsFrontMatter}\ncategory: "{{category}}"\nauthor: "{{author}}"\nimage: "{{image}}"\ncover: ""\ndraft: {{draft}}\nlang: ""\n---\n\n# {{title}}\n\n> 在此开始你的创作~\n`;
}

const imagePool = loadImagePool();
const randomImage = pickRandomImage(imagePool);
const image = options.image || randomImage;

const context = {
	title,
	slug,
	date,
	datetime: dateTime,
	year: date.split("-")[0],
	month: date.split("-")[1],
	day: date.split("-")[2],
	category: options.category,
	categoryLine: `category: "${options.category}"`,
	author: options.author,
	authorLine: `author: "${options.author}"`,
	image,
	imageLine: `image: "${image}"`,
	tagsJson,
	tagsFrontMatter,
	tagsInline: tags.join(", "),
	tagsList: tags.map((tag) => `- ${tag}`).join("\n"),
	tagsYaml: tags.length
		? `\n${tags.map((tag) => `  - ${tag}`).join("\n")}`
		: "",
	draft: options.draft ? "true" : "false",
};

const output = fillTemplate(templateContent, context);

fs.writeFileSync(targetPath, output, "utf-8");

console.log(`✅ Post created at: ${targetPath}`);
if (!options.image && image) {
	console.log(`🎲 随机封面: ${image}`);
}
if (!image) {
	console.warn(
		"⚠️  未找到可用的封面图片，请检查 scripts/images.yml 或使用 --img 手动指定。",
	);
}
if (!fs.existsSync(templatePath)) {
	console.warn(`⚠️  使用内置模板，因为未找到 ${templatePath}。`);
}
