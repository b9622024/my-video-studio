import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd();
const manifest=JSON.parse(await fs.readFile('docs/asset-manifest.json','utf8'));
const assets=new Map(manifest.assets.map((x)=>[x.path,x]));
const files=[];
const hash=(b)=>createHash('sha256').update(b).digest('hex');
const secrets=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/gh[pousr]_[A-Za-z0-9]{20,}/,/github_pat_[A-Za-z0-9_]{30,}/,/AKIA[0-9A-Z]{16}/,/sk-[A-Za-z0-9_-]{24,}/];
async function walk(relative=''){
 for(const entry of await fs.readdir(path.join(root,relative),{withFileTypes:true})){
  const p=path.posix.join(relative,entry.name);
  if(entry.name==='node_modules'||entry.name==='out')continue;
  if(['public/assets/pexels-6535488-4to8-30fps.mp4','public/assets/pexels-6535488-v24-12s.mp4'].includes(p)){const b=await fs.readFile(p);if(hash(b)!==assets.get(p)?.sha256)throw Error('Unreviewed local footage');continue;}
  if(entry.isDirectory()){
   if(['node_modules','out','.git'].includes(entry.name)||p==='vendor-skills/skills')continue;
   await walk(p);continue;
  }
  if(entry.isSymbolicLink())throw Error(`No public symlinks: ${p}`);
  if(p.startsWith('docs/npm-install')&&p.endsWith('.log'))continue;
  if(/\.(wav|mp3|m4a|ckpt|pth|pt|safetensors|mp4|pem|key)$/i.test(p)||entry.name.startsWith('.env'))throw Error(`Sensitive/unexpected payload: ${p}`);
  const bytes=await fs.readFile(path.join(root,p));
  if(p.endsWith('.png')||p.endsWith('.ttf')){
   const a=assets.get(p);
   if(!a||a.sha256!==hash(bytes))throw Error(`Unapproved binary asset: ${p}`);
  }else{
   const text=bytes.toString('utf8');
   if(secrets.some((re)=>re.test(text)))throw Error(`Possible secret in ${p}`);
  }
  files.push({path:p,bytes:bytes.length,sha256:hash(bytes),gitBlobSha:createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex')});
 }
}
await walk();
files.sort((a,b)=>a.path.localeCompare(b.path));
await fs.mkdir('out',{recursive:true});
await fs.writeFile('out/source-manifest.json',JSON.stringify(files,null,2));
console.log(`PASS: ${files.length} reviewed source/asset files; no media, voice models or matching secret patterns`);
