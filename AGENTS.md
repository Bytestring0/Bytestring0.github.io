# 项目约定

- 只创建任务需要的文件。自己产生的无关文件和中间产物及时删除，保留用户文件。
- 默认不自行渲染或测试；用户明确授权时，可以运行任务所需的预览与测试，本次记录页重做已获授权。
- `.agent/` 和 `.agents/` 保持在 `.gitignore` 中。
- 每次完成笔记创建和修改，如果笔记为publish公开的，最后一项文件操作必须是在 `src/content/AIDairy/YYYY-MM-DD.json` 追加简短日记；日期与时间按 Asia/Shanghai，同一天只用一个文件，保留已有条目。详细格式与语气遵循 [.agents/skills/ai-diary/SKILL.md](.agents/skills/ai-diary/SKILL.md)。其他情况不用管。
- Token 只记录实际可获得的计数，注明范围，拿不到时填 `null`，不得估算。日记写完后直接交付，不再创建或修改文件。
