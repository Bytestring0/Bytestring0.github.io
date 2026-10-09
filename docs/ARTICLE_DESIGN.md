# 文章专属前端

文章 frontmatter 加入：

```yaml
create: true
```

缺失或 false 使用原版页面。true 启用已保存的专属设计；没有设计时正常回退，dev、build、访问都不会调用 AI。

写完文章后，让 agent 使用 `$mizuki-article-frontend`，并给出 md/mdx 路径。它先完整读文、与你确认风格、排版顺序、动画、交互和是否需要 AI 导读，然后创建页面。页面可全面重新设计，甚至重排段落、实现复杂动画；原文字句、代码、公式、链接和媒体仍来自原 Markdown，不手抄改写。

你自己 `pnpm dev` 看效果，不满意就继续让 agent 修改**同一份设计**。满意后自己 `pnpm build` 或 `pnpm deploy`；agent 不自动发布。改回 `create: false` 即恢复原版，保留设计文件以便下次启用。

Skill 在 [`.agents/skills/mizuki-article-frontend/SKILL.md`](../.agents/skills/mizuki-article-frontend/SKILL.md)。editorial、lab、story 的 Astro 模板只参考接口与结构，不能直接复用布局交付；按文章设计。具体操作与 STA 复盘见 [working-method.md](../.agents/skills/mizuki-article-frontend/references/working-method.md)。

```sh
pnpm article-design status "src/content/posts/分类/文章.md"
# 与用户确认风格后初始化；不会覆盖已存在的设计
pnpm article-design init "src/content/posts/分类/文章.md" lab
```

生成目录为 `src/components/article-designs/generated/`，每篇一个 `.astro` 和一个同名 `.json`（路径绑定、原文指纹、确认方案）。普通链接、alias、固定链接使用同一个设计。内容变化会读取最新原文并提示适配，不重新生成；适配后用 `accept-source` 记录最新指纹。移动或改名文章需迁移路径绑定，见 skill 的实现说明。

**删除 Markdown 后，下次构建会自动删除对应的设计源文件和清单。** `create: false`、草稿和内容更新会保留设计。改名/移动文章时先迁移绑定，再构建。可以用 `pnpm article-design prune` 预览待清理项，或 `pnpm article-design prune --apply` 手动清理；普通 dev/check 不执行清理。

设计接管整个页面，不再套原来的网格、正文卡片或宽度限制。Agent 在 `.astro` 中使用 `PageShell`，自行编排导航、目录、正文、评论、前后篇和页脚；组件接口和主题、目录事件见 [实现说明](../.agents/skills/mizuki-article-frontend/references/implementation.md)。可保留默认组件，也可通过插槽重做导航等 UI。目录跟随实际正文顺序，兼容加密文章解锁；普通页面与专属页面切换时替换完整 body，避免旧布局残留。额外导读/补充明确标注为 AI 内容。每次 dev/build 校验原文块完整性与受保护元素，页面可读性、动画和布局仍需浏览器检查。

先用 `pnpm article-design lint "src/content/posts/分类/文章.md"` 检查占位符、样式 key 和清单指纹；再用 `pnpm article-design:check "src/content/posts/分类/文章.md" --route /文章地址/ --full-page` 验收页面。它自动启动并关闭本地 dev，生成明暗主题、桌面/平板/手机截图和 HTML/JSON 报告，检查原文块、组件接口、目录、溢出、浏览器错误及页面切换。查看截图后还要测试页面特有的交互。更多选项见 [验收工具说明](../.agents/skills/mizuki-article-frontend/references/validation.md)。

验证命令：`node --test scripts/article-design.test.mjs scripts/article-design-prune.test.mjs`、`pnpm check`。需要纯构建验证时用 `pnpm exec astro build`（不运行内容同步、番剧更新等钩子，但会按上述规则清理已删除文章的设计）。

使用内容分离时，文章和 create 属于内容仓库，生成组件、清单和 skill 属于代码仓库，部署时确保两者一起更新。
