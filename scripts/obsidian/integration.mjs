import fs from 'node:fs';
import path from 'node:path';
import { scanVault, vaultRoot, root, walk, markdownParser, walkTree, resolveFile } from './vault.mjs';

export default function obsidianIntegration() {
  return {name:'mizuki-obsidian',hooks:{
    'astro:config:setup':({updateConfig})=>{
      const managed=path.join(root,'public/_obsidian');
      if(fs.existsSync(managed)) for(const name of fs.readdirSync(managed)) {
        if(/^[a-f\d]{24}\.[a-z\d]+$/.test(name)) fs.unlinkSync(path.join(managed,name));
      }
      updateConfig({vite:{plugins:[{
        name:'mizuki-published-images',
        resolveId(id){if(id === 'virtual:mizuki-published-images') return '\0'+id;},
        load(id){
          if(id !== '\0virtual:mizuki-published-images') return;
          const index=scanVault();
          const image=/\.(jpe?g|png|gif|webp|avif|svg)$/i;
          const paths=new Set(walk(path.join(root,'src')).filter(file=>image.test(file) && !file.startsWith('content/posts/')).map(file=>'/src/'+file));
          for(const note of index.notes.filter(n=>n.public)) {
            const add = value=>{
              if(!value || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(value)) return;
              const match=resolveFile(index,value.split('#')[0],note.file);
              if(match && image.test(match.file)) paths.add('/src/content/posts/'+match.file);
            };
            add(note.data.image);
            walkTree(markdownParser.parse(note.body),node=>{if(node.type === 'image')add(node.url);});
          }
          return `export default {${[...paths].map(file=>`${JSON.stringify(file)}:()=>import(${JSON.stringify(file)}).then(m=>m.default)`).join(',')}};`;
        },
      }]}});
    },
  }};
}
