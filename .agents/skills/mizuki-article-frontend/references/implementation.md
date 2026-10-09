# 整页设计接口

## 初始化与绑定

```sh
pnpm article-design status "src/content/posts/分类/文章.md"
# 与用户确认后，设 create: true，再初始化起点
pnpm article-design init "src/content/posts/分类/文章.md" lab
pnpm article-design lint "src/content/posts/分类/文章.md"
pnpm article-design accept-source "src/content/posts/分类/文章.md"
```

status 只读，输出 key、文件路径、plan 与 missing/current/source-changed/incomplete。init 只创建，不覆盖、不改正文、不调用模型；accept-source 只在适配检查完成后更新指纹。

文件在 `src/components/article-designs/generated/<key>.astro` 与同名 `.json`。key 为相对 `src/content/posts/` 的路径（含扩展名）SHA-256 前 20 位，与标题、permalink/alias 无关。清单为 `{version:1, scope:"page", source, sourceHash, template, plan}`；scope 表示**完整页面**，不再支持旧的内容栏/宽屏开关。

内容变更复用既有设计和最新原文，不重新生成。改名/移动 md 时查询旧、新 key，迁移组件/清单及 CSS 选择器、更新 source 后 accept-source；保留 plan，不覆盖目标已有设计。两套路由 `posts/[...slug].astro`、`[permalink].astro` 直接在原版页面和完整专属页面之间选择；不再将专属页面嵌入 MainGridLayout。

删除 md/mdx 后，下次 Astro 构建在组件发现前清理对应设计对；普通 dev/check 不删除。create:false、draft 和内容更新均保留设计。移动文章时必须先迁移绑定，不能先构建再找旧设计。清理预览及浏览器工具见 [validation.md](validation.md)。

## 生成组件的输入

- `entry`：CollectionEntry，标题、封面、日期等在 entry.data。
- `headings`：Astro 原文标题数据。实际目录按新 DOM 顺序生成。
- `article.html`：Astro 编译的原文 HTML。
- `article.blocks`：每块 `{id, html, text, tag, headingId?}`。结构性 section 已拆开，代码/公式/表格/列表/MDX 组件及资源保留。id 如 b0 会随正文插入变化，长期定位优先 headingId。
- `designKey`：设计绑定 key。

## 组件契约

生成目录中用 `../组件名.astro` 引入，客户端接口用 `../../../utils/article-page-client`。

| 接口 | 参数/用途 | 可以设计的部分 |
| --- | --- | --- |
| `PageShell` | `entry`, `designKey`, 可选 `class`，default/head slots | 完整页面的 DOM、所有区域排列和可用宽度。只提供 HTML/head、SEO、主题变量、全站运行时和唯一 main，不套原网格/卡片 |
| `PageNavigation` | 可选 `class`，default slot | 默认复用 Navbar（链接、菜单、搜索、主题切换）；可完全自定义 slot 的导航 UI，通过客户端 API 连接原功能 |
| `PageTOC` | 可选 `class`, `label`，label slot | 自动按实际原文 DOM 生成目录，CSS/位置自由，支持解密后更新。自制目录也可直接用公开 API 和 `data-blog-toc` 标记 |
| `ArticleContent` | `entry`, `article`, 可选 `class`，default slot | 原文保护与加密边界，提供唯一 `#post-container`，没有宽度/卡片/排版限制 |
| `SourceBlock` | `block`, 可选 `class`, `prose=false` | 呈现一块原文，可在任意布局中排列；关闭 prose 后自行排版 |
| `PageComments` | `entry`, 可选 `class`，default slot | 默认复用原评论组件；可通过 slot 自行组合评论区域。位置与外观自由，沿用原评论数据，不创建另一套评论后台 |
| `PagePagination` | `entry`, 可选 `class` | 相邻文章链接；也可自己用 entry.data 的 prev/next 和 url-utils 生成 |
| `PageFooter` | 可选 `class`，default slot | 默认原页脚，可自定义；用户已有版权/授权要求仍要保留 |
| `ExperienceHeader`, `ExperienceFooter` | `entry` | 可选的标题/元信息/封面和文章授权信息，不限制重新设计 |

最小结构（只是接口示例，布局与视觉均可彻底重写）：

```astro
---
import PageShell from "../PageShell.astro";
import PageNavigation from "../PageNavigation.astro";
import PageTOC from "../PageTOC.astro";
import PageComments from "../PageComments.astro";
import PageFooter from "../PageFooter.astro";
import ArticleContent from "../ArticleContent.astro";
import SourceBlock from "../SourceBlock.astro";
const { entry, article, designKey } = Astro.props;
---
<PageShell entry={entry} designKey={designKey}>
  <PageNavigation />
  <PageTOC />
  <ArticleContent entry={entry} article={article}>
    <h1 data-pagefind-meta="title">{entry.data.title}</h1>
    <div data-pagefind-body>
      {article.blocks.map(block => <SourceBlock block={block} />)}
    </div>
  </ArticleContent>
  <PageComments entry={entry} />
  <PageFooter />
</PageShell>
```

整页检查要求恰好一个 html/body/main 和 `data-blog-navigation`、`data-blog-toc`、`data-blog-comments` 接口标记。这些标记由对应组件提供；自定义导航/目录时仍应保留接口标记与功能。**Agent 负责把组件放进生成页面**，路由不会在外面偷偷再套导航/目录/评论。默认内容字号桌面 18px、手机 16px，页面没有旧的宽度上限，均可按确认方案修改。

## 原文重排与加密

`groupArticleBlocks(article, depth=2)` 在 `../../../utils/article-source` 按原文 h1/h2 分组，可重排组/块或分配到不同列，不复制正文。每块恰好出现一次；不手抄成另一份 HTML。新增导读/补充放在 source-block 标记之外并标明 AI 来源。

要制作字词动画，可以自己输出 `[data-source-block={block.id}]` 并给原 HTML 增加 span 等展示标记；保持逐字 textContent，及代码/公式/表格/媒体/链接/锚点不变。dev/build 会检查缺块、重复、文字和受保护元素。校验不证明可见性，禁止用隐藏正文绕过。

原文、私密导读及与正文相关的可泄露信息放在 `ArticleContent` 里；加密文章这个区域会进入原 Encryptor。导航、目录空壳、评论可在外部自由布局。目录在解密后读取实际标题。不要在公开脚本/JSON/外部资源中硬编码私密文字。禁 JS 加密文章仍按原站的密码机制处理。

## 客户端交互接口

`../../../utils/article-page-client` 导出：

- `getArticleHeadings()` → `{id,text,depth,element}[]`，实际 DOM 顺序、去除标题的 # 装饰；可用于自制可视目录。
- `setTheme("light"|"dark")`、`getStoredTheme()`：原站主题状态与持久化。
- `setHue(number)`、`getHue()`：原站主题色。仅在用户确认允许时调用；不要借接口大范围改色。
- `notifyArticleContentReady()`：通知目录在内容重新编排后刷新。

目录链接保留 `href="#原文id"`。PageTOC 点击时发出冒泡、可取消的 `article:toc-navigate`，`detail={id,target}`。复杂分屏/场景可拦截它，先展开目标内容，再滚动；不拦截则保持普通锚点。目录与正文在同一页面，不做 iframe。

PageComments 复用 Twikoo 原配置；切页后原 `mizuki:page:loaded` 事件继续初始化。跨原版/专属页面时，全站 Swup 桥接会替换 body，避免旧导航/评论残留；无需 agent 手动同时处理两套路由。新增页面交互用唯一 custom element，connectedCallback 初始化，disconnectedCallback 清理事件/observer/rAF/timer；注册前检查 customElements.get。不要只依赖一次 DOMContentLoaded。

## 样式、模板与验证

- CSS 放 `<style is:inline>` 并用 `[data-article-design="具体 key"]` 限定。该根标记覆盖**整页**，因此可以设计导航、目录、评论和页脚，不仅是正文。Swup dev 不更新 head，文章内 inline 样式能随整页替换。inline CSS 不支持 `:global(...)`。
- 模板 editorial/lab/story **只参考组件接法和结构，不直接复用布局交付**；init 创建绑定后按文章改写。具体实施和公式、表格、sticky、滚动揭示方法见 [working-method.md](working-method.md)。
- 保持主题变量、暗色、键盘/触摸、手机和减少动态偏好可用。复杂动画有静态阅读退路或停止控制，不滚动劫持。桌面宽度不是手机宽度放大；检查正文实际宽度和字号，避免缩成嵌套小栏。
- 默认只读目标文章、已有设计/plan、本接口文档和实际用到的组件；遇到真实失败才扩大搜索。单 agent、一个实现，增量修改，不反复全站构建。

验证：`node --test scripts/article-design.test.mjs scripts/article-design-prune.test.mjs`、`pnpm check`。用 `pnpm article-design:check "文章路径" --route /文章地址/ --full-page` 输出报告，再人工查看截图和验证交互；详细选项、检查范围和限制见 [validation.md](validation.md)。正文重排、加密、MDX 或复杂动画按实际需求覆盖。

可临时 `pnpm exec astro dev --host 127.0.0.1` 验证后停止；用户自己 run dev。编译验证用 `pnpm exec astro build`，要生产预览再运行 `pnpm exec pagefind --site dist` 和 `node scripts/compress-fonts.js`。这些无内容同步/番剧更新/发布副作用。不要自动 deploy/push。

检查原文 git diff，除获准 create 外不应变正文。独立内容仓库管理 md/create，生成页面/清单/skill 属于代码仓库；部署时两者要对应更新。
