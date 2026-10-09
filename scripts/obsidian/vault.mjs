import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import { slug } from 'github-slugger';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';

export const root = path.resolve(import.meta.dirname, '../..');
export const vaultRoot = path.join(root, 'src/content/posts');
export const markdownParser = unified().use(remarkParse).use(remarkMath).use(remarkGfm).use(remarkDirective);
export const normalize = value => value.replace(/\\/g, '/').normalize('NFC').toLowerCase();
export const isPublishable = data => data.publish !== false && data.draft !== true && typeof data.title === 'string' && !!data.published && !data['excalidraw-plugin'];
const noteCache = new Map();
const referenceCache = new WeakMap();
export function walk(dir, prefix = '') {
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(entry => {
    if (entry.name.startsWith('.')) return [];
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(path.join(dir,entry.name),rel) : [rel];
  });
}
export function scanVault(base = vaultRoot) {
  const files = walk(base);
  const notes = files.filter(file => /\.(md|mdx)$/i.test(file) && !/\.excalidraw\.md$/i.test(file)).map(file => {
    const absolute=path.join(base,file);
    const stat=fs.statSync(absolute);
    const digest=`${stat.mtimeMs}:${stat.size}`;
    const cached=noteCache.get(absolute);
    if(cached?.digest===digest)return cached.note;
    const raw = fs.readFileSync(absolute,'utf8');
    const {data,content} = matter(raw);
    const id = data.slug || file.replace(/\.(md|mdx)$/i,'').split('/').map(segment => slug(segment)).join('/').replace(/\/index$/,'');
    const note={file,id,data,body:content,public:isPublishable(data)};
    noteCache.set(absolute,{digest,note});
    return note;
  });
  return {base,files,notes};
}
export function resolveFile(index, target, source) {
  let clean;
  try { clean = decodeURIComponent(target.trim()); } catch { clean = target.trim(); }
  if (!clean) return index.notes.find(n => normalize(n.file) === normalize(source));
  clean = clean.replace(/^\/+/, '').replace(/\\/g,'/');
  const noteName = value => normalize(value.replace(/\.(md|mdx)$/i,''));
  const relative = path.posix.normalize(path.posix.join(path.posix.dirname(source),clean));
  const exact = index.files.filter(file => normalize(file) === normalize(relative) || noteName(file) === noteName(relative));
  const absolute = index.files.filter(file => normalize(file) === normalize(clean) || noteName(file) === noteName(clean));
  const loose = index.files.filter(file => noteName(path.posix.basename(file)) === noteName(clean));
  const aliases = index.notes.filter(n => [n.data.title, ...(Array.isArray(n.data.aliases) ? n.data.aliases : [n.data.aliases])].filter(Boolean).some(a => normalize(String(a)) === normalize(clean))).map(n => n.file);
  const matches = exact.length ? exact : absolute.length ? absolute : loose.length ? loose : aliases;
  if (matches.length > 1) throw new Error(`链接「${target}」有多个匹配，请写完整路径：${matches.join('、')}`);
  const file = matches[0];
  if (!file) return undefined;
  return index.notes.find(n => n.file === file) || {file};
}
export function splitWiki(raw) {
  const pipe = raw.indexOf('|');
  const target = pipe < 0 ? raw : raw.slice(0,pipe);
  const hash = target.indexOf('#');
  return {target:hash < 0 ? target : target.slice(0,hash), fragment:hash < 0 ? '' : target.slice(hash+1), label:pipe < 0 ? undefined : raw.slice(pipe+1)};
}
export function postUrl(note, config = {}) {
  if (note.data.permalink) return `/${note.data.permalink.replace(/^\/+|\/+$/g,'')}/`;
  if (config.enable) {
    const date = new Date(note.data.published);
    const pad = n => String(n).padStart(2,'0');
    const parts = {year:date.getFullYear(),monthnum:pad(date.getMonth()+1),day:pad(date.getDate()),hour:pad(date.getHours()),minute:pad(date.getMinutes()),second:pad(date.getSeconds()),postname:note.id,category:note.data.category || 'uncategorized',post_id:note.numericId || 0};
    return `/${(config.format || '%postname%').replace(/\//g,'-').replace(/%(\w+)%/g,(_,key)=>parts[key] ?? `%${key}%`)}/`;
  }
  return `/posts/${(note.data.alias || note.id).replace(/^\/+|\/+$/g,'')}/`;
}
const safeExtensions = new Set(['.png','.jpg','.jpeg','.webp','.gif','.avif','.svg','.pdf','.mp3','.mp4','.webm','.wav','.v','.txt','.csv']);
export function publishAsset(file, base = vaultRoot) {
  const absolute = path.resolve(base,file);
  const relative = path.relative(base,absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(p=>p.startsWith('.'))) throw new Error('附件路径必须位于笔记目录内');
  const ext = path.extname(file).toLowerCase();
  if (!safeExtensions.has(ext)) throw new Error(`不支持公开此附件类型：${file}`);
  const content = fs.readFileSync(absolute);
  const name = `${crypto.createHash('sha256').update(content).digest('hex').slice(0,24)}${ext}`;
  const dir = path.join(root,'public/_obsidian');
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,name),content);
  return `/_obsidian/${name}`;
}
export function walkTree(node, callback) {
  callback(node);
  node.children?.forEach(child=>walkTree(child,callback));
}
export function wikiTargets(note) {
  const cached=referenceCache.get(note);
  if(cached?.body===note.body)return cached.targets;
  const targets = [];
  walkTree(markdownParser.parse(note.body),node=>{
    if(node.type !== 'text') return;
    for(const match of node.value.matchAll(/(!?)\[\[([^\]\n]+)\]\]/g)) targets.push({...splitWiki(match[2]),embed:!!match[1]});
  });
  referenceCache.set(note,{body:note.body,targets});
  return targets;
}
