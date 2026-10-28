import React,{useEffect,useState} from 'react';
import {cancelRender,continueRender,delayRender,Easing,Img,interpolate,staticFile,useCurrentFrame} from 'remotion';
export const ease=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.45,0,.2,1)});
export const Ready:React.FC<{image?:string}>=({image})=>{
 const [handle]=useState(()=>delayRender('V2.3 local font'));
 useEffect(()=>{const font=new FontFace('KelejiSerif',`url(${staticFile('assets/noto-serif-tc-subset.ttf')})`,{weight:'600'});font.load().then(f=>{(document.fonts as FontFaceSet & {add:(font:FontFace)=>FontFaceSet}).add(f);continueRender(handle);}).catch(cancelRender);},[handle]);
 return image?<Img src={image} style={{position:'absolute',width:1,height:1,opacity:0}}/>:null;
};
export const StudyTitle:React.FC=()=>{
 const f=useCurrentFrame();
 return <div style={{position:'absolute',left:84,top:155,color:'#172f48',fontFamily:'KelejiSerif,serif',fontWeight:600,fontSize:64,lineHeight:1.38,letterSpacing:1,opacity:interpolate(f,[0,12,105,119],[0,1,1,.8]),translate:`0px ${interpolate(f,[0,16],[18,0],{extrapolateRight:'clamp'})}px`}}>減脂不能喝<br/><span style={{background:'linear-gradient(transparent 82%,#e8cb7c 82%,#e8cb7c 94%,transparent 94%)'}}>全脂牛奶</span>嗎？</div>;
};
