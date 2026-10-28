import React,{useEffect,useState} from 'react';
import {AbsoluteFill,OffthreadVideo,continueRender,cancelRender,delayRender,interpolate,staticFile,useCurrentFrame} from 'remotion';
import {ease} from './v23-shared';
import nutrition from '../docs/nutrition-v24.json';
const ink='#183149',yellow='#dfbe65',orange='#be784e';
const fade=(f:number,a:number,b:number,c:number,d:number)=>interpolate(f,[a,b,c,d],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const FontReady:React.FC=()=>{const [handle]=useState(()=>delayRender('V2.4 local font'));useEffect(()=>{new FontFace('KelejiV24',`url(${staticFile('assets/noto-serif-tc-v24.ttf')})`,{weight:'600'}).load().then(font=>{(document.fonts as FontFaceSet & {add:(font:FontFace)=>FontFaceSet}).add(font);continueRender(handle);}).catch(cancelRender);},[handle]);return null;};
const Footage:React.FC=()=>{const f=useCurrentFrame();return <OffthreadVideo src={staticFile('assets/pexels-6535488-v24-12s.mp4')} muted style={{position:'absolute',width:'100%',height:'100%',objectFit:'cover',transform:`scale(${1+.045*ease(f,0,119)+.025*ease(f,240,340)}) translate(${-10*ease(f,0,119)}px,${-8*ease(f,0,119)}px)`,transformOrigin:'61% 65%',filter:'sepia(.075) saturate(.9) contrast(1.025)'}}/>;};
const Opening:React.FC=()=>{const f=useCurrentFrame();return <div style={{position:'absolute',left:84,top:155,fontSize:64,lineHeight:1.38,opacity:fade(f,0,12,106,123),translate:`0px ${18*(1-ease(f,0,16))}px`}}>減脂不能喝<br/><span style={{background:`linear-gradient(transparent 82%,${yellow} 82%,${yellow} 94%,transparent 94%)`}}>全脂牛奶</span>嗎？</div>;};
const Comparison:React.FC=()=>{const f=useCurrentFrame();return <AbsoluteFill style={{opacity:fade(f,120,134,226,244),translate:`0px ${18*(1-ease(f,120,139))}px`}}>
 <div style={{position:'absolute',left:84,top:122,fontSize:31,color:'#576655'}}>福樂一番鮮｜同樣 200 mL</div>
 <div style={{position:'absolute',left:84,top:180,fontSize:54}}>全脂、低脂，脂肪不同</div>
 {nutrition.products.map((p,i)=>{const y=310+i*155;return <div key={p.barcode} style={{position:'absolute',left:84,right:84,top:y,height:145}}><div style={{fontSize:42}}>{p.label}<span style={{fontSize:26,color:'#5b665d',marginLeft:18}}>{i===0?'特極全脂鮮乳':'優質低脂鮮乳'}</span></div><div style={{position:'absolute',top:85,width:650,height:3,background:'#bbc1b5'}}/><div style={{position:'absolute',top:79,width:650*(p.fat_g_per_200ml/8)*ease(f,136+i*10,169+i*10),height:15,background:i===0?ink:orange}}/><div style={{position:'absolute',right:0,top:46,fontSize:49,fontFamily:'Georgia,serif'}}>{p.fat_g_per_200ml.toFixed(1)}<span style={{fontSize:29}}> g</span></div></div>;})}
 <div style={{position:'absolute',left:84,top:632,fontSize:26,lineHeight:1.55,color:'#59655c'}}>資料：全聯商品標示（1830 mL 品項）<br/>飲品畫面示意，非上述品項實測</div>
 </AbsoluteFill>;};
const Portion:React.FC=()=>{const f=useCurrentFrame(),enter=ease(f,242,268);const y=interpolate(f,[240,280,320,344,359],[1095,1075,1056,1047,1047],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});return <AbsoluteFill style={{opacity:enter}}>
 <div style={{position:'absolute',left:84,top:136,fontSize:31,color:'#59655c'}}>份量也要算進去</div>
 <div style={{position:'absolute',left:84,top:208,fontSize:58,lineHeight:1.4,opacity:ease(f,266,287),translate:`0px ${12*(1-ease(f,266,287))}px`}}>重點是份量<br/>與整體飲食安排</div>
 <div style={{position:'absolute',left:84,top:426,fontSize:26,color:'#59655c'}}>份量概念刻度｜非量杯實測</div>
 <svg width="1080" height="1920" style={{position:'absolute',inset:0}}><line x1="130" y1="850" x2="130" y2={850+670*enter} stroke={ink} strokeWidth="2" opacity=".55"/>{Array.from({length:11},(_,i)=>{const yy=850+i*67;return <line key={i} x1="130" x2={i%5===0?166:150} y1={yy} y2={yy} stroke={ink} strokeWidth="2" opacity={enter*.55}/>;})}<path d={`M120 ${y} L140 ${y-9} L140 ${y+9}Z`} fill={orange}/><line x1="152" y1={y} x2="380" y2={y} stroke={orange} strokeWidth="2" strokeDasharray="5 9" opacity=".6"/></svg>
 </AbsoluteFill>;};
export const MilkHybridV24:React.FC=()=> <AbsoluteFill style={{background:'#f4efe4',fontFamily:'KelejiV24,serif',fontWeight:600,color:ink}}><FontReady/><Footage/><div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(246,242,233,.55) 0%,rgba(246,242,233,.3) 28%,transparent 42%)'}}/><Opening/><Comparison/><Portion/></AbsoluteFill>;
