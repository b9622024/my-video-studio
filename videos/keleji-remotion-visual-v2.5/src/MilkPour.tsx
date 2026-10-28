import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Img, Sequence, cancelRender, continueRender, delayRender, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {events} from './timeline';

const ink='#182d49';
const atlas=staticFile('assets/milk-objects-atlas.png');
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
const event=(id:string)=>{const e=events.find((row)=>row.id===id)!;const offset=e.offsetFrames??0;return {...e,startFrame:e.startFrame+offset,endFrame:e.endFrame+offset};};
const progress=(frame:number,id:string)=>{const e=event(id);const start=e.startFrame;return id==='fill'?smooth((frame-start)/(e.endFrame-e.startFrame)):interpolate(frame,[start,e.endFrame],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.42,0,.22,1)});};
export const cartonPose=(frame:number)=>{
  const rise=progress(frame,'tilt');const back=progress(frame,'return');
  const amount=rise*(1-back);
  return {x:355+355*amount,y:910-120*amount,angle:Number(event('tilt').params?.angle??67)*amount};
};
const sourceSpout={x:604,y:146};
const emitOrigin=(frame:number)=>{
  const p=cartonPose(frame);const a=p.angle*Math.PI/180;
  return {x:p.x+.72*(20*Math.cos(a)-20*Math.sin(a)),y:p.y+.72*(20*Math.sin(a)+20*Math.cos(a))};
};
const glassOutline='M1018 363 C1020 338 1395 338 1399 366 L1363 926 C1363 977 1055 977 1053 927 Z';
const cavity='M1038 390 Q1208 410 1377 390 L1346 878 Q1208 915 1072 878 Z';

const FontReady:React.FC=()=>{
  const [handle]=useState(()=>delayRender('Local Noto Serif TC'));
  useEffect(()=>{
    const face=new FontFace('KelejiSerif',`url(${staticFile('assets/noto-serif-tc-subset.ttf')})`,{weight:'600'});
    face.load().then((font)=>{(document.fonts as FontFaceSet & {add:(face:FontFace)=>FontFaceSet}).add(font);continueRender(handle);}).catch((err)=>cancelRender(err));
  },[handle]);
  return <Img src={atlas} style={{position:'absolute',width:1,height:1,opacity:0}}/>;
};

const Carton:React.FC<{frame:number}>=({frame})=>{
  const p=cartonPose(frame);
  return <g transform={`translate(${p.x} ${p.y}) rotate(${p.angle}) scale(.72) translate(${-sourceSpout.x} ${-sourceSpout.y})`}>
    <defs><clipPath id="carton-outline"><path d="M234 223 L290 139 L315 91 L315 43 Q440 34 566 40 L570 94 Q610 76 638 109 Q671 137 649 179 L642 213 L670 235 L672 946 Q662 967 640 968 L246 954 Q231 951 233 929 Z"/></clipPath></defs>
    <image href={atlas} width="1536" height="1024" clipPath="url(#carton-outline)"/>
  </g>;
};

const GlassArt:React.FC<{front?:boolean}>=({front=false})=><g transform="translate(550 960) scale(.78) translate(-980 -320)">
  <defs>
    <clipPath id={front?'glass-front-clip':'glass-back-clip'}><path d={glassOutline}/></clipPath>
    <mask id="glass-front-mask" maskUnits="userSpaceOnUse" x="980" y="320" width="460" height="730">
      <rect x="980" y="320" width="460" height="730" fill="white"/>
      <path d={cavity} fill="black" fillOpacity=".94"/>
    </mask>
  </defs>
  <image href={atlas} width="1536" height="1024" clipPath={front?'url(#glass-front-clip)':'url(#glass-back-clip)'} mask={front?'url(#glass-front-mask)':undefined} opacity={front?1:.16}/>
</g>;

const liquidState=(frame:number)=>{
  const fill=progress(frame,'fill');
  return {fill, surface:1403-246*(Number(event('fill').params?.maximumFill??.63)/.63)*fill};
};
const Fluid:React.FC<{frame:number;fps:number}>=({frame,fps})=>{
  const {fill,surface}=liquidState(frame);
  const flow=event('pour');const origin=emitOrigin(flow.startFrame);
  const gravity=4000, vx=120, vy=60;
  const flight=(-vy+Math.sqrt(vy*vy+2*gravity*(surface-origin.y)))/gravity;
  const oldest=Math.min(Math.max(0,(frame-flow.startFrame)/fps),flight);
  const youngest=Math.max(0,(frame-flow.endFrame)/fps);
  const points:{x:number;y:number;w:number;nx:number;ny:number}[]=[];
  if(oldest>youngest && frame>flow.startFrame){
    for(let i=0;i<=36;i++){
      const age=youngest+(oldest-youngest)*i/36;
      const o=emitOrigin(frame-age*fps);
      const velocity=Math.hypot(vx,vy+gravity*age);
      const emissionProgress=clamp((frame-age*fps-flow.startFrame)/(flow.endFrame-flow.startFrame));
      const flux=Math.max(0,4*emissionProgress*(1-emissionProgress));
      const w=(14+20*Math.exp(-age*4))*Math.sqrt(flux);
      points.push({x:o.x+vx*age+1.8*Math.sin(age*26+frame*.13),y:o.y+vy*age+.5*gravity*age*age,w,nx:-(vy+gravity*age)/velocity,ny:vx/velocity});
    }
  }
  const ribbon=points.length?`M ${points.map((p)=>`${p.x+p.nx*p.w/2},${p.y+p.ny*p.w/2}`).join(' L ')} L ${[...points].reverse().map((p)=>`${p.x-p.nx*p.w/2},${p.y-p.ny*p.w/2}`).join(' L ')} Z`:'';
  const fillEvent=event('fill');
  const receiving=frame>=fillEvent.startFrame&&frame<=fillEvent.endFrame;
  const settleAt=fillEvent.endFrame-4;
  const ripple=frame<fillEvent.startFrame?0:frame<settleAt?1:Math.exp(-(frame-settleAt)/5);
  const rx=112+18*(1-fill);
  return <>
    <defs>
      <clipPath id="liquid-cavity"><path d="M592 1012 Q724 1038 860 1012 L835 1398 Q725 1424 615 1398 Z"/></clipPath>
      <linearGradient id="milk-body" x1="0" y1="0" x2=".05" y2="1"><stop stopColor="#ffffff"/><stop offset="1" stopColor="#f2efdf"/></linearGradient>
      <linearGradient id="milk-ribbon"><stop stopColor="#c5cfc4"/><stop offset=".44" stopColor="#fffef7"/><stop offset="1" stopColor="#d4dbcf"/></linearGradient>
    </defs>
    {fill>.00001&&<g clipPath="url(#liquid-cavity)">
      <path d={`M580 ${surface} Q720 ${surface+14} 870 ${surface} L870 1440 L580 1440 Z`} fill="url(#milk-body)"/>
      <ellipse cx="725" cy={surface} rx={rx} ry="17" fill="#fffdf4" stroke="#bbc8bb" strokeWidth="1.8"/>
      {[0,1,2].map((i)=><ellipse key={i} cx={714+Math.sin(frame*.1+i)*2*ripple} cy={surface+1} rx={16+((frame-fillEvent.startFrame+i*9)%27+27)%27*2.6} ry={3+i*2.4} fill="none" stroke="#d7cfb7" strokeWidth="1.25" opacity={ripple*.36}/>) }
      <path d={`M626 ${surface+26} Q620 ${surface+100} 633 1380`} fill="none" stroke="#fffefa" strokeWidth="8" opacity=".35"/>
    </g>}
    {ribbon&&<path d={ribbon} fill="url(#milk-ribbon)" stroke="#aebcaf" strokeWidth="1.4"/>}
    {receiving&&fill>.002&&<ellipse cx={points.length?points[points.length-1].x:714} cy={surface-1} rx="13" ry="5" fill="#fffef5" opacity=".9"/>}
  </>;
};

const Scene:React.FC=()=>{
  const frame=useCurrentFrame();const {fps}=useVideoConfig();const camera=progress(frame,'camera');const lift=progress(frame,'tilt')*(1-progress(frame,'return'));
  return <AbsoluteFill style={{transform:`translate(${-190*camera}px,${-80*camera}px) scale(${1+.12*camera})`,transformOrigin:'540px 960px'}}>
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,overflow:'visible'}}> 
      <defs><filter id="soft-shadow"><feGaussianBlur stdDeviation="12"/></filter></defs>
      <path d="M-1000 1515 Q540 1490 2080 1515 L2080 4000 L-1000 4000Z" fill="#eae2d2" opacity=".52"/>
      <ellipse cx="730" cy="1465" rx="175" ry="19" fill="#24354b" opacity=".10" filter="url(#soft-shadow)"/>
      <ellipse cx="230" cy="1510" rx={150-30*lift} ry="17" fill="#24354b" opacity={.13*(1-.75*lift)} filter="url(#soft-shadow)"/>
      <Carton frame={frame}/>
      <GlassArt/>
      <Fluid frame={frame} fps={fps}/>
      <GlassArt front/>
    </svg>
  </AbsoluteFill>;
};

export const MilkPour:React.FC=()=>{
  const frame=useCurrentFrame();
  return <AbsoluteFill style={{background:'#f4efe4',color:ink,fontFamily:'KelejiSerif, serif',fontWeight:600}}>
    <FontReady/>
    <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 48% 56%, #fffdf5 0%, #f4efe4 62%, #eee6d7 100%)'}}/>
    <Sequence from={0} durationInFrames={120}><Scene/></Sequence>
    <div style={{position:'absolute',left:88,top:105,fontFamily:'Arial,sans-serif',fontSize:22,letterSpacing:4,color:'#6e786f'}}>KELEJI / MOTION STUDY 02.2</div>
    <div style={{position:'absolute',left:85,top:198,fontSize:86,lineHeight:1.36,letterSpacing:-2}}>減脂不能喝<br/><span style={{position:'relative',isolation:'isolate'}}>全脂牛奶<span style={{position:'absolute',left:0,right:0,bottom:-1,height:12,background:'#e8c971',opacity:.7,zIndex:-1}}/></span>嗎？</div>
    <div style={{position:'absolute',left:88,top:509,width:56,height:4,background:'#ce7f4b'}}/>
    <div style={{position:'absolute',left:88,right:88,bottom:112,height:1,background:'#bcb8a8'}}/>
    <div style={{position:'absolute',left:88,bottom:62,fontSize:30,color:'#6a746c',letterSpacing:1}}>風格化動畫示意</div>
    <div style={{position:'absolute',right:88,bottom:68,fontFamily:'Arial,sans-serif',fontSize:20,color:'#6a746c',letterSpacing:2}}>{frame<event('pour').startFrame?'TILT':frame<event('fill').endFrame?'POUR / FILL':'REST'}</div>
  </AbsoluteFill>;
};
