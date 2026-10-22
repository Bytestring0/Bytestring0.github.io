# Pi Agent 本地增强

直接增强现有 `pi-agent` 插件，保留原作者的聊天、模型、历史、队列和附件 UI。没有新增独立聊天面板，不追加学科或角色提示词。

- Pi 原生 select / confirm / input / editor 请求显示为独立弹窗；多条提问依次显示，关闭弹窗回传取消。
- `question` 工具支持带说明的单选、多选、自定义回答和取消，等待真实用户提交。
- 普通消息不自动引用当前笔记、选区、标注或关联笔记。主动输入的 `@` 引用、`/current` 等上下文命令及显式标注操作保留。
- 在笔记中选中文字后，点击输入栏的引用图标，或右键选择「引用所选文字到 Pi」。命令面板也有同名命令，没有新增快捷键。只加入选中片段；标签显示来源和行号，点击可预览，× 可移除。引用使用原生文本附件通道，普通发送、排队和 steer-now 使用同一份明确选取的文本快照。
- `obsidian_drawio` 通过已安装的离线 Draw.io 编辑器创建可编辑 `.drawio.svg`，读取时解压源 XML；支持修改和打开原生编辑器。
- `obsidian_excalidraw` 调用已安装 Excalidraw 2.29.0 的官方 `ea.executeCLI(request)`，与原生 CLI 使用同一个 dispatcher。支持查询 schema/API、读取、创建、编辑、分组、连接、插图、公式、SVG/PNG 导出和显式可信脚本。公式等可选能力仍受官方依赖要求限制。
- Excalidraw 工具传入 `{request:{command:"help"}}` 查询能力，或 `{request:{command:"schema",action:"apply"}}` 查询参数。指定准确的仓库相对路径；编辑顺序为 `open` → `read source:"live" detail:"elements"` → `apply expectedRevision:读取到的data.revision`。写操作需要唯一 `requestId`。原样保留 `ok`、`mutation`、`persistence` 和错误恢复指引，不能把未保存的编辑当成成功；使用 `result` 可以查询回执。
- Draw.io 修改要求读取时的 `expectedMtime`，省略读取/修改操作路径时使用当前打开的对应图纸。Excalidraw 使用官方场景版本检查，不自动猜测当前图纸；选区读取使用明确路径和 `selectedOnly:true`。
- Chat / Review 不允许绘图写入。Edit / Full agent 可以使用绘图工具。工具使用仓库相对路径，包含 Folder Bridge 已挂载的可见路径；不允许越界路径或隐藏配置。
- 原插件的 Windows RPC 启动绕过 `.cmd` 引号转换，直接运行同一 Pi 的 Node CLI；扩展命令已处理且未启动生成时不会无限等候 `agent_settled`。

使用方式：正常打开原来的 **Pi Agent**。例如“先用 question 工具让我选择方案，等我确认后再做”，或“用 Draw.io 画一个三步流程，保存可编辑源图”，或打开 Excalidraw 选中元素后要求修改它们。工具注册不代表模型每次都会调用；需要结构化选项时可明确要求 `question`。

交互验证使用本地提问弹窗，不发送模型请求。绘图验证使用临时图纸，完成后删除。桥接服务仅绑定 `127.0.0.1` 的随机端口，要求每次插件启动生成的凭据；凭据只传给所属 Pi 子进程，不保存到设置或笔记。停止或退出时取消待回答请求并关闭服务。

构建与验证：

```powershell
node scripts/obsidian/pi-agent-enhancements/build.mjs
node --test scripts/obsidian/pi-agent-enhancements/bridge.test.mjs
```

第三方插件升级可能覆盖本地增强；更新后运行构建脚本重新应用。插件目录的 `main.upstream.js` 保留增强前的实际版本，用于回退。开发时不修改认证文件或模型配置。
