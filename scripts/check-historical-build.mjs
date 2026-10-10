import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root=resolve('dist-historical');
let bytes=0,files=0;
async function inspect(directory){
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const path=resolve(directory,entry.name);
    if(entry.isDirectory()){await inspect(path);continue;}
    const size=(await stat(path)).size;
    bytes+=size;files++;
    if(size<1024){
      const content=await readFile(path,'utf8');
      assert.ok(!content.startsWith('version https://git-lfs.github.com/spec/'),`Unresolved LFS asset: ${path}`);
    }
  }
}
await inspect(root);
assert.ok(bytes<1024**3,'GitHub Pages site exceeds 1 GiB');
assert.equal(await readFile(resolve(root,'index.html'),'utf8'),await readFile(resolve(root,'historical.html'),'utf8'));
const sources=JSON.parse(await readFile('data/historical-sf/sources.json','utf8'));
const voices=JSON.parse(await readFile('src/historical-sf/voice-manifest.json','utf8'));
for(const path of [
  '/historical-sf/market-1906-excerpt.mp4',
  ...sources.images.filter(image=>image.displayInArchive!==false).map(image=>image.path),
  ...Object.values(voices).map(voice=>voice.path),
]){
  assert.ok((await stat(resolve(root,'.'+path))).size>0,`Missing runtime asset: ${path}`);
}
console.log(`Historical build verified: ${files} files, ${(bytes/1024**2).toFixed(1)} MiB; archive, film, and voices present; no LFS pointers.`);
