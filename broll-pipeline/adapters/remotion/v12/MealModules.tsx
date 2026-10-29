import React from 'react';
import {AbsoluteFill,OffthreadVideo,Img,staticFile,useCurrentFrame,interpolate,useVideoConfig} from 'remotion';
type RiceStudy={photo:string;maskSrc:string;layers:{left:number;top:number;width:number;from:number}[];labels:string[];note:string};
export type ModuleSpec={id:'M1'|'M2'|'M3';title:string;subtitle:string;asset:string;startFrom:number;frames:number;riceStudy?:RiceStudy;frameSequence?:string};
export type ModuleProps={spec:ModuleSpec;showText?:boolean};
const ink='#182f40',paper='#f3efe4';
const progress=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const ease=(p:number)=>p*p*(3-2*p);
export const MealCaption:React.FC<{spec:ModuleSpec;frame:number;show:boolean}>=({spec,frame,show})=>show?<>
 <div style={{position:'absolute',top:31,left:30,fontSize:15,letterSpacing:2,color:spec.id==='M1'?'white':ink,textShadow:spec.id==='M1'?'0 1px 8px #0008':undefined}}>可樂吉 ／ 餐點筆記</div>
 <div style={{position:'absolute',left:30,right:24,bottom:46,color:spec.id==='M1'?'white':ink,opacity:progress(frame,spec.id==='M3'?72:45,spec.id==='M3'?79:52)}}>
  <div style={{fontWeight:700,fontSize:spec.id==='M3'?34:42,lineHeight:1.4,letterSpacing:1}}>{spec.title}</div>
  <div style={{fontSize:18,marginTop:17,lineHeight:1.7}}>{spec.subtitle}</div>
 </div>
</>:null;
export const RicePhoto:React.FC<{left:number;top:number;width:number;src:string;maskSrc:string;opacity?:number}>=({left,top,width,src,maskSrc,opacity=1})=>{
 const mask=`url("${staticFile(maskSrc)}")`;
 return <div style={{position:'absolute',left,top,width,height:width*540/960,opacity,mixBlendMode:'lighten',maskImage:mask,maskSize:'100% 100%'}}>
  <Img alt="真實米飯影像，經遮罩製成概念合成" src={staticFile(src)} style={{width:'100%',height:'100%'}}/>
 </div>;
};
/** Same stationary tray, actual rice photography; added clumps change the occupied area.
 * This is an explicit conceptual composite, never evidence of a filmed serving event. */
export const RiceStateStudy:React.FC<{frame:number;showText:boolean;study:RiceStudy}>=({frame,showText,study})=>{
 const active=Math.max(0,study.layers.filter(layer=>frame>=layer.from).length-1);
 return <>
  <div style={{position:'absolute',left:24,top:170,width:492,height:526,background:'#161a1c',borderRadius:28,border:'10px solid #24282a',overflow:'hidden'}}>
   {study.layers.map((layer,i)=><RicePhoto key={i} {...layer} src={study.photo} maskSrc={study.maskSrc} opacity={i===0?1:progress(frame,layer.from,layer.from+4)}/>)}
  </div>
  {showText?<>
   <div style={{position:'absolute',left:31,top:117,fontSize:16,letterSpacing:1}}>同一餐盤・不同主食狀態</div>
   <div style={{position:'absolute',left:34,top:713,fontSize:18,color:ink}}>{study.labels[active]}<span style={{fontSize:14,marginLeft:17}}>相對示意，並非建議量</span></div>
  </>:null}
  <div style={{position:'absolute',left:34,top:758,fontSize:12,color:'#596265'}}>概念合成｜非原片添飯事件・非量測</div>
 </>;
};
export const MealModule:React.FC<ModuleProps>=({spec,showText=true})=>{
 const {width}=useVideoConfig();const f=useCurrentFrame();
 if(spec.id==='M3'&&!spec.riceStudy)throw Error('M3 needs a reviewed photographic portion study');const scale=spec.id==='M1'?1.22-.22*ease(progress(f,18,45)):1;
 return <AbsoluteFill style={{width:540,height:960,transform:`scale(${width/540})`,transformOrigin:'top left',background:paper,fontFamily:'"Noto Sans CJK TC",sans-serif',color:ink,overflow:'hidden'}}>
  {spec.id==='M3'&&f>=24?<RiceStateStudy frame={f} showText={showText} study={spec.riceStudy!}/>:<div style={{position:'absolute',left:0,top:spec.id==='M1'?0:82,width:540,height:spec.id==='M1'?960:650,overflow:'hidden'}}>
   {spec.frameSequence?<Img alt="原片連續影格，原速播放" src={staticFile(`${spec.frameSequence}/${String(f).padStart(3,'0')}.png`)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:spec.id==='M2'?'60% 50%':'50% 50%',transform:`scale(${scale})`,transformOrigin:'50% 60%'}}/>:<OffthreadVideo muted src={staticFile(spec.asset)} startFrom={spec.startFrom} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:spec.id==='M2'?'60% 50%':'50% 50%',transform:`scale(${scale})`,transformOrigin:'50% 60%'}}/>}
  </div>}
  {spec.id==='M1'?<div style={{position:'absolute',bottom:0,left:0,right:0,height:270,background:'linear-gradient(transparent,rgba(11,22,29,.88))'}}/>:null}
  <MealCaption spec={spec} frame={f} show={showText}/>
 </AbsoluteFill>;

};
