import React,{useId}from'react';
import{AbsoluteFill,useCurrentFrame}from'remotion';
import{Tower}from'../v202-motion/SceneObjects';
import{stateAt,geometryAt}from'../v202-motion/MotionModel';
import art from'./art-config.json';
const C={paper:'#F6F3EC',ink:'#182F40',sage:'#8FAA96',gold:'#E3B35F',gray:'#7B8589'};
const ease=(t:number)=>{const p=Math.max(0,Math.min(1,t));return p*p*(3-2*p)};
export function artState(frame:number){const c=art.camera,p=ease((frame-c.approach_frames[0])/(c.approach_frames[1]-c.approach_frames[0])),scale=Math.exp(Math.log(c.start_scale)+(Math.log(c.end_scale)-Math.log(c.start_scale))*p);return{frame:frame+art.source_frames[0],focus:p,scale,cy:c.start_target[1]+(c.end_target[1]-c.start_target[1])*p,reveal:ease((frame-art.reveal_frames[0])/(art.reveal_frames[1]-art.reveal_frames[0]))};}
function Link({a,b,style}:{a:number[];b:number[];style:'A'|'B'}){
 const angle=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI,length=Math.hypot(b[0]-a[0],b[1]-a[1]);const dark=style==='A';
 return <g transform={`translate(${a[0]},${a[1]}) rotate(${angle})`}>
 <path d={`M0 0 H${length}`} stroke={dark?'#526A74':'#CED9D2'} strokeWidth={1.45}/>
 <rect x={2} y={-1.6} width={8.5} height={3.2} rx={.45} fill={dark?'#8FAA96':'#6F9390'} stroke={dark?C.ink:'#B5C8B8'} strokeWidth={.35}/>
 <path d="M2.6 -1.05 H9.8" stroke={dark?'#DCE5DA':'#C2D5CA'} strokeWidth={.45}/>
 <circle r={1.35} fill={dark?C.ink:C.gold}/><circle cx={length} r={1.35} fill={dark?C.ink:C.gold}/>
 </g>;
}
function ArtRoom({frame,style,reveal,focus}:{frame:number;style:'A'|'B';reveal:number;focus:number}){
 const id=useId().replace(/:/g,''),s=stateAt(frame),g=geometryAt(frame),dx=s.top*artAnchor();const B=style==='B',x=g.x,y=g.y;
 return <g transform={`translate(${dx},0)`}>
 <defs>
 <clipPath id={id}><rect x={228} y={242} width={88} height={116*reveal}/></clipPath>
 <radialGradient id={`${id}-mass`} cx="30%" cy="25%" r="78%"><stop offset="0" stopColor={B?'#F5DEA4':'#EFCD89'}/><stop offset=".55" stopColor="#E3B35F"/><stop offset="1" stopColor={B?'#A87935':'#C6974C'}/></radialGradient>
 <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0.85" y2="1"><stop stopColor="#1E3945"/><stop offset="1" stopColor="#344C52"/></linearGradient>
 <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.0"/></filter>
 </defs>
 <g clipPath={`url(#${id})`}>
 {B?<>
 <path d="M232 246 L238 242 H314 V350 L308 354 H232 Z" fill={`url(#${id}-wall)`}/>
 <path d="M232 246 L238 242 V350 L232 354 Z" fill="#536F70"/>
 <path d="M308 246 L314 242 V350 L308 354 Z" fill="#213A43"/>
 <path d="M232 354 L238 348 H314 L308 354 Z" fill="#587576"/>
 <path d="M238 242 H314 M238 348 H314" stroke="#9FB5AB" strokeOpacity={.3} strokeWidth={.45}/>
 <ellipse cx={x+4} cy={y+4} rx={17} ry={16} fill="#101F27" opacity={.23} filter={`url(#${id}-soft)`}/>
 </>:<>
 <rect x={232} y={246} width={76} height={108} fill="#E8ECE7"/>
 <path d="M232 247 H308 M232 354 H308" stroke="#B4C4BC" strokeWidth={.6}/>
 <rect x={232} y={246} width={3} height={108} fill="#D4DED6"/>
 <rect x={305} y={246} width={3} height={108} fill="#D4DED6"/>
 </>}
 {/* One support beam and its two cable bundles. No surplus floor grid. */}
 {B&&<path d="M239 248 L245 244 H307 L301 248 Z" fill="#BECFBC"/>}
 <path d="M239 248 H301 V251 H239 Z" fill={B?'#8FAA96':'#334E59'}/>
 {[-12,12].flatMap(offset=>[-.6,.6].map((strand,i)=><path key={`${offset}-${i}`} d={`M${270+offset+strand} 252 L${x+offset+strand} ${y-12}`} stroke={B?'#C6D6D1':'#435C68'} strokeWidth={.42}/>))}
 <path d="M258 249.5 V253 M282 249.5 V253" stroke={B?'#D9CB9F':'#6E8890'} strokeWidth={1.5}/>
 {/* The same original mass and cradle geometry; lighting and context are the experimental variable. */}
 <circle cx={x} cy={y} r={17} fill={`url(#${id}-mass)`} stroke={B?'#D4B371':'#886B3E'} strokeOpacity={.55} strokeWidth={.35}/>
 {[-10,-4,3,10].map(d=><path key={d} d={`M${x-Math.sqrt(289-d*d)+.8} ${y+d} Q${x} ${y+d+1} ${x+Math.sqrt(289-d*d)-.8} ${y+d}`} stroke={B?'#7B591F':'#9D7636'} strokeWidth={.35} strokeOpacity={B?.26:.32} fill="none"/>)}
 {B&&<path d={`M${x-12} ${y-9} Q${x-7} ${y-16} ${x+1} ${y-15}`} stroke="#FAE9BD" strokeOpacity={.48} strokeWidth={.7} fill="none"/>}
 <path d={`M${x-18} ${y+3} Q${x-18} ${y+18} ${x} ${y+18} Q${x+18} ${y+18} ${x+18} ${y+3}`} stroke={B?'#AAC1AF':'#4E6B70'} strokeWidth={1.4} fill="none"/>
 <Link a={g.links[0].a} b={g.links[0].b} style={style}/><Link a={g.links[1].a} b={g.links[1].b} style={style}/>
 {/* Foreground slab and near-side posts are real occluding structural parts. */}
 {B?<>
 <path d="M230 350 H310 L316 346 H236 Z" fill="#B7C8B4"/>
 <path d="M230 350 H310 V354 H230 Z" fill="#6B8E8B"/>
 <path d="M310 350 L316 346 V350 L310 354 Z" fill="#365761"/>
 <path d="M230 247 L232 246 V354 L230 357 Z" fill="#AFC3B1"/>
 <path d="M308 247 L310 246 V354 L308 357 Z" fill="#70928D"/>
 </>:<path d="M232 350 H308 V354 H232 Z" fill="#BACBC0" stroke="#718B89" strokeWidth={.4}/>}
 </g></g>;
}
function artAnchor(){return ((747-300)/642)**2;}
export function ArtStudy({style='A'}:{style:'A'|'B'}){
 const f=useCurrentFrame(),q=artState(f),s=stateAt(q.frame),B=style==='B';
 return <AbsoluteFill style={{background:C.paper}}>
 <svg viewBox="0 0 540 960" width="100%" height="100%">
 <g transform={`translate(270,480) scale(${q.scale}) translate(-270,${-q.cy})`}>
 <g opacity={1-q.focus*(B?.69:.83)}><Tower top={s.top} reveal={q.reveal}/></g>
 <ArtRoom frame={q.frame} style={style} reveal={q.reveal} focus={q.focus}/>
 </g>
 </svg>
 <div style={{position:'absolute',bottom:22,left:24,fontFamily:'Noto Sans CJK TC, sans-serif',fontSize:12,color:C.gray}}>概念示意，非實測</div>
 </AbsoluteFill>;
}
