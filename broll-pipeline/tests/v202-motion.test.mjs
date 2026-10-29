import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{createRequire}from'node:module';
const host=process.env.REMOTION_HOST??'/workspace/broll-v11/broll-pipeline/.runtime/v11-host',require=createRequire(host+'/package.json'),ts=require('typescript'),stage=path.resolve('.runtime/v202-motion-math');fs.mkdirSync(stage,{recursive:true});fs.writeFileSync(stage+'/package.json','{"type":"commonjs"}');fs.copyFileSync('projects/narrative-v202-motion/config.json',stage+'/config.json');
fs.writeFileSync(stage+'/MotionModel.cjs',ts.transpileModule(fs.readFileSync('adapters/remotion/v202-motion/MotionModel.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText);
const M=require(stage+'/MotionModel.cjs'),config=require(stage+'/config.json'),S=M.simulation.states,P=config.model;
assert.equal(S.length,241);let same=0,opposite=0,minLink=Infinity;
for(const s of S){
 assert.ok(Object.values(s).every(Number.isFinite));assert.ok(s.force>=0,'Rightward wind must not imply negative loading');
 if(s.frame<=18){assert.equal(s.top,0);assert.equal(s.referenceTop,0);}
 const g=M.geometryAt(s.frame);for(let i=0;i<2;i++)assert.ok(Math.abs(Math.hypot(g.ends[i][0]-g.anchors[i][0],g.ends[i][1]-g.anchors[i][1])-48)<1e-10,'Suspension length changed');
 assert.ok(g.x-18>232&&g.x+18<308&&g.y-17>246&&g.y+18<350,'Moving rig hits chamber boundary');
 for(const link of g.links){const len=Math.hypot(link.b[0]-link.a[0],link.b[1]-link.a[1]);minLink=Math.min(minLink,len);assert.ok(len>config.geometry.cylinder_body_length+5,'Cylinder bottoms out');}
 const a=M.derivative(s.t,[s.x,s.v,s.y,s.u,s.reference,s.referenceVelocity]);const w=P.normalized_omega,m=P.mass_ratio,cb=2*P.structural_damping_ratio*w,cd=2*P.absorber_damping_ratio*m*w;
 const energyRate=s.v*a[1]+w*w*s.x*s.v+m*s.u*a[3]+m*w*w*(s.x-s.y)*(s.v-s.u);
 assert.ok(Math.abs(energyRate-(s.force*s.v-cb*s.v*s.v-cd*(s.v-s.u)**2))<1e-10,'Energy balance or damping sign invalid');
 if(s.x*s.y>1e-8)same++;if(s.x*s.y< -1e-8)opposite++;
}
assert.ok(same>10&&opposite>10,'Mass must not be forced into constant antiphase');
const half=M.simulate(P.step/2);assert.ok(Math.max(...S.map((s,i)=>Math.abs(s.top-half.states[i].top)+Math.abs(s.relative-half.states[i].relative)))<1e-5,'Integration not converged');
for(let f=105;f<180;f++)assert.deepEqual(M.cameraAt(f),M.cameraAt(105),'Mechanism shot camera must hold');
for(const f of [54,105]){const a=M.cameraAt(f-1),b=M.cameraAt(f);assert.ok(Math.abs(a.scale-b.scale)<.002&&Math.abs((480+(305-a.target[1])*a.scale)-(480+(305-b.target[1])*b.scale))<.05,'Unintended camera discontinuity');}
const range=S.filter(s=>s.frame>=180&&s.frame<240),rms=arr=>Math.sqrt(arr.reduce((n,x)=>n+x*x,0)/arr.length);assert.ok(rms(range.map(s=>s.top))<rms(range.map(s=>s.referenceTop))*.7,'Comparison must visibly differ in this illustrative model');assert.ok(rms(range.map(s=>s.top))>1,'Damped response must remain nonzero');
for(let f=1;f<240;f++)assert.ok(Math.abs(S[f].relative-S[f-1].relative)<3,'Unexpected geometry jump');
fs.writeFileSync('projects/narrative-v202-motion/model-samples.json',JSON.stringify({units:'dimensionless model and illustration coordinates only; not Taipei101 measurements',gain:M.simulation.gain,samples:S},null,2));
fs.writeFileSync('projects/narrative-v202-motion/model-checks.json',JSON.stringify({pass:true,tests:['finite states','positive common force and delayed response','coupled energy identity','timestep convergence','nonconstant relative phase','hanger constraint and chamber clearance','fixed-body cylinder clearance','camera boundary continuity and shot03 hold','same-clock comparison difference with nonzero residual'],human_visual_approved:false},null,2));
console.log('PASS: coupled dynamics, convergence, geometry, camera and comparison. Not a visual approval.');
