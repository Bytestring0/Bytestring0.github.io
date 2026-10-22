import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LocalBridge, vaultPath, decodeExport } from './bridge.js';
import { buildExplicitContext, selectionAttachment } from './context.js';
import fs from 'node:fs';
import path from 'node:path';
test('tool paths remain in visible vault directories',()=>{const base='D:\\AstroBlog\\mizuki\\src\\content\\posts';assert.equal(vaultPath('./绘图/示意.drawio.svg',base),'绘图/示意.drawio.svg');assert.equal(vaultPath(base+'\\绘图\\示意.drawio.svg',base),'绘图/示意.drawio.svg');for(const candidate of ['../auth.json','.obsidian/data.json','D:/other/file.svg','绘图/../../file.svg'])assert.throws(()=>vaultPath(candidate,base))});
test('SVG export decoding preserves embedded editable content',()=>{const source='<svg content="&lt;mxfile/&gt;"/>';assert.equal(decodeExport('data:image/svg+xml;base64,'+Buffer.from(source).toString('base64')),source);assert.equal(decodeExport('data:image/svg+xml,'+encodeURIComponent(source)),source);assert.throws(()=>decodeExport('data:text/plain,hello'))});
test('local tool bridge authenticates callers and preserves real answers',async()=>{const plugin={app:{},settings:{sandboxMode:'edit'}};const bridge=new LocalBridge(plugin,async args=>({value:args.options[1].label}));await bridge.start();try{const url=bridge.environment.OBSIDIAN_PI_BRIDGE_URL+'/tool';assert.equal((await fetch(url,{method:'POST',body:'{}'})).status,401);const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+bridge.token},body:JSON.stringify({name:'question',args:{question:'选择',options:[{label:'A'},{label:'B'}]}})});assert.deepEqual(await response.json(),{value:'B'});const invalid=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+bridge.token},body:'invalid'});assert.equal(invalid.status,400)}finally{bridge.dispose()}});
test('Review mode refuses drawing writes before any file access',async()=>{const bridge=new LocalBridge({app:{},settings:{sandboxMode:'review'}},()=>{});await bridge.start();try{const response=await fetch(bridge.environment.OBSIDIAN_PI_BRIDGE_URL+'/tool',{method:'POST',headers:{Authorization:'Bearer '+bridge.token},body:JSON.stringify({name:'drawio',args:{action:'create',path:'绘图/a.drawio.svg'}})});assert.equal(response.status,400);assert.match((await response.json()).error,/不允许修改/)}finally{bridge.dispose()}});
test('extension exposes question and both drawing tools without a custom system prompt',async()=>{const code=fs.readFileSync(path.join(import.meta.dirname,'extension.mjs'),'utf8');for(const name of ["name: 'question'","name: 'obsidian_drawio'","name: 'obsidian_excalidraw'"])assert.ok(code.includes(name));assert.ok(!code.includes('append-system-prompt'));const main=fs.readFileSync(path.resolve(import.meta.dirname,'../../../src/content/posts/.obsidian/plugins/pi-agent/main.js'),'utf8');assert.equal(main.split('// Mizuki Pi Agent enhancements').length,2);assert.ok(main.includes('promptResult?.disposition === "handled"'))});

test('official Excalidraw dispatcher preserves native revisions and failure receipts',async()=>{
  const receipt={ok:false,mutation:'applied',persistence:'unsaved',error:{code:'SAVE_FAILED'}};
  const request={command:'apply',path:'绘图/a.excalidraw.md',requestId:'edit-1',expectedRevision:'live-1',operations:[{op:'update',id:'label',set:{text:'中文'}}]};
  let received;
  const bridge=new LocalBridge({app:{plugins:{getPlugin:()=>({ea:{executeCLI:async value=>(received=value,receipt)}})}},settings:{sandboxMode:'edit'}},()=>{});
  assert.equal(await bridge.excalidraw({request}),receipt);
  assert.deepEqual(received,{apiVersion:1,...request});
  await assert.rejects(bridge.excalidraw({request},AbortSignal.abort()),/取消/);
});

test('Review permits native discovery and rejects apply before dispatch',async()=>{
  const seen=[];
  const bridge=new LocalBridge({app:{plugins:{getPlugin:()=>({ea:{executeCLI:async request=>(seen.push(request.command),{ok:true})}})}},settings:{sandboxMode:'read-only'}},()=>{});
  await bridge.start();
  try {
    const invoke=command=>fetch(bridge.environment.OBSIDIAN_PI_BRIDGE_URL+'/tool',{method:'POST',headers:{Authorization:'Bearer '+bridge.token},body:JSON.stringify({name:'excalidraw',args:{request:{command}}})});
    assert.equal((await invoke('schema')).status,200);
    assert.equal((await invoke('apply')).status,400);
    assert.deepEqual(seen,['schema']);
  } finally { bridge.dispose(); }
});

test('ordinary prompts never read the active note, selection or its linked neighborhood',async()=>{
  const builder={resolveActiveNote:()=>{throw Error('implicit note read')},graph:{getLinkedNeighborhood:()=>{throw Error('implicit neighborhood read')}},resolveAttachments:async references=>references.map(reference=>({label:reference.value})),enrichPromptContext:async context=>context};
  const context=await buildExplicitContext(builder,{references:[]},'private selected text');
  assert.equal(context.activeNote,undefined);assert.deepEqual(context.linkedNeighborhood,[]);assert.deepEqual(context.annotations,[]);
  const explicit=await buildExplicitContext(builder,{references:[{type:'note',value:'chosen.md'}]},'private selected text');
  assert.deepEqual(explicit.attachments,[{label:'chosen.md'}]);assert.equal(explicit.activeNote,undefined);
});

test('explicit current-note commands retain their existing context behavior',async()=>{
  const note={path:'chosen.md'};let resolved=0;
  const builder={resolveActiveNote:async()=>{resolved++;return note},graph:{getLinkedNeighborhood:async()=>['linked']},resolveAttachments:async(_refs,active)=>[active],enrichPromptContext:async context=>context};
  const context=await buildExplicitContext(builder,{references:[{type:'command',value:'current'}]});
  assert.equal(resolved,1);assert.equal(context.activeNote,note);assert.deepEqual(context.linkedNeighborhood,['linked']);
});

test('selection references contain only the explicit text and preserve source and lines',()=>{
  const snapshot={text:'选中的中文\n第二行',file:{path:'folder/note.md',name:'note.md',basename:'note'},from:{line:3,ch:4},to:{line:4,ch:3}};
  const attachment=selectionAttachment(snapshot);assert.equal(attachment.content,snapshot.text);assert.equal(attachment.path,snapshot.file.path);assert.match(attachment.fileName,/L4–L5/);assert.equal(attachment.originalSize,new TextEncoder().encode(snapshot.text).length);
  assert.equal(selectionAttachment(snapshot,[attachment]),undefined);assert.throws(()=>selectionAttachment({...snapshot,text:' '}),/选中/);assert.throws(()=>selectionAttachment({...snapshot,text:'x'.repeat(65537)}),/大小限制/);
  assert.match(selectionAttachment({...snapshot,to:{line:5,ch:0}}).fileName,/L4–L5/);
});
