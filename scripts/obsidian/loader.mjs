import path from 'node:path';
import { glob } from 'astro/loaders';
import { scanVault, vaultRoot, wikiTargets, resolveFile } from './vault.mjs';
import { validatePublishedEmbeds } from './validate.mjs';

// Filter before Astro parses or renders files: private MDX and drawing source
// must never become JavaScript modules or searchable HTML.
export function obsidianPosts() {
  return {
    name:'obsidian-published-posts',
    async load(context) {
      const watchKey=Symbol.for('mizuki.obsidian.loader.watcher');
      context.watcher?.[watchKey]?.();
      let queue = Promise.resolve();
      let previousIndex;
      const refresh = async (changedFiles) => {
        const index = scanVault();
        validatePublishedEmbeds(index);
        if(!changedFiles)context.store.clear();
        else {
          const affected=new Set(changedFiles);
          // Re-render wiki pages and their targets so transclusions and backlinks
          // update, while ordinary unchanged articles keep their cached output.
          for(const snapshot of [index,previousIndex].filter(Boolean)) {
            for(const note of snapshot.notes.filter(note=>note.public)) {
              const refs=wikiTargets(note);
              if(refs.length)affected.add(note.file);
              for(const ref of refs) {
                const target=resolveFile(snapshot,ref.target,note.file);
                if(target)affected.add(target.file);
              }
            }
          }
          const publicFiles=new Set(index.notes.filter(note=>note.public).map(note=>note.file));
          for(const [id,entry] of context.store.entries()) {
            const relative=entry.filePath ? path.relative(vaultRoot,path.resolve(entry.filePath)).replace(/\\/g,'/') : undefined;
            if(!relative || !publicFiles.has(relative) || affected.has(relative))context.store.delete(id);
          }
        }
        const files = index.notes.filter(note=>note.public).map(note=>note.file);
        if (!files.length) { context.store.clear(); return; }
        // Escape glob metacharacters in real file names.
        const pattern = files.map(file=>file.replace(/([\[\]{}()*?!])/g,'[$1]'));
        await glob({pattern,base:'./src/content/posts'}).load({...context,watcher:undefined});
        previousIndex=index;
      };
      await refresh();
      if (context.watcher) {
        let timer;
        const pending=new Set();
        const changed = file => {
          const relative = path.relative(vaultRoot,file);
          if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(p=>p.startsWith('.'))) return;
          if (!/\.(md|mdx|svg|png|jpe?g|webp|gif|excalidraw|drawio)$/i.test(file)) return;
          pending.add(relative.replace(/\\/g,'/'));
          clearTimeout(timer);
          timer=setTimeout(()=>{const files=[...pending];pending.clear();queue=queue.then(()=>refresh(files)).catch(error=>context.logger.error(String(error)));},350);
        };
        context.watcher.on('add',changed);
        context.watcher.on('change',changed);
        context.watcher.on('unlink',changed);
        context.watcher[watchKey]=()=>{
          clearTimeout(timer);
          context.watcher.off('add',changed);
          context.watcher.off('change',changed);
          context.watcher.off('unlink',changed);
        };
      }
    },
  };
}
