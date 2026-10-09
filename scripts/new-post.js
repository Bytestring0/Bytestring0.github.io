import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export function createPost(name, {root=path.resolve(import.meta.dirname,'..'),publish=false,kind='note'} = {}) {
  if(typeof name !== 'string' || !name.trim()) throw new Error('请输入笔记标题');
  const raw=name.trim().replace(/\\/g,'/');
  if(path.isAbsolute(raw) || /^[a-z]:/i.test(raw) || raw.split('/').some(part=>!part || part==='.' || part==='..' || part.startsWith('.') || /[<>:"|?*\x00-\x1f]/.test(part) || /[ .]$/.test(part) || /^(con|prn|aux|nul|com\d|lpt\d)(?:\.|$)/i.test(part))) throw new Error('请使用 posts 内的相对路径，文件名不能含 Windows 非法字符或隐藏目录');
  const file=/\.(md|mdx)$/i.test(raw) ? raw : raw+'.md';
  const base=path.resolve(root,'src/content/posts');
  const destination=path.resolve(base,file);
  const relative=path.relative(base,destination);
  if(relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('笔记路径超出 posts 目录');
  if(fs.existsSync(destination)) throw new Error('同名笔记已存在');
  const title=path.basename(file).replace(/\.(md|mdx)$/i,'');
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const templates={note:'## 记录\n\n\n## 相关笔记\n\n',course:'## 本节要点\n\n\n## 定义与推导\n\n\n## 例题\n\n\n## 待解决问题\n\n- [ ] \n',experiment:'## 实验目的\n\n\n## 条件与电路\n\n\n## 数据与结果\n\n| 参数 | 数值 | 单位 |\n| --- | --- | --- |\n\n## 分析与结论\n\n',essay:''};
  const content=`---\ntitle: ${JSON.stringify(title)}\npublished: ${date}\npublish: ${publish}\ndraft: false\ndescription: ''\nimage: ''\ntags: []\ncategory: ${JSON.stringify(path.posix.dirname(file)==='.' ? '' : path.posix.dirname(file).split('/')[0])}\ncreate: false\nlang: ''\n---\n\n${templates[kind] ?? templates.note}`;
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,content,{encoding:'utf8',flag:'wx'});
  return {file,destination,title};
}
if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {const args=process.argv.slice(2);const name=args.find(arg=>!arg.startsWith('--'));const result=createPost(name,{publish:args.includes('--publish'),kind:args.find(arg=>arg.startsWith('--kind='))?.split('=')[1] || 'note'});console.log(`Post ${result.destination} created (${args.includes('--publish') ? '公开' : '未公开'})`);}
  catch(error) {console.error(error.message+'\n用法：pnpm run new-post "分类/标题" [--publish] [--kind=course|experiment|essay]');process.exitCode=1;}
}
