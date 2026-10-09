# 文章设计验收工具

在项目根目录运行（Playwright 已列为项目开发依赖）：

```sh
pnpm article-design lint "src/content/posts/分类/文章.md"
pnpm article-design:check "src/content/posts/分类/文章.md" --route /文章地址/ --full-page
```

lint 不启动服务、不修改文件，检查遗留占位符、错误 CSS key、清单绑定、无效原文指纹及 inline CSS 的 :global 误用，错误退出码 1；它不能检查审美或编译错误。原文指纹失效须核对适配后 accept-source，不可伪造 hash。

截图工具保留原生滚动条（取消 Playwright 默认隐藏滚动条的参数）。Swup 切入后会等待目录与标题实际一致，最多 5 秒；超时仍按错误报告，避免只等固定毫秒数就误判。整页截图不模拟滚动，揭示动画仍需实际滚动验证。

命令不会构建、发布或清理设计。自动选空闲端口，启动 Astro dev，完成后关闭自身服务和浏览器；Windows 默认 Edge，其他系统默认 Chromium。只在工具启动的 dev 中关闭 Astro 开发工具栏，避免工具栏优化缓存影响读者页面验收；其余浏览器错误照常报告。用户正常运行 dev 的设置不变。

使用已有服务：

```sh
pnpm article-design:check "src/content/posts/分类/文章.md" --url http://127.0.0.1:4321/文章地址/ --out .astro/article-check/my-post
```

默认输出 `.astro/article-design-check/<key>/report.html`、`report.json`、390/768/1440 宽度的明暗截图及减少动态截图。HTML 报告可直接打开；点击缩略图看原图。`--full-page` 截取整页；不指定时截取首屏。可选 `--widths 390,1440`、`--height 900`、`--browser msedge|chrome|chromium`。缺浏览器时运行 `pnpm exec playwright install chromium` 并选择 Chromium。详细参数：`pnpm article-design:check --help`。

加密文章用 `--password-env 环境变量名`，从环境读取密码；密码不会写进报告。解锁后以 DOM 为客户端基线，服务端 ArticleContent 负责原文编译校验。加密文章的切页后再次解锁需手动验证。

自动检查：

- 页面返回成功、绑定到正确设计；唯一 main、导航、目录、评论、原文容器。
- 服务端原文完整性由现有 ArticleContent / CompletePage 校验；工具对照服务端 HTML 检查客户端原文块的数量、id、文字。允许段落顺序变化。
- 正文标题与目录的实际顺序、锚点有效性、重复 id、整页横向溢出。
- 明暗主题、减少动态偏好下的结构；普通页面切入、返回时的 Swup 布局切换。
- JS 异常、console.error、HTTP 4xx/5xx 和失败请求。错误退出码 1，成功 0；依赖缺失或路由错误不会伪装成通过。

边界：隐藏正文与 Mermaid 的运行时转换会列为人工检查项，避免禁止合法分屏/交互设计。工具不判断审美、文字对比度是否舒适，也不能证明自定义动画遵守减少动态偏好；减少动态截图和实际操作仍需检查。它不会发送评论、自动点击购买/提交等操作。必须查看桌面与手机截图，并测试目录点击、菜单/搜索、评论挂载、自定义交互和键盘可达性。报告通过只代表这些自动规则通过。

清理预览：`pnpm article-design prune`。手动应用：`pnpm article-design prune --apply`。所有 Astro build（含 `pnpm exec astro build`）都会在组件编译前应用清理，只删除有合法绑定且 Markdown 已不存在的设计对；无清单或异常绑定会保留并提示，文章根目录不可用会停止构建。
