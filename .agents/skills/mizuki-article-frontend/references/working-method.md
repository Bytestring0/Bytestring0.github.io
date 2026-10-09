# 从文章到可用页面

目标是一次完成合适、可读、可继续修改的页面。不要把本文件变成庞大待办清单：读目标文章，确认一个方向，完成一次实现，集中验收和修复。没有新需求或真实失败时就停止扩展。

## 最短实施路径

1. **读原文和既有设计。** status 定位文件，完整读原文；注意引言、标题层级、宽表格、公式、代码和图片。只读正在用的接口，避免全站摸索。已有 plan 与本轮反馈优先。
2. **确认效果。** 几句话说明整体布局、正文宽度、目录如何跟随、主要交互、动效强度和 AI 增补。推荐一个方向；内容疑问在这里提出，不自动写回原文。不要为了创新增加文章用不到的面板或控件。
3. **建立绑定并实现。** 无设计才 init，已有设计直接改原文件。保留机器生成字段，只编辑 plan；模板只参考接口，不直接复制为成品。先接好 PageShell、导航、完整原文、目录、评论，再在同一实现中加入已确认效果。无需冗长设计文档，不重复搭建博客已有能力。
4. **集中验收修复。** 先 lint，再浏览器检查；看桌面、手机和正文中段，实际滚动、点击目录与主要交互。集中修掉实际问题，检查相关部分即可；不每改一个 CSS 值就全站 build。
5. **记录并交付。** plan 写实际实现、已做检查和尚存问题，不仍写初始化待办或夸大通过。原文变化已适配才 accept-source，不靠更新指纹消除报错。给用户预览地址/命令与简短说明，然后停止追加功能。

磁盘路径不是页面路由。`--route` 优先从首页文章链接或已有预览取得，必要时查 `getPostUrl`、permalink/alias，不能照抄分类目录大小写。STA 源路径是 `EDA/STA时序模型.md`，当前路由是 `/posts/eda/sta时序模型/`。

## 原文分组：引言不是第一章

`groupArticleBlocks(article, 2)` 返回 `SourceBlock[][]`；首个 h2 前有正文时会有额外的引言组。STA 六个 h2 对应七组，不能用自己手数的章节数和一个平行标签数组。用实际标题判断并编号，以下放在 ArticleContent 内：

```astro
---
const groups = groupArticleBlocks(article, 2);
let chapterNumber = 0;
const sections = groups.map(blocks => {
  const first = blocks[0];
  const heading = first?.headingId && /^h[12]$/.test(first.tag) ? first : null;
  return { blocks, heading, number: heading ? ++chapterNumber : null };
});
---
{sections.map(({ blocks, heading, number }) => (
  <section class:list={["chapter", { "article-intro": !heading }]}>
    {number !== null && <span aria-hidden="true">{String(number).padStart(2, "0")}</span>}
    <div>{blocks.map(block => <SourceBlock block={block} />)}</div>
  </section>
))}
```

目录用 PageTOC；自制导航从 `getArticleHeadings()` 取真实标签和锚点，不硬编码会随正文变化的 b12 等位置。允许重排，同一块仍只出现一次。

## 技术文章：利用原渲染结果

- SourceBlock 默认保留 prose；`prose={false}` 只关闭 prose 类，**不会清除 `.custom-md` 全局样式**。自行排版要核对计算样式，尤其全站表格单元格 `white-space: nowrap`，不能只读局部 CSS 就认定文字会换行。
- 保留已有 `.table-wrapper` 和 KaTeX 结构，它们提供局部横向滚动。宽表格可保留必要宽度并滚动，也可针对文字列覆盖 nowrap；不要缩小到难以阅读、裁掉列或手抄表格。外层 Grid/Flex 列要能收缩：`minmax(0, 1fr)` / `min-width: 0`。
- 等 KaTeX 样式加载后核对真实公式；如果显示两份或字体失常，检查 `.katex-mathml` 的隐藏样式及 CSS 请求，不删除 MathML 层。代码、图片和公式内容不做二次生成。
- 原文块内不要插入提示、按钮标签或数据副本，会改变 textContent。控件放在 `[data-source-block]` 外，从原表格提取简短按钮，点击调整行 class/状态。明确这是辅助导航，不声称“没有重复任何文本”。

## 宽度、目录和滚动条

用户偏好更开阔的正文。先给正文足够空间，目录和装饰退让；不再包窄卡片或叠加几层 padding。技术文章可以宽，具体数值按内容决定，不要求每篇同一版式。

目录优先 `position: sticky`，在正文范围跟随，到评论处停止。**sticky 内层的父侧栏要有正文高度**：Grid 为 `align-items: start` 时，侧栏通常需 `align-self: stretch`，否则父容器只有目录高，看似 sticky 却不跟随。祖先 overflow/transform 也须实测。长目录自己滚动，手机可折叠或回到文档流，避免 fixed 遮挡。

全站使用已有主题的原生纵向滚动条，不隐藏它，不给整篇正文另造纵向滚动视口。表格、公式、长目录的局部滚动也保留可见提示。若全站滚动条消失，检查 html/body 的 scrollbar-width、伪元素及旧库标记：停用 OverlayScrollbars 初始化后，不能仍留隐藏原生滚动条的 `data-overlayscrollbars-initialize`。

## 动效：先可读，再增强

原始 HTML 默认可见，JS 初始化成功后才添加揭示状态；初始化或切页失败不能留空白文章。长章节的 IntersectionObserver 用进入视口即可触发的条件（如 threshold: 0），避免巨型章节必须露出固定比例才显示。减少动态偏好、打印和脚本失败均保留阅读路径。

custom element 使用 connected/disconnected 生命周期，不只监听 DOMContentLoaded；清理 observer、事件和计时器，重连不重复插入控件。展开目录目标后调用 `notifyArticleContentReady()`，保留原锚点。

`--full-page` 截图**不会模拟读者滚动**，首屏外的揭示章节可能全透明。先实际滚动各章验证可见，再看正文截图；不能删除可见性警告或关闭动画伪装通过。减少动态截图可辅助核对全文，不能替代正常动效检查。

## STA 的诊断经验

这是故障定位示例，不要求其他文章照做仪器面板、轨道或选型矩阵。

| 观察到的现象 | 处理方法 |
| --- | --- |
| 旧报告样式未生效、波形变黑色填充 | 检查具体 CSS key。`__DESIGN_KEY__` 只能留在参考资产；当前源码已替换，别把旧报告当当前页面。先 lint 再开浏览器。 |
| sourceHash 为 32 个零 | 占位值不是有效指纹；保留 init 生成值，既有坏值在确认适配后用 accept-source 修复，不手写 hash。 |
| 六章对应七组，标签错位 | 引言独立处理，编号与标签由实际分组派生，不继续补硬编码数组。 |
| 旧报告 b72 客户端文字变化 | 比较控件插入前后 DOM，把辅助 UI 放源块外。当前复查未再出现此错误；不修改原文来迎合检查。 |
| 手机宽表格 | 检查局部容器 scrollWidth/clientWidth，并拖到末列。局部滚动合理；整页不溢出不等于内容没被裁掉。 |
| 大量块提示隐藏 | 滚动揭示先实滚各章；当前 STA 实滚可显示，不能认定丢文，也不能只凭结构检查认定可读。 |
| 普通页切入后目录为空 | 比较直开和 Swup 切入，检查模块加载、customElements 注册和最终目录。等明确就绪条件后检查；仍失败才修生命周期/桥接，不能只刷新页面交付。 |

失败时只追相关文件与区域，不顺手重写博客。确认原文没变、样式绑定正确、正文可读，就完成本轮交付。
