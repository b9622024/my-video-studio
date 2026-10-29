import React from 'react';import {AbsoluteFill,Img,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {carrierPose,payloadPose,TransferSpec,Pose} from './TransferMath';
const Sprite:React.FC<{asset:string;sourceSize:number[];anchor:number[];scale:number;pose:Pose;kind:'carrier'|'payload'}>=({asset,sourceSize,anchor,scale,pose,kind})=>{
 const blur=kind==='carrier'?1.1+pose.height*.28:.7+pose.height*.25;
 const opacity=kind==='carrier'?.18-pose.height*.004:.15;
 return <div style={{position:'absolute',left:pose.x,top:pose.y,transform:`rotate(${pose.angle}deg)`,transformOrigin:'0 0'}}>
  <Img alt={kind==='carrier'?'固定輪廓的原創空飯匙本體':'唯一可分離的原創米飯載荷'} src={staticFile(asset)} style={{position:'absolute',left:-anchor[0]*scale,top:-anchor[1]*scale,width:sourceSize[0]*scale,height:sourceSize[1]*scale,filter:`drop-shadow(${1+pose.height*.12}px ${1.6+pose.height*.16}px ${blur}px rgba(65,51,33,${opacity}))`}}/>
 </div>;
};
/** A single conserved payload leaves a fixed carrier and rests on a fixed receiver.
 * No source-image switches, food opacity animation, whole-pile replacement or camera trick. */
export const PayloadTransferStudy:React.FC<{spec:TransferSpec}>=({spec})=>{
 const frame=useCurrentFrame(),{width}=useVideoConfig(),carrier=carrierPose(frame,spec),payload=payloadPose(frame,spec);const [bx,by,bw,bh]=spec.base.rect,[rx,ry,rw,rh]=spec.receiver.rect;
 return <AbsoluteFill style={{background:'#f3efe5',overflow:'hidden'}}><div style={{position:'absolute',width:540,height:960,transform:`scale(${width/540})`,transformOrigin:'0 0',background:'radial-gradient(ellipse at 30% 10%,#faf7ee,#f3efe5 70%,#ece4d7)',fontFamily:'"Noto Sans CJK TC",sans-serif'}}>
  <Img alt="固定的原創餐盤、蔬菜與雞肉" src={staticFile(spec.base.asset)} style={{position:'absolute',left:bx,top:by,width:bw,height:bh,filter:'drop-shadow(1px 3px 2px rgba(61,48,29,.14)) drop-shadow(4px 10px 13px rgba(61,48,29,.09))'}}/>
  <Sprite {...spec.carrier} pose={carrier} kind="carrier"/>
  <Img alt="始終不變的基礎飯堆" src={staticFile(spec.receiver.asset)} style={{position:'absolute',left:rx,top:ry,width:rw,height:rh,filter:'drop-shadow(.5px 1px 1px rgba(76,60,40,.10))'}}/>
  <Sprite {...spec.payload} pose={payload} kind="payload"/>
  <div style={{position:'absolute',bottom:30,left:0,right:0,textAlign:'center',fontSize:15,color:'#59656a'}}>概念動畫</div>
 </div></AbsoluteFill>;
};
