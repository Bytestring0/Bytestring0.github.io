import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { scanVault,resolveFile,postUrl,isPublishable,markdownParser,wikiTargets,walkTree } from './vault.mjs';
import { createPost } from '../new-post.js';
import { remarkObsidian } from '../../src/plugins/remark-obsidian.mjs';
import { validatePublishedEmbeds } from './validate.mjs';
test('new-post stays in posts, quotes YAML and defaults to unpublished',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'mizuki-notes-'));
  try {
    const post=createPost('模拟电路/MOS 管',{root});
    assert.equal(post.file,'模拟电路/MOS 管.md');
    const index=scanVault(path.join(root,'src/content/posts'));
    assert.equal(index.notes[0].data.title,'MOS 管');
    assert.equal(index.notes[0].public,false);
    for(const name of ['../escape','D:/outside','.obsidian/key','CON','a: b'])assert.throws(()=>createPost(name,{root}));
    assert.throws(()=>createPost('模拟电路/MOS 管',{root}));
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
test('public filtering preserves legacy articles and excludes drafts and drawings',()=>{
  const legacy={title:'MOS',published:new Date()};
  assert.equal(isPublishable(legacy),true);
  assert.equal(isPublishable({...legacy,publish:false}),false);
  assert.equal(isPublishable({...legacy,draft:true}),false);
  assert.equal(isPublishable({...legacy,'excalidraw-plugin':'parsed'}),false);
  assert.equal(isPublishable({}),false);
});
test('link resolution: relative paths, aliases, ambiguity and permalink',()=>{
  const a={file:'课程/MOS.md',id:'课程/mos',data:{title:'MOS',aliases:['场效应管'],permalink:'device-mos'}};
  const b={file:'实验/MOS.md',id:'实验/mos',data:{title:'MOS 实验'}};
  const index={files:[a.file,b.file],notes:[a,b]};
  assert.equal(resolveFile(index,'MOS','课程/导论.md'),a);
  assert.equal(resolveFile(index,'场效应管','导论.md'),a);
  assert.throws(()=>resolveFile(index,'MOS','导论.md'),/多个匹配/);
  assert.equal(postUrl(a),'/device-mos/');
  assert.equal(postUrl({...a,data:{alias:'mos-alias'}}),'/posts/mos-alias/');
});
test('wiki extraction ignores code and captures normal references',()=>{
  const refs=wikiTargets({body:'[[MOS|跨导]]\n\n`[[不应处理]]`\n\n```text\n[[也不处理]]\n```\n\n![[MOS#推导]]'});
  assert.equal(refs.length,2);assert.equal(refs[0].target,'MOS');assert.equal(refs[1].embed,true);
});
test('publication preflight rejects private transclusion and embed cycles',()=>{
  const a={file:'公开.md',public:true,body:'![[私密]]',data:{}};
  const b={file:'私密.md',public:false,body:'',data:{}};
  const index={files:[a.file,b.file],notes:[a,b]};
  assert.throws(()=>validatePublishedEmbeds(index),/不能嵌入未公开/);
  b.public=true;b.body='![[公开]]';
  assert.throws(()=>validatePublishedEmbeds(index),/循环/);
  b.body='';assert.doesNotThrow(()=>validatePublishedEmbeds(index));
});
test('integration renders links, folded callouts and markmap without touching code',()=>{
  const index=scanVault();const note=index.notes.find(n=>n.public && n.file.endsWith('关于Latex.md'));
  const body=`[[${note.file}|公式参考]]\n\n> [!tip]- 微电子提示\n> 保持单位一致。\n\n\`[[不处理]]\`\n\n\`\`\`markmap\n# 微电子\n## 模拟电路\n## 数字电路\n\`\`\``;
  const tree=markdownParser.parse(body);const file={path:path.join(index.base,note.file),message:()=>{}};
  remarkObsidian()(tree,file);
  let linked=false,folded=false,map=false,code=false;
  walkTree(tree,node=>{if(node.type==='link' && node.children[0]?.value==='公式参考')linked=true;if(node.data?.hName==='details')folded=true;if(node.type==='obsidianMarkmap')map=true;if(node.type==='inlineCode' && node.value==='[[不处理]]')code=true;});
  assert.ok(linked && folded && map && code);
});
test('workbench passes literal arguments and serializes build/deployment without running them',async()=>{
  const calls=[];
  const sandbox={Plugin:class{},Modal:class{},Notice:class{},queueMicrotask,process:{env:{}},
    spawn:(command,args,options)=>{calls.push({command,args,options});return {stdout:{on(){}},stderr:{on(){}},on(event,fn){if(event==='close')queueMicrotask(()=>fn(0));}};}};
  const source=fs.readFileSync(path.join(import.meta.dirname,'workbench.js'),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export default class','class');
  vm.runInNewContext(source+'\nglobalThis.Workbench=MizukiWorkbench;',sandbox);
  const plugin=new sandbox.Workbench();
  Object.assign(plugin,{settings:{nodeBinary:'node.exe',pnpmCli:'pnpm.cjs'},repo:'D:/AstroBlog/mizuki',jobs:new Map(),logs:[],logViews:new Set(),status:{setText(){}}});
  assert.equal(await plugin.run('deploy'),0);
  assert.deepEqual(Array.from(calls[0].args),['pnpm.cjs','run','deploy']);
  assert.equal(calls[0].options.shell,false);assert.equal(calls[0].options.windowsHide,true);
  await plugin.run('new-post',['含空格的标题 $(literal)']);
  assert.equal(calls[1].args.at(-1),'含空格的标题 $(literal)');
  plugin.jobs.set('dev',{pid:123});
  assert.equal(await plugin.run('deploy'),1);assert.equal(calls.length,2);
  await assert.rejects(plugin.run('unsupported'));
});
test('Pi controls switch saved models, reject ambiguity, stop active runs and restore upstream hooks',async()=>{
  const sandbox={FuzzySuggestModal:class{},Notice:class{}};
  const source=fs.readFileSync(path.join(import.meta.dirname,'pi-commands.js'),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
  vm.runInNewContext(source+'\nglobalThis.Bridge=PiCommandBridge;globalThis.resolveModel=resolveModel;',sandbox);
  let forwarded=0,stopped=0,saved=0,active=false;
  const models=[{slug:'a/same',id:'same'},{slug:'b/same',id:'same'},{slug:'a/unique',id:'unique'}];
  const messages=[];
  const plugin={settings:{model:'a/same',reasoningEffort:'high',availableModels:models,sandboxMode:'edit'},
    getPiCommands(){return [{command:'/skill:study'}];},getCurrentThread(){return {id:'t',title:'学习'};},
    hasActivePiRuns(){return active;},addMessageToThread(id,message){messages.push(message.content);},
    async saveSettings(){saved++;},refreshOpenModelControls(){}};
  class View{constructor(){this.plugin=plugin;}async runPrompt(){forwarded++;}renderMessages(){}renderThreadTitle(){}cancelCurrentRun(){stopped++;}}
  const view=new View();const original=View.prototype.runPrompt;const catalog=plugin.getPiCommands;
  const owner={app:{plugins:{plugins:{'pi-agent':plugin}},workspace:{getLeavesOfType(){return [{view}];}}}};
  const bridge=new sandbox.Bridge(owner);bridge.install();bridge.install();
  assert.ok(plugin.getPiCommands().some(command=>command.command==='/model'));
  await view.runPrompt('/model unique');assert.equal(plugin.settings.model,'a/unique');assert.equal(plugin.settings.reasoningEffort,'');assert.equal(saved,1);assert.equal(forwarded,0);
  await view.runPrompt('/model same');assert.match(messages.at(-1),/多个提供方/);assert.equal(saved,1);
  active=true;await view.runPrompt('/model a/same');assert.match(messages.at(-1),/正在执行/);assert.equal(saved,1);
  await view.runPrompt('/abort');assert.equal(stopped,1);
  await view.runPrompt('/current 总结');assert.equal(forwarded,1);
  bridge.dispose();assert.equal(View.prototype.runPrompt,original);assert.equal(plugin.getPiCommands,catalog);
});
