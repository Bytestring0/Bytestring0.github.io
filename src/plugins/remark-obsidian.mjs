import path from 'node:path';
import { slug } from 'github-slugger';
import { Transformer } from 'markmap-lib';
import { scanVault, resolveFile, splitWiki, postUrl, publishAsset, markdownParser, walkTree, wikiTargets, vaultRoot } from '../../scripts/obsidian/vault.mjs';

const text = value => ({type:'text',value});
const link = (url,label) => ({type:'link',url,children:[text(label)]});
const fragmentId = value => value.startsWith('^') ? `obsidian-block-${value.slice(1)}` : slug(value);
const noteFragment = fragment => fragment ? `#${fragmentId(fragment)}` : '';

function section(note, fragment) {
  const tree = markdownParser.parse(note.body);
  if (!fragment) return tree.children;
  if (fragment.startsWith('^')) {
    const id = fragment.slice(1);
    const found = tree.children.find(node=>{
      let match = false;
      walkTree(node,child=>{if(child.type === 'text' && new RegExp(`(?:^|\\s)\\^${id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\s*$`).test(child.value)) match=true;});
      return match;
    });
    if (!found) throw new Error(`找不到块引用：${note.file}#${fragment}`);
    return [found];
  }
  const start = tree.children.findIndex(node=>node.type === 'heading' && slug(node.children.map(n=>n.value || '').join('')) === slug(fragment));
  if(start < 0) throw new Error(`找不到标题：${note.file}#${fragment}`);
  const depth = tree.children[start].depth;
  let end = start+1;
  while(end < tree.children.length && !(tree.children[end].type === 'heading' && tree.children[end].depth <= depth)) end++;
  return tree.children.slice(start,end);
}

export function remarkObsidian(options = {}) {
  return (tree,file) => {
    const index = scanVault();
    index.notes.filter(n=>n.public).sort((a,b)=>new Date(a.data.published)-new Date(b.data.published)).forEach((n,i)=>n.numericId=i+1);
    const filename = String(file.path || file.history?.[0] || '').replace(/\\/g,'/');
    const source = filename.includes('/src/content/posts/') ? filename.split('/src/content/posts/')[1] : undefined;
    if(!source) return;
    const current = index.notes.find(n=>n.file === source);
    if(!current?.public) return;
    const warnings = [];
    function renderWiki(raw, embed, origin, stack) {
      const {target,fragment,label} = splitWiki(raw);
      let resolved = resolveFile(index,target,origin);
      if(!resolved) {
        warnings.push(`未解析的双向链接：${raw}`);
        return {type:'text',value:label || target || fragment};
      }
      if (resolved.body !== undefined) {
        if(!resolved.public) {
          if(embed) throw new Error(`公开笔记不能嵌入未公开笔记：${origin} → ${resolved.file}`);
          return text(label || target || fragment);
        }
        if(!embed) return link(postUrl(resolved,options.permalink)+noteFragment(fragment),label || target || fragment);
        if(stack.includes(resolved.file)) throw new Error(`笔记嵌入存在循环：${[...stack,resolved.file].join(' → ')}`);
        const children = structuredClone(section(resolved,fragment));
        const embedded={type:'root',children};
        transform(embedded,resolved.file,[...stack,resolved.file]);
        return {type:'blockquote',children:[{type:'paragraph',children:[link(postUrl(resolved,options.permalink)+noteFragment(fragment),label || resolved.data.title)]},...embedded.children],data:{hProperties:{className:['obsidian-transclusion']}}};
      }
      let fileToPublish = resolved.file;
      if (/\.(excalidraw(?:\.md)?|drawio)$/i.test(fileToPublish)) {
        const stem = fileToPublish.replace(/\.md$/i,'');
        const candidates = [stem+'.svg',stem+'.png',fileToPublish.replace(/\.excalidraw(?:\.md)?$/i,'.svg')];
        fileToPublish = candidates.find(candidate=>index.files.includes(candidate));
        if(!fileToPublish) throw new Error(`绘图尚未导出 SVG/PNG：${resolved.file}`);
      }
      const url = publishAsset(fileToPublish,index.base);
      if(!embed || !/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(fileToPublish)) return link(url,label || path.posix.basename(fileToPublish));
      const size = label?.match(/^(\d+)(?:x(\d+))?$/);
      return {type:'image',url,alt:size ? path.posix.basename(fileToPublish) : label || path.posix.basename(fileToPublish),data:{hProperties:size ? {width:Number(size[1]),...(size[2] ? {height:Number(size[2])} : {})} : {}}};
    }
    function transform(node,origin,stack) {
      if(node.type === 'code' && node.lang === 'markmap') {
        const transformer = new Transformer();
        const {root} = transformer.transform(node.value);
        node.type='obsidianMarkmap';
        node.children=markdownParser.parse(node.value).children;
        node.data={hName:'div',hProperties:{className:['obsidian-markmap'],'data-markmap':JSON.stringify(root)}};
        return;
      }
      if(node.type === 'image' || node.type === 'link') {
        if(node.url && !/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(node.url)) {
          const resolved = resolveFile(index,node.url.split('#')[0],origin);
          if(resolved?.body !== undefined && node.type === 'link') {
            if(resolved.public) node.url=postUrl(resolved,options.permalink)+noteFragment(node.url.split('#')[1] || '');
            else {node.type='text';node.value=node.children?.map(c=>c.value || '').join('') || resolved.file;delete node.children;}
          } else if(resolved && node.type === 'image') node.url=publishAsset(resolved.file,index.base);
        }
      }
      if(!node.children) return;
      const output=[];
      for(const child of node.children) {
        if(child.type !== 'text') {transform(child,origin,stack);output.push(child);continue;}
        const regex=/(!?)\[\[([^\]\n]+)\]\]/g;
        let end=0;
        for(const match of child.value.matchAll(regex)) {
          if(match.index > end) output.push(text(child.value.slice(end,match.index)));
          output.push(renderWiki(match[2],!!match[1],origin,stack));
          end=match.index+match[0].length;
        }
        if(end < child.value.length) output.push(text(child.value.slice(end)));
      }
      node.children=output;
      // Note transclusions produce block nodes: lift them out of paragraphs.
      if(node.type === 'root' || node.type === 'blockquote' || node.type === 'listItem') {
        node.children=node.children.flatMap(child=>{
          if(child.type !== 'paragraph' || !child.children.some(n=>n.type === 'blockquote')) return [child];
          const blocks=[];let inline=[];
          for(const part of child.children) {
            if(part.type === 'blockquote') {if(inline.length)blocks.push({type:'paragraph',children:inline});blocks.push(part);inline=[];}
            else inline.push(part);
          }
          if(inline.length)blocks.push({type:'paragraph',children:inline});
          return blocks;
        });
      }
      if(['paragraph','heading','listItem','blockquote'].includes(node.type)) {
        const last=node.children.at(-1);
        const block=last?.type === 'text' && last.value.match(/(?:^|\s)\^([\w-]+)\s*$/);
        if(block) {last.value=last.value.slice(0,block.index);node.data={...node.data,hProperties:{...node.data?.hProperties,id:`obsidian-block-${block[1]}`}};}
      }
    }
    transform(tree,source,[source]);
    // Obsidian-style callouts, including titles and +/- folding.
    walkTree(tree,node=>{
      if(node.type !== 'blockquote') return;
      const first=node.children[0]?.children?.[0];
      const match=first?.type === 'text' && first.value.match(/^\[!([\w-]+)\]([+-])?(?:[ \t]+([^\n]*))?(?:\n|$)/i);
      if(!match) return;
      first.value=first.value.slice(match[0].length);
      const title=match[3] || match[1];
      node.children.unshift({type:'paragraph',children:[text(title)],data:{hName:match[2] ? 'summary' : 'div',hProperties:{className:['obsidian-callout-title']}}});
      node.data={hName:match[2] ? 'details' : 'aside',hProperties:{className:['obsidian-callout',`obsidian-callout-${match[1].toLowerCase()}`],...(match[2]==='+' ? {open:true} : {})}};
    });
    const backlinks=index.notes.filter(note=>note.public && note.file!==source && wikiTargets(note).some(ref=>resolveFile(index,ref.target,note.file)?.file === source));
    if(backlinks.length) tree.children.push({type:'heading',depth:2,children:[text('引用这篇笔记')],data:{hProperties:{'data-pagefind-ignore':true}}},{type:'list',ordered:false,children:backlinks.map(note=>({type:'listItem',children:[{type:'paragraph',children:[link(postUrl(note,options.permalink),note.data.title)]}]}))});
    for(const warning of warnings) file.message(warning);
  };
}
