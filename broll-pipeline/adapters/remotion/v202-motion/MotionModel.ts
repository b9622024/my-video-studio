import config from './config.json';
export const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*t*(t*(t*6-15)+10)};
export const phase=(frame:number,a:number,b:number)=>smooth((frame-a)/(b-a));
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export type State={frame:number;t:number;force:number;x:number;v:number;y:number;u:number;reference:number;referenceVelocity:number;top:number;referenceTop:number;relative:number;relativeVelocity:number;damperPower:number};
const P=config.model;
export function forcing(t:number){return smooth((t-P.forcing_start)/P.forcing_ramp)*(P.forcing_mean+P.forcing_harmonic*Math.sin(P.normalized_omega*(t-P.forcing_start)))}
export function derivative(t:number,s:number[]){
 const[x,v,y,u,z,q]=s,w=P.normalized_omega,m=P.mass_ratio*P.building_mass;
 const k=P.building_mass*w*w,kd=m*w*w,cb=2*P.structural_damping_ratio*P.building_mass*w,cd=2*P.absorber_damping_ratio*m*w;
 const coupling=cd*(v-u)+kd*(x-y),F=forcing(t);
 return[v,(F-cb*v-k*x-coupling)/P.building_mass,u,coupling/m,q,(F-cb*q-k*z)/P.building_mass];
}
function integrate(step:number){
 const raw:{frame:number;s:number[]}[]=[];let s=[0,0,0,0,0,0];const n=Math.round(8/step),every=Math.round(1/(30*step));
 for(let i=0;i<=n;i++){
  if(i%every===0)raw.push({frame:i/every,s:[...s]});
  const t=i*step,a=derivative(t,s),b=derivative(t+step/2,s.map((x,j)=>x+step*a[j]/2)),c=derivative(t+step/2,s.map((x,j)=>x+step*b[j]/2)),d=derivative(t+step,s.map((x,j)=>x+step*c[j]));
  s=s.map((x,j)=>x+step*(a[j]+2*b[j]+2*c[j]+d[j])/6);
 }
 return raw;
}
export function simulate(step=P.step):{gain:number;states:State[]}{
 const raw=integrate(step),maxRelative=Math.max(...raw.map(({s})=>Math.abs(s[2]-s[0]))),gain=P.relative_display_limit/maxRelative;
 const cd=2*P.absorber_damping_ratio*P.mass_ratio*P.building_mass*P.normalized_omega;
 return{gain,states:raw.map(({frame,s})=>({frame,t:frame/30,force:forcing(frame/30),x:s[0],v:s[1],y:s[2],u:s[3],reference:s[4],referenceVelocity:s[5],top:s[0]*gain/P.anchor_mode_shape,referenceTop:s[4]*gain/P.anchor_mode_shape,relative:(s[2]-s[0])*gain,relativeVelocity:s[3]-s[1],damperPower:cd*(s[3]-s[1])**2}))};
}
export const simulation=simulate();
export function stateAt(frame:number){return simulation.states[Math.max(0,Math.min(240,Math.round(frame)))];}
export function cameraAt(frame:number){
 const C=config.camera;
 if(frame<54){const p=phase(frame,...C.prepare_frames as [number,number]);return{target:[270,lerp(C.wide_target[1],C.approach_target[1],p)],scale:lerp(C.wide_scale,1,p)};}
 const p=phase(frame,...C.approach_frames as [number,number]),scale=Math.exp(Math.log(C.detail_scale)*p);
 // Track the same upper bay smoothly through screen space; no independent floating panel.
 return{target:[270,C.detail_target[1]+(C.approach_target[1]-C.detail_target[1])*(1-p)/scale],scale};
}
export function geometryAt(frame:number){const relative=stateAt(frame).relative;const y=312+Math.sqrt(config.geometry.hanger_length**2-relative**2)-config.geometry.hanger_length;const x=270+relative;return{x,y,relative,anchors:[[258,252],[282,252]],ends:[[x-12,y-12],[x+12,y-12]],links:[{a:[236,348],b:[x-12,y+config.geometry.cradle_attach_y]},{a:[304,348],b:[x+12,y+config.geometry.cradle_attach_y]}]};}
