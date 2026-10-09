import { scanVault, wikiTargets, resolveFile } from './vault.mjs';

// Validate before the Astro loader catches individual Markdown rendering errors.
export function validatePublishedEmbeds(index = scanVault()) {
  const done=new Set();
  const visit=(note,stack=[])=>{
    if(stack.includes(note.file))throw new Error(`笔记嵌入存在循环：${[...stack,note.file].join(' → ')}`);
    if(done.has(note.file))return;
    for(const ref of wikiTargets(note).filter(ref=>ref.embed)) {
      const target=resolveFile(index,ref.target,note.file);
      if(target?.body!==undefined) {
        if(!target.public)throw new Error(`公开笔记不能嵌入未公开笔记：${note.file} → ${target.file}`);
        visit(target,[...stack,note.file]);
      }
    }
    done.add(note.file);
  };
  for(const note of index.notes.filter(note=>note.public))visit(note);
}
