import React from 'react';
import {AbsoluteFill,staticFile,useCurrentFrame} from 'remotion';
import {ease,Ready,StudyTitle} from './v23-shared';
const atlas=staticFile('assets/milk-objects-refined-v23.png');
const start=26,end=77,fps=30,g=4400,vx=82,vy=52;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const flux=(t:number)=>Math.pow(Math.sin(Math.PI*clamp((t-start)/(end-start))),.85);
const pose=(f:number)=>{const lift=ease(f,3,24)*(1-ease(f,84,112));return {x:344+300*lift,y:740-96*lift,angle:67*lift,lift};};
const origin=(f:number)=>{const p=pose(f);const a=p.angle*Math.PI/180;return {x:p.x+.65*(22*Math.cos(a)-22*Math.sin(a)),y:p.y+.65*(22*Math.sin(a)+22*Math.cos(a))};};
// Cup width changes with height: mass is proportional to cross-sectional area.
const capacity=(h:number)=>Math.PI*(134*134*h+134*.045*h*h+.045*.045*h*h*h/3);
const heightFor=(v:number)=>{let a=0,b=430;for(let i=0;i<24;i++){const h=(a+b)/2;if(capacity(h)<v)a=h;else b=h;}return (a+b)/2;};
const raw=[] as {t:number;mass:number}[];for(let t=start+.125;t<end;t+=.25)raw.push({t,mass:flux(t)*.25});
const sum=raw.reduce((s,x)=>s+x.mass,0),target=capacity(287);let accumulated=0;
// Deterministic quadrature: emission arrives after its ballistic flight, then changes liquid level.
export const packets=raw.map(x=>{const mass=x.mass/sum*target;const surface=1412-heightFor(accumulated+mass/2);const o=origin(x.t);const flight=(-vy+Math.sqrt(vy*vy+2*g*(surface-o.y)))/g;accumulated+=mass;return {...x,mass,arrival:x.t+flight*fps};});
export const fluidAt=(f:number)=>{const received=packets.filter(p=>p.arrival<=f).reduce((s,p)=>s+p.mass,0);const surface=1412-heightFor(received);return {surface,received,progress:received/target};};
const glass='M1018 363 C1020 338 1395 338 1399 366 L1363 926 C1363 977 1055 977 1053 927 Z';
const cavity='M1038 390 Q1208 410 1377 390 L1346 878 Q1208 915 1072 878 Z';
const Glass:React.FC<{front?:boolean}>=({front})=><g transform="translate(491 872) scale(.92) translate(-1018 -363)"><defs><clipPath id={front?'af':'ab'}><path d={glass}/></clipPath><mask id="front-cut" maskUnits="userSpaceOnUse" x="980" y="320" width="460" height="730"><rect x="980" y="320" width="460" height="730" fill="white"/><path d={cavity} fill="black" fillOpacity=".975"/><path d="M1030 366 Q1208 337 1387 366 L1384 373 Q1208 352 1030 373 Z" fill="black"/></mask></defs><image href={atlas} width="1536" height="1024" clipPath={front?'url(#af)':'url(#ab)'} mask={front?'url(#front-cut)':undefined} opacity={front?.86:.075}/></g>;
const Liquid:React.FC<{f:number}>=({f})=>{
 const {surface,received}=fluidAt(f);const lastArrival=packets[packets.length-1].arrival;
 const first=packets[0].arrival;const impact=f>=first&&f<=lastArrival;
 const ripple=f<first?0:Math.exp(-Math.max(0,f-lastArrival)/5);
 const ageMax=(-vy+Math.sqrt(vy*vy+2*g*(surface-origin(start).y)))/g;
 const old=Math.min((f-start)/fps,ageMax),young=Math.max(0,(f-end)/fps);
 const points=[] as {x:number;y:number;nx:number;ny:number;w:number}[];
 if(old>young&&f>start)for(let i=0;i<=60;i++){
  const age=young+(old-young)*i/60;const t=f-age*fps;const o=origin(t);const v=Math.hypot(vx,vy+g*age);
  const width=(11+17*Math.exp(-age*5))*Math.sqrt(flux(t))*(1+.035*Math.sin(age*49+f*.6));
  points.push({x:o.x+vx*age+.6*Math.sin(age*36+f*.2),y:Math.min(surface,o.y+vy*age+.5*g*age*age),nx:-(vy+g*age)/v,ny:vx/v,w:width});
 }
 const ribbon=points.length?'M'+points.map(p=>`${p.x+p.nx*p.w/2},${p.y+p.ny*p.w/2}`).join(' L')+' L'+[...points].reverse().map(p=>`${p.x-p.nx*p.w/2},${p.y-p.ny*p.w/2}`).join(' L')+' Z':'';
 const hitX=origin(start).x+vx*ageMax;const radius=134+.045*(1412-surface);
 return <><defs><clipPath id="cup-liquid"><path d="M510 909 Q666 932 822 909 L792 1380 Q668 1420 541 1380 Z"/></clipPath><linearGradient id="milk-body-a" x1="0" y1="0" x2="1" y2=".3"><stop stopColor="#d7d9cc"/><stop offset=".25" stopColor="#fffdf4"/><stop offset=".7" stopColor="#f8f7ee"/><stop offset="1" stopColor="#dce1d8"/></linearGradient><linearGradient id="ribbon-a"><stop stopColor="#c8d1c8"/><stop offset=".38" stopColor="#fffef7"/><stop offset=".68" stopColor="#f5f5ed"/><stop offset="1" stopColor="#c4cec5"/></linearGradient></defs>
 {received>0&&<g clipPath="url(#cup-liquid)"><path d={`M490 ${surface} Q666 ${surface+13} 842 ${surface} V1440 H490 Z`} fill="url(#milk-body-a)"/><ellipse cx="666" cy={surface} rx={radius} ry="19" fill="#fffdf4" stroke="#c1c8bb" strokeWidth="1.7"/>{[0,1,2].map(i=>{const phase=((f-first+i*8)%26+26)%26;return <ellipse key={i} cx={hitX} cy={surface+1} rx={10+phase*2.3} ry={2.5+phase*.12} fill="none" stroke="#b5bfae" strokeWidth="1.3" opacity={(1-phase/26)*.45*ripple}/>;})}<path d={`M549 ${surface+30} Q543 1300 557 1370`} stroke="#ffffff" strokeWidth="10" opacity=".22" fill="none"/></g>}
 {ribbon&&<path d={ribbon} fill="url(#ribbon-a)" stroke="#c1cabd" strokeWidth=".6"/>}
 {impact&&<g clipPath="url(#cup-liquid)"><path d={`M${hitX-15} ${surface+1} Q${hitX-7} ${surface-12-3*Math.sin(f)} ${hitX} ${surface-5} Q${hitX+10} ${surface-15} ${hitX+18} ${surface+2}`} fill="#fffef7"/>{[0,1].map(i=><ellipse key={i} cx={hitX+(i?17:-20)} cy={surface-5-Math.max(0,Math.sin(f*.57+i))*12} rx="1.9" ry="3.2" fill="#fffdf5" opacity=".75"/>)}</g>}
 </>;
};
const EditorialScene:React.FC=()=>{const f=useCurrentFrame(),p=pose(f),cam=ease(f,75,116);return <AbsoluteFill style={{transform:`translate(${-65*cam}px,${-55*cam}px) scale(${1+.09*cam})`,transformOrigin:'666px 1160px'}}><svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{overflow:'visible'}}><defs><filter id="contact"><feGaussianBlur stdDeviation="8"/></filter><filter id="far"><feGaussianBlur stdDeviation="42"/></filter><linearGradient id="table" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ebe4d6"/><stop offset="1" stopColor="#f4eee1"/></linearGradient><clipPath id="carton-cut"><path d="M234 223 L290 139 L315 91 L315 43 Q440 34 566 40 L570 94 Q610 76 638 109 Q671 137 649 179 L642 213 L670 235 L672 946 Q662 967 640 968 L246 954 Q231 951 233 929 Z"/></clipPath></defs>
 <ellipse cx="-100" cy="890" rx="200" ry="360" fill="#d6dcc8" opacity=".20" filter="url(#far)"/><path d="M-1000 1350 Q500 1320 2080 1350 V3000 H-1000Z" fill="url(#table)"/><ellipse cx="665" cy="1440" rx="174" ry="15" fill="#24354b" opacity=".14" filter="url(#contact)"/><ellipse cx="665" cy="1440" rx="121" ry="6" fill="#24354b" opacity=".09"/><ellipse cx={180+80*p.lift} cy="1284" rx={130-40*p.lift} ry="17" fill="#20384c" opacity={.13*(1-.8*p.lift)} filter="url(#contact)"/>
 <g transform={`translate(${p.x} ${p.y}) rotate(${p.angle}) scale(.65) translate(-604 -146)`}><image href={atlas} width="1536" height="1024" clipPath="url(#carton-cut)"/></g><Glass/><Liquid f={f}/><Glass front/>
 </svg></AbsoluteFill>;};
export const MilkEditorialA:React.FC=()=> <AbsoluteFill style={{background:'radial-gradient(ellipse at 60% 44%,#fffdf6,#f0e9da 90%)'}}><Ready image={atlas}/><EditorialScene/><StudyTitle/></AbsoluteFill>;
