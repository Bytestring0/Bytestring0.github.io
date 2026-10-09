import { FuzzySuggestModal, Notice } from 'obsidian';

export const PI_LOCAL_COMMANDS = [
  ['model', '选择模型；/model provider/model-id；/model default'],
  ['models', '列出本机可用模型；/models refresh 刷新'],
  ['thinking', '选择思考强度；/thinking high；/thinking auto'],
  ['new', '开始新对话，保留旧对话'],
  ['clear', '重置上下文，旧对话仍在历史记录中'],
  ['resume', '打开对话历史，继续旧对话'],
  ['fork', '复制当前会话，保留上下文并开始分支'],
  ['name', '重命名当前对话；/name 模拟电路复习'],
  ['status', '查看当前模型、思考强度与工具权限'],
  ['abort', '停止当前回复或工具执行'],
  ['help', '显示 Pi 常用命令与使用指南'],
  ['settings', '打开 Pi Agent 设置'],
].map(([name, detail]) => ({command:`/${name}`, label:detail, detail, insertText:`/${name} `, implemented:true, source:'obsidian'}));
const aliases = {think:'thinking', stop:'abort', session:'status'};
export function parseLocalCommand(prompt) {
  const match = String(prompt ?? '').trim().match(/^\/([a-z]+)(?:\s+([\s\S]*))?$/i);
  if (!match) return;
  const name = aliases[match[1].toLowerCase()] ?? match[1].toLowerCase();
  return PI_LOCAL_COMMANDS.some(item => item.command === `/${name}`) ? {name, argument:match[2]?.trim() ?? ''} : undefined;
}
export function resolveModel(models, query) {
  const exact = models.find(model => model.slug === query);
  if (exact) return exact;
  const matches = models.filter(model => model.id === query);
  if (matches.length === 1) return matches[0];
  throw new Error(matches.length ? '这个模型有多个提供方，请使用完整 provider/model-id，或输入 /model 选择。' : '未找到模型。输入 /models 查看，或 /models refresh 刷新本机模型配置。');
}
class CommandPicker extends FuzzySuggestModal {
  constructor(app, items, choose, placeholder) {super(app);this.items=items;this.choose=choose;this.setPlaceholder(placeholder);}
  getItems(){return this.items;}
  getItemText(item){return item.label;}
  onChooseItem(item){Promise.resolve(this.choose(item)).catch(error => new Notice(String(error)));}
}

// Keep the upstream plugin intact. Reversible hooks also cover newly opened Pi
// panes; layout events reattach them after either plugin is reloaded.
export class PiCommandBridge {
  constructor(owner){this.owner=owner;this.hooks=[];this.pending=new WeakSet();}
  install(){
    const plugin=this.owner.app.plugins.plugins['pi-agent'];
    if (!plugin || plugin === this.plugin) {if(plugin)this.patchViews(plugin);return;}
    this.dispose();this.plugin=plugin;
    const original=plugin.getPiCommands;
    const wrapped=function(){const upstream=original.call(this) ?? [];const names=new Set(PI_LOCAL_COMMANDS.map(item=>item.command));return [...PI_LOCAL_COMMANDS,...upstream.filter(item=>!names.has(item.command))];};
    plugin.getPiCommands=wrapped;
    this.hooks.push(()=>{if(plugin.getPiCommands===wrapped)plugin.getPiCommands=original;});
    this.patchViews(plugin);
  }
  patchViews(plugin){
    for(const leaf of this.owner.app.workspace.getLeavesOfType('pi-agent-view')){
      const proto=Object.getPrototypeOf(leaf.view);
      if(this.prototypes?.has(proto))continue;
      this.prototypes ??= new Set();this.prototypes.add(proto);
      const original=proto.runPrompt;const bridge=this;
      if(typeof original!=='function'){new Notice('Pi 插件接口已变更，请更新博客工作台');continue;}
      const wrapped=async function(prompt,...args){
        const command=parseLocalCommand(prompt);
        if(!command || this.plugin!==plugin)return original.call(this,prompt,...args);
        try{return await bridge.execute(this,command);}catch(error){bridge.reply(this,`命令执行失败：${error.message ?? error}`);}
      };
      proto.runPrompt=wrapped;
      this.hooks.push(()=>{if(proto.runPrompt===wrapped)proto.runPrompt=original;});
    }
  }
  reply(view, content){
    view.plugin.addMessageToThread(view.plugin.getCurrentThread().id,{role:'assistant',content,createdAt:Date.now()});
    view.renderMessages();view.renderThreadTitle();
  }
  async execute(view,{name,argument}){
    const plugin=view.plugin;
    // Abort must remain available during another local command or agent run.
    if(name==='abort'){view.cancelCurrentRun();new Notice('已请求停止当前 Pi 回复');return;}
    if(this.pending.has(plugin))throw new Error('请等待上一条控制命令完成。');
    if(plugin.hasActivePiRuns() && !['help','status'].includes(name))throw new Error('Pi 正在执行任务，请先 /abort 停止，再切换模型或会话。');
    this.pending.add(plugin);
    try {
      if(name==='help')return this.reply(view,'**Pi 命令**\n\n'+PI_LOCAL_COMMANDS.map(item=>`- \`${item.command}\`：${item.detail}`).join('\n')+'\n\n原有命令：`/current`、`/links`、`/backlinks`、`/search 关键词`、`/compact`、`/context show`。\n\n完整说明：[[Obsidian与Pi使用手册]]。控制命令在本机执行，不调用模型；`/compact` 会调用模型。');
      if(name==='status')return this.reply(view,`**当前 Pi 设置**\n\n- 模型：\`${plugin.settings.model==='__custom' ? plugin.settings.customModel : plugin.settings.model || plugin.settings.effectiveModel || 'Pi 默认'}\`\n- 思考强度：${plugin.settings.reasoningEffort || '自动（Pi / 模型默认）'}\n- 工具模式：\`${plugin.settings.sandboxMode}\`\n- 对话：${plugin.getCurrentThread().title}\n- 执行状态：${plugin.hasActivePiRuns() ? '运行中' : '空闲'}\n\n模型及思考强度设置用于下一次请求。`);
      if(name==='settings'){this.owner.app.setting.open();this.owner.app.setting.openTabById('pi-agent');return;}
      if(name==='resume'){view.showThreadList();return;}
      if(name==='new' || name==='clear'){plugin.startNewThread(argument || undefined);view.resetTransientRunUiState();view.renderChatView();new Notice('已新建对话；旧对话保留在历史记录中');return;}
      if(name==='fork'){const fork=await plugin.forkCurrentThread();if(!fork)throw new Error('当前会话还没有可复制的内容。');view.resetTransientRunUiState();view.renderChatView();new Notice('已复制会话并保留上下文');return;}
      if(name==='name'){if(!argument)throw new Error('用法：/name 对话标题');plugin.renameThread(plugin.getCurrentThread().id,argument);view.renderThreadTitle();return;}
      if(name==='models' || name==='model'){
        if(argument==='refresh' && name==='models' || !plugin.settings.availableModels.length){const result=await plugin.refreshModelCatalog(false,true);if(result?.ok===false)throw new Error('无法读取本机模型目录，请检查 Pi CLI 路径与配置。');}
        const models=plugin.settings.availableModels;
        if(name==='models')return this.reply(view,'**本机可用模型**\n\n'+models.map(model=>`- \`${model.slug}\` — ${model.displayName || model.id}`).join('\n')+'\n\n输入 `/model` 选择，或 `/model provider/model-id` 切换。');
        const choose=async item=>{
          if(plugin.hasActivePiRuns())throw new Error('请先停止正在运行的 Pi 任务。');
          plugin.settings.model=item.slug;plugin.settings.reasoningEffort='';
          await plugin.saveSettings();plugin.refreshOpenModelControls();
          this.reply(view,`模型已设为 \`${item.slug || 'Pi 默认'}\`，下一次请求使用此模型。思考强度已恢复自动。`);
        };
        if(argument)return choose(argument==='default' ? {slug:''} : resolveModel(models,argument));
        new CommandPicker(this.owner.app,[{slug:'',label:'Pi 默认模型'},...models.map(model=>({...model,label:`${model.displayName || model.id} · ${model.slug}`}))],choose,'选择 Pi 模型（输入名称或提供方）').open();return;
      }
      if(name==='thinking'){
        await plugin.ensureModelCatalogLoaded();
        const levels=plugin.getSelectedModelInfo()?.supportedReasoningLevels ?? [];
        const choose=async item=>{
          if(plugin.hasActivePiRuns())throw new Error('请先停止正在运行的 Pi 任务。');
          if(item.value && !levels.includes(item.value))throw new Error(`当前模型支持：${levels.join(', ') || '仅自动'}。`);
          plugin.settings.reasoningEffort=item.value;await plugin.saveSettings();plugin.refreshOpenModelControls();
          this.reply(view,`思考强度已设为 ${item.value || '自动'}，下一次请求生效。`);
        };
        if(argument)return choose({value:argument==='auto' || argument==='default' ? '' : argument});
        new CommandPicker(this.owner.app,[{value:'',label:'自动（Pi / 模型默认）'},...levels.map(value=>({value,label:value}))],choose,'选择当前模型支持的思考强度').open();
      }
    } finally {this.pending.delete(plugin);}
  }
  dispose(){for(const restore of this.hooks.splice(0).reverse())restore();this.prototypes?.clear();this.plugin=undefined;}
}
