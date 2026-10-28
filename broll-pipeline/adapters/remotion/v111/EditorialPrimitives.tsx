import React from 'react';
import {Img,interpolate,staticFile,useCurrentFrame} from 'remotion';
export const palette={paper:'#f5efdf',navy:'#1d344b',yellow:'#efd278',muted:'#6c716c'};
export const between=(frame:number,a:number,b:number)=>interpolate(frame,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
export type Box={x:number;y:number;width:number;height:number};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;

/** Move the same real photograph into a contextual inset or a food-specific crop. */
export const PhotoFocus:React.FC<{src:string;from:Box;to:Box;range:[number,number];position?:string;reveal?:boolean;border?:boolean}>=({src,from,to,range,position='50% 50%',reveal=false,border=false})=>{
 const frame=useCurrentFrame(),p=between(frame,...range);
 return <div style={{position:'absolute',left:mix(from.x,to.x,p),top:mix(from.y,to.y,p),width:mix(from.width,to.width,p),height:mix(from.height,to.height,p),overflow:'hidden',boxSizing:'border-box',border:border?`${8*p}px solid ${palette.paper}`:undefined,clipPath:reveal?`inset(0 ${(1-p)*100}% 0 0)`:undefined}}>
  <Img src={staticFile(src)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:position}}/>
 </div>;
};

/** A label belongs to the pictured object's edge, never a free-floating node. */
export const ContextualAnnotation:React.FC<{x:number;y:number;text:string;visible:number;small?:boolean}>=({x,y,text,visible,small=false})=><div style={{position:'absolute',left:x,top:y,opacity:visible,color:palette.navy,fontSize:small?17:26,fontWeight:600,background:palette.paper,padding:small?'5px 7px':'8px 13px',borderLeft:small?undefined:`5px solid ${palette.yellow}`}}>{text}</div>;

const Bowl:React.FC<{cx:number;cy:number;size:number;id:string}>=({cx,cy,size,id})=><g transform={`translate(${cx} ${cy}) scale(${size})`}>
 <defs>
  <linearGradient id={id+'body'} x1="0" x2="1"><stop stopColor="#d3cbbb"/><stop offset=".3" stopColor="#fffdf2"/><stop offset=".7" stopColor="#f7f1df"/><stop offset="1" stopColor="#c9c1b1"/></linearGradient>
  <radialGradient id={id+'inside'} cx=".42" cy=".38"><stop stopColor="#92a2a3"/><stop offset=".6" stopColor="#405a6b"/><stop offset="1" stopColor="#223b50"/></radialGradient>
 </defs>
 <ellipse cy="126" rx="104" ry="17" fill="#27313a" opacity=".08"/><ellipse cy="123" rx="47" ry="8" fill="#27313a" opacity=".17"/><path d="M-43 86 L-40 116 Q0 132 40 116 L43 86Z" fill={`url(#${id}body)`}/>
 <path d="M-106 0 C-103 54-74 102 0 107 C74 102 103 54 106 0Z" fill={`url(#${id}body)`}/>
 <path d="M-38 115 Q0 127 38 115" fill="none" stroke="#c9c1b0" strokeWidth="2"/>
 <ellipse rx="108" ry="64" fill="#fffbed"/>
 <ellipse rx="98" ry="55" fill={`url(#${id}inside)`}/>
 <ellipse rx="105" ry="61" fill="none" stroke="#e6ddc8" strokeWidth="3"/>
 <path d="M-87-20 Q-40-62 44-38" fill="none" stroke="#f8f4e6" strokeWidth="4" opacity=".6"/>
 <path d="M-72 44 Q-55 78-15 84" fill="none" stroke="#ffffff" strokeWidth="5" opacity=".55"/>
</g>;

/** Ceramic objects only: no drawn food, volume scale, target portion or nutrition data. */
export const PortionExplanation:React.FC<{compact?:boolean;id:string}>=({compact=false,id})=>{
 const f=useCurrentFrame(),place=between(f,10,48),exchange=between(f,60,105);
 const bigX=mix(mix(150,270,place),133,exchange),bigY=mix(mix(170,465,place),185,exchange);
 const smallX=mix(408,270,exchange),smallY=mix(195,465,exchange);
 return <svg viewBox="0 0 540 760" style={{position:'absolute',left:0,top:compact?550:170,width:540,height:compact?360:760}} aria-label="空餐盤與不同容器的空間參照，沒有食物份量數值">
  <defs>
   <radialGradient id={id+'plate'} cx=".4" cy=".32"><stop stopColor="#fffdf6"/><stop offset=".65" stopColor="#f9f4e8"/><stop offset=".86" stopColor="#d8d0be"/><stop offset=".92" stopColor="#fffff6"/><stop offset="1" stopColor="#e4ddcb"/></radialGradient>
   <linearGradient id={id+'steel'}><stop stopColor="#84969a"/><stop offset=".3" stopColor="#f8faf5"/><stop offset=".5" stopColor="#d3dcdb"/><stop offset=".7" stopColor="#f9fbf7"/><stop offset="1" stopColor="#778b91"/></linearGradient>
  </defs>
  <ellipse cx="276" cy="528" rx="226" ry="149" fill="#27313a" opacity=".1"/>
  <ellipse cx="270" cy="505" rx="223" ry="146" fill={`url(#${id}plate)`}/>
  <ellipse cx="270" cy="500" rx="168" ry="103" fill="none" stroke="#ded6c3" strokeWidth="2"/>
  <ellipse cx="270" cy="493" rx="166" ry="101" fill="none" stroke="#fffef6" strokeWidth="3"/>
  <g transform="translate(492 335) rotate(8)">
   <path d="M-8 72 L-6 280 Q0 296 7 280 L8 72Z" fill={`url(#${id}steel)`}/>
   <ellipse rx="22" ry="53" cy="28" fill={`url(#${id}steel)`}/><ellipse rx="14" ry="40" cy="24" fill="#8c9fa3" opacity=".45"/>
  </g>
  <g transform="translate(38 346) rotate(-8)" fill={`url(#${id}steel)`}>
   <path d="M-6 70 L-5 275 Q0 292 6 275 L7 70 Q25 57 22 0 H16 V48 H9 V0 H3 V48 H-4 V0 H-10 V48 H-17 V0 H-23 Q-25 58-6 70Z"/>
  </g>
  <Bowl cx={bigX} cy={bigY} size={1.08} id={id+'large'}/>
  <Bowl cx={smallX} cy={smallY} size={.72} id={id+'small'}/>
 </svg>;
};
