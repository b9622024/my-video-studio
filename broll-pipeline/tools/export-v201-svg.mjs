import fs from 'node:fs/promises';import path from 'node:path';import{createRequire}from'node:module';
const host=process.env.REMOTION_HOST??'/workspace/broll-v11/broll-pipeline/.runtime/v11-host',require=createRequire(host+'/package.json'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const stage=path.resolve('.runtime/v201-svg'),target=path.resolve('projects/recognizable-v201/assets');await fs.mkdir(stage,{recursive:true});await fs.writeFile(stage+'/package.json',JSON.stringify({type:'commonjs'}));await fs.mkdir(target,{recursive:true});try{await fs.symlink(host+'/node_modules',stage+'/node_modules')}catch(e){if(e.code!=='EEXIST')throw e}
for(const file of ['Objects.tsx','MotionMath.ts']){const code=await fs.readFile('adapters/remotion/v201/'+file,'utf8');await fs.writeFile(stage+'/'+file.replace(/\.tsx?$/,'.js'),ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)}
await fs.copyFile('adapters/remotion/v201/style-tokens.json',stage+'/style-tokens.json');await fs.copyFile('adapters/remotion/v201/prototypes.json',stage+'/prototypes.json');const objects=require(stage+'/Objects.js');
for(const [name,component,props]of[['taipei-101',objects.Taipei101,{frame:74}],['milk-pour-complete',objects.MilkPour,{surface:525}],['meal-plate',objects.Plate,{frame:74}],['rice',objects.Rice,{}],['vegetables',objects.Vegetables,{}],['protein',objects.Protein,{}],['milk-carton',objects.MilkCarton,{}],['glass',objects.Glass,{}]]){
 const content=renderToStaticMarkup(React.createElement('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 540 960',width:540,height:960},React.createElement(component,props)));
 await fs.writeFile(target+'/'+name+'.svg',content+'\n');
}
console.log('Eight original vector assets exported; no raster or icon library used.');
