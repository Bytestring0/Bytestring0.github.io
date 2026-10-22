import { Plugin, Modal, Notice, Setting, MarkdownRenderChild } from 'obsidian';
import { spawn, execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { PiCommandBridge } from './pi-commands.js';
import { PdfExportControls } from './pdf-export.js';
const defaults={nodeBinary:'C:\\Program Files\\nodejs\\node.exe',pnpmCli:'C:\\Users\\Au224\\AppData\\Roaming\\npm\\node_modules\\pnpm\\bin\\pnpm.cjs',port:4321};
class NewPostModal extends Modal {
  constructor(plugin,kind='note'){super(plugin.app);this.plugin=plugin;this.kind=kind;this.name='';this.folder='';}
  onOpen(){
    this.contentEl.createEl('h2',{text:'新建笔记 / 博客文章'});
    new Setting(this.contentEl).setName('标题').addText(input=>input.setPlaceholder('例如 MOS 管的跨导').onChange(value=>this.name=value));
    new Setting(this.contentEl).setName('分类文件夹').addDropdown(drop=>{drop.addOption('','posts 根目录');const folders=this.app.vault.getAllLoadedFiles().filter(file=>file.children && file.path && this.plugin.isBlogPath(file.path) && !/^(附件|绘图)(\/|$)/.test(file.path)).sort((a,b)=>a.path.localeCompare(b.path,'zh-CN'));for(const folder of folders)drop.addOption(folder.path,folder.path);drop.onChange(value=>this.folder=value);});
    new Setting(this.contentEl).setName('笔记类型').addDropdown(drop=>drop.addOptions({note:'普通笔记',course:'课程笔记',experiment:'实验记录',essay:'随笔 / 博客文章'}).setValue(this.kind).onChange(value=>this.kind=value));
    new Setting(this.contentEl).setDesc('新笔记默认不公开。完成后点击“切换公开”，再手动部署。').addButton(button=>button.setButtonText('创建').setCta().onClick(async()=>{
      if(!this.name.trim())return new Notice('请输入标题');
      const name=this.folder ? `${this.folder}/${this.name}` : this.name;
      const code=await this.plugin.run('new-post',[name,`--kind=${this.kind}`]);
      if(code === 0){this.close();setTimeout(()=>{const created=this.app.vault.getAbstractFileByPath(/\.(md|mdx)$/i.test(name)?name:name+'.md');if(created)this.app.workspace.getLeaf(false).openFile(created);},600);}
    }));this.contentEl.querySelector('input')?.focus();
  }
}
class LogsModal extends Modal {
  constructor(plugin){super(plugin.app);this.plugin=plugin;}
  onOpen(){this.contentEl.createEl('h2',{text:'博客命令输出'});this.pre=this.contentEl.createEl('pre',{text:this.plugin.logs.join(''),cls:'mizuki-command-log'});this.plugin.logViews.add(this.pre);}
  onClose(){this.plugin.logViews.delete(this.pre);}
}
export default class MizukiWorkbench extends Plugin {
  async onload(){
    this.settings={...defaults,...await this.loadData()};this.repo=path.resolve(this.app.vault.adapter.getBasePath(),'../../..');
    if(!fs.existsSync(path.join(this.repo,'astro.config.mjs')))throw new Error('Mizuki 工作台需要打开博客的 src/content/posts 目录');
    this.applyBackground();
    this.pdfExport=new PdfExportControls(this);this.pdfExport.install();
    this.logs=[];this.logViews=new Set();this.jobs=new Map();this.previewUrl=`http://127.0.0.1:${this.settings.port}/`;this.status=this.addStatusBarItem();this.updateStatus();this.addRibbonIcon('house','博客工作台',()=>this.home());
    this.addRibbonIcon('file-plus','新建笔记 / 文章',()=>new NewPostModal(this).open());
    this.addRibbonIcon('send','切换当前笔记是否公开',()=>this.togglePublish());
    const commands=[['home','打开博客工作台',()=>this.home()],['new-post','新建笔记 / 文章',()=>new NewPostModal(this).open()],['dev','启动博客预览',()=>this.run('dev',['--host','127.0.0.1','--port',String(this.settings.port)])],['stop-dev','停止博客预览',()=>this.stopDev()],['open-preview','打开本地预览',()=>window.open(this.previewUrl)],['build','构建博客',()=>this.run('build')],['deploy','部署博客（构建、提交并推送）',()=>this.run('deploy')],['check','检查博客',()=>this.run('check')],['toggle-publish','切换当前笔记是否公开',()=>this.togglePublish()],['logs','查看命令输出',()=>new LogsModal(this).open()],['pi','打开 Pi 助手',()=>this.openPi()]];
    for(const [id,name,callback] of commands)this.addCommand({id,name,callback});
    this.registerMarkdownCodeBlockProcessor('mizuki-workbench',(_,element,context)=>{
      const container=element.createDiv({cls:'mizuki-workbench'});container.createEl('p',{text:'笔记与博客，共用一份 Markdown',cls:'mizuki-workbench-caption'});const grid=container.createDiv({cls:'mizuki-workbench-buttons'});
      const labels={'new-post':'＋ 新建笔记 / 文章',dev:'▶ 启动预览','open-preview':'↗ 打开预览','stop-dev':'■ 停止预览',build:'构建博客',deploy:'发布博客',check:'检查博客','toggle-publish':'切换当前笔记公开',pi:'Pi 助手',logs:'命令输出'};
      for(const [id,,callback] of commands.filter(([id])=>id !== 'home')){const button=grid.createEl('button',{text:labels[id]});if(id==='deploy')button.addClass('mizuki-deploy');button.addEventListener('click',callback);}
      const output=container.createEl('pre',{cls:'mizuki-command-log',text:this.logs.join('') || '就绪。命令在 D:\\AstroBlog\\mizuki 执行。'});this.logViews.add(output);const child=new MarkdownRenderChild(container);child.onunload=()=>this.logViews.delete(output);context.addChild(child);
    });
    this.registerMarkdownCodeBlockProcessor('markmap',async(source,element,context)=>{
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('width',String(element.clientWidth||800));svg.setAttribute('height','380');svg.style.maxWidth='100%';element.appendChild(svg);
      const {root}=new Transformer().transform(source);const map=Markmap.create(svg,{autoFit:false,duration:0});let alive=true;
      const resize=new ResizeObserver(()=>{if(!alive||!element.isConnected||!element.clientWidth)return;svg.setAttribute('width',String(element.clientWidth));map.fit();});
      const child=new MarkdownRenderChild(element);child.onunload=()=>{alive=false;resize.disconnect();map.destroy();};context.addChild(child);
      try{await map.setData(root);if(!alive||!element.isConnected)return;await map.fit();resize.observe(element);}catch(error){if(alive)this.append(`思维导图渲染失败：${String(error)}\n`);}
    });
    this.registerEvent(this.app.vault.on('create',file=>{if(!this.isBlogPath(file.path) || file.extension !== 'md' || /\.excalidraw\.md$/i.test(file.path)||file.path.startsWith('模板/'))return;setTimeout(async()=>{try{if(!this.isBlogPath(file.path) || !this.app.vault.getAbstractFileByPath(file.path))return;const content=await this.app.vault.read(file);if(/^---\r?\n/.test(content))return;await this.app.fileManager.processFrontMatter(file,data=>{data.title=file.basename;data.published=this.today();data.publish=false;data.draft=false;data.tags=[];data.category=file.parent?.path==='/' ? '' : (file.parent?.path.split('/')[0] || '');});}catch(error){this.append(`初始化笔记属性失败：${String(error)}\n`);}},450);}));
    this.piCommands=new PiCommandBridge(this);this.piCommands.install();
    this.registerEvent(this.app.workspace.on('layout-change',()=>this.piCommands.install()));
    this.app.workspace.onLayoutReady(()=>{this.piCommands.install();});
  }
  isBlogPath(filePath){return !this.app.plugins.getPlugin('folderbridge')?.pathMapper?.getMountForPath(filePath);}
  today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
  applyBackground(){
    // Obsidian's app:// resource host changes between launches. Resolve it in
    // the running vault instead of persisting a stale URL in the CSS snippet.
    const property='--mizuki-background-image';
    const style=document.body.style;
    const previous=style.getPropertyValue(property);
    const image=`url(${JSON.stringify(this.app.vault.adapter.getResourcePath('.obsidian/snippets/maomaolove.png'))})`;
    style.setProperty(property,image);
    this.register(()=>{if(style.getPropertyValue(property)===image){if(previous)style.setProperty(property,previous);else style.removeProperty(property);}});
  }
  async home(){const file=this.app.vault.getAbstractFileByPath('00-博客工作台.md');if(file){const leaf=this.app.workspace.getLeaf(false);await leaf.openFile(file);await leaf.setViewState({type:'markdown',state:{file:file.path,mode:'preview'}});}}
  append(message){message=message.replace(/\x1b\[[0-9;]*m/g,'');this.logs.push(message);if(this.logs.join('').length>40000)this.logs=this.logs.slice(-100);for(const view of this.logViews){view.setText(this.logs.join(''));view.scrollTop=view.scrollHeight;}}
  updateStatus(){this.status.setText(this.jobs.size ? '博客：'+[...this.jobs.keys()].join(' / ') : '博客工作台 · 就绪');}
  run(task,args=[]){
    if(!['new-post','dev','build','deploy','check'].includes(task))return Promise.reject(new Error('不支持的博客命令'));
    if(this.jobs.has(task)){new Notice(`${task} 已在运行`);return Promise.resolve(1);}
    if(['build','deploy','check'].includes(task) && [...this.jobs.keys()].some(id=>['build','deploy','check'].includes(id))){new Notice('请等待当前构建或检查完成');return Promise.resolve(1);}
    if(['build','deploy'].includes(task) && this.jobs.has('dev')){new Notice('请先停止预览，再构建或部署');return Promise.resolve(1);}
    this.append(`\n> pnpm run ${task} ${args.join(' ')}\n`);
    const child=spawn(this.settings.nodeBinary,[this.settings.pnpmCli,'run',task,...args],{cwd:this.repo,windowsHide:true,shell:false,env:{...process.env,FORCE_COLOR:'0'}});this.jobs.set(task,child);this.updateStatus();new Notice(`开始执行 ${task}`);
    return new Promise(resolve=>{let finished=false;const finish=code=>{if(finished)return;finished=true;this.jobs.delete(task);this.updateStatus();this.append(`\n${task} ${code===0?'完成':'结束，退出码 '+code}\n`);if(task!=='dev')new Notice(`${task} ${code===0?'完成':'失败，请查看命令输出'}`);resolve(code);};child.stdout.on('data',data=>{this.append(data.toString());if(task==='dev'){const url=this.logs.join('').match(/Local\s+(http:\/\/127\.0\.0\.1:\d+\/)/);if(url)this.previewUrl=url[1];}});child.stderr.on('data',data=>this.append(data.toString()));child.on('error',error=>{this.append(String(error));finish(1);});child.on('close',finish);});
  }
  stopDev(){const child=this.jobs.get('dev');if(!child?.pid)return new Notice('没有由工作台启动的预览');if(process.platform==='win32')execFile('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},error=>{if(error)this.append(String(error));});else child.kill();}
  async togglePublish(){const file=this.app.workspace.getActiveFile();if(!file || file.extension!=='md')return new Notice('请先打开 Markdown 笔记');if(!this.isBlogPath(file.path))return new Notice('外部笔记不在博客 posts 中，不参与博客发布');if(['00-博客工作台.md','使用指南.md'].includes(file.path))return new Notice('工作台和指南保持不公开');let published;await this.app.fileManager.processFrontMatter(file,data=>{published=data.publish===false;data.publish=published;data.title ||= file.basename;data.published ||= this.today();data.draft=false;});new Notice(published?'已设为公开，下一次部署发布':'已设为不公开，下一次部署移除');}
  openPi(){const command=Object.keys(this.app.commands.commands).find(id=>id.startsWith('pi-agent:') && /open|chat/i.test(id));if(command)this.app.commands.executeCommandById(command);else new Notice('请在命令面板搜索 Pi Agent');}
  onunload(){this.piCommands?.dispose();if(this.jobs?.has('dev'))this.stopDev();}
}
