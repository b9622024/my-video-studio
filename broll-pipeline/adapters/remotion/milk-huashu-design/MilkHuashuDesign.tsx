import React,{useEffect,useState} from 'react';
import {AbsoluteFill,delayRender,continueRender,cancelRender,staticFile,useCurrentFrame} from 'remotion';
import {motionAt,ribbonAt} from './Motion';
export function MilkHuashuDesign(){const f=useCurrentFrame(),s=motionAt(f);const[handle]=useState(()=>delayRender('illustration layers'));useEffect(()=>{Promise.all(['glass-empty-original.png','carton-original.png'].map(n=>{const im=new Image();im.src=staticFile('assets/'+n);return im.decode()})).then(()=>continueRender(handle)).catch(cancelRender);},[handle]);
 const surface=478+.68*s.surface,source=[540,365];
 const stream=ribbonAt(f,surface),highlight=ribbonAt(f,surface,.37,-5);
 return <AbsoluteFill style={{background:'#F6F3EC'}}><svg viewBox="0 0 941 1672" width="100%" height="100%">
 <defs>
 <radialGradient id="paper"><stop stopColor="#FFF9EB"/><stop offset="1" stopColor="#F1EADB"/></radialGradient>
 <linearGradient id="milk" x1="0" x2="1"><stop stopColor="#FFFDF2"/><stop offset=".62" stopColor="#F8F0DD"/><stop offset="1" stopColor="#EADCC2"/></linearGradient>
 <linearGradient id="surface" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#FFFEF3"/><stop offset="1" stopColor="#F2E8D1"/></linearGradient>
 <linearGradient id="glassTint"><stop stopColor="#6384A0" stopOpacity=".12"/><stop offset=".4" stopColor="#F9F5E9" stopOpacity=".03"/><stop offset="1" stopColor="#6384A0" stopOpacity=".14"/></linearGradient>
 <clipPath id="cupInside"><path d="M46 320 C48 208 246 137 470 137 C704 137 899 219 898 320 L849 1347 Q843 1464 470 1465 Q104 1461 91 1347 Z"/></clipPath>
 <clipPath id="glassBack"><path d="M0 0 H941 V330 H0Z"/></clipPath>
 <clipPath id="glassFront"><path d="M0 320 H941 V1671 H0 Z M112 540 L143 1360 Q470 1455 798 1360 L823 540 Q470 602 112 540Z" fillRule="evenodd"/></clipPath>
 <clipPath id="cartonContour"><path d="M294 285 L583 216 L1134 30 Q1140 28 1146 34 L1455 211 L1411 627 L505 968 L200 754 L142 584 L286 383Z"/></clipPath>
 </defs>
 <rect width="941" height="1672" fill="url(#paper)"/>
 <path d="M97 1463 Q365 1418 676 1457 L1080 1592 L1080 1672 H712 L111 1564Z" fill="#776F61" opacity=".14"/>
 <g transform="translate(5,478) scale(.74,.68)">
 <path d="M20 322 L70 1381 Q80 1555 470 1555 Q855 1555 876 1380 L923 322Z" fill="url(#glassTint)"/>
 <image href={staticFile('assets/glass-empty-original.png')} width="941" height="1671" clipPath="url(#glassBack)"/>
 <g clipPath="url(#cupInside)">
 <path d={`M61 ${s.surface} H882 L849 1395 Q470 1500 91 1395Z`} fill="url(#milk)"/>
 <ellipse cx="470" cy={s.surface} rx={404-(s.surface-650)*.025} ry={s.surfaceRy} fill="url(#surface)"/>
 {[0,1].map(i=><ellipse key={i} cx="468" cy={s.surface+3} rx={65+i*64+5*Math.sin(f*.24-i)} ry={16+i*15} fill="none" stroke="#DCCAA7" strokeWidth={i?5:8} opacity={s.ripple*(i?.18:.3)}/>)}
 <ellipse cx="468" cy={s.surface+3} rx="31" ry="9" fill="#E2CFAF" opacity={s.ripple*.35}/>
 </g>
 </g>
 {stream&&<g><path d={stream} fill="#F8F0DD"/><path d={highlight} fill="#FFFCEE"/></g>}
 <g transform="translate(5,478) scale(.74,.68)"><image href={staticFile('assets/glass-empty-original.png')} width="941" height="1671" clipPath="url(#glassFront)"/></g>
 <g transform={`translate(${source[0]},${source[1]}) rotate(${s.angle}) scale(.73) translate(-254,-718)`}><image href={staticFile('assets/carton-original.png')} width="1536" height="1024" clipPath="url(#cartonContour)"/></g>
 </svg></AbsoluteFill>
}
