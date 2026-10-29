import React from 'react';
import {AbsoluteFill,Img,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {cameraAt,stateIndexAt,labelFits,CameraKey} from './ComparisonMath';
export type StateSpec={id:string;label:string;asset:string;originalAsset:string;rect:number[]};
export type ComparisonSpec={frames:number;width:number;height:number;baseAsset:string;states:StateSpec[];style:{paper:string;ink:string;plateShadow:string;riceShadow:string};matchCut:{stateFrames:number;plateCenter:number[];plateSize:number;labelY:number};table:{plateSize:number;objects:{stateId:string;center:number[]}[];screenCenter:number[];cameraKeys:CameraKey[]}};
export type ComparisonProps={spec:ComparisonSpec;variant:'A'|'B';showLabels?:boolean;legacyArt?:boolean};
/** One base and ONE independent native-alpha state. Never blends or duplicates rice. */
export const LayeredObject:React.FC<{spec:ComparisonSpec;state:StateSpec;center:number[];size:number;legacyArt?:boolean}>=({spec,state,center,size,legacyArt=false})=>{
 const [x,y,w,h]=state.rect;
 return <div style={{position:'absolute',left:center[0]-size/2,top:center[1]-size/2,width:size,height:size}}>
  <div style={{position:'absolute',width:1000,height:1000,transform:`scale(${size/1000})`,transformOrigin:'0 0'}}>
   <Img alt="固定的原創餐盤、蔬菜與雞肉" src={staticFile(spec.baseAsset)} style={{position:'absolute',width:1000,height:1000,filter:legacyArt?undefined:spec.style.plateShadow}}/>
   <Img alt={`獨立原創狀態 ${state.id}`} src={staticFile(legacyArt?state.originalAsset:state.asset)} style={{position:'absolute',left:x,top:y,width:w,height:h,filter:legacyArt?undefined:spec.style.riceShadow}}/>
  </div>
 </div>;
};
export const MatchCutComparison:React.FC<{spec:ComparisonSpec;frame:number;showLabels:boolean;legacyArt:boolean}>=({spec,frame,showLabels,legacyArt})=>{
 const state=spec.states[stateIndexAt(frame,spec.states.length,spec.matchCut.stateFrames)];
 return <>
  <LayeredObject spec={spec} state={state} center={spec.matchCut.plateCenter} size={spec.matchCut.plateSize} legacyArt={legacyArt}/>
  {showLabels?<div style={{position:'absolute',top:spec.matchCut.labelY,left:0,right:0,textAlign:'center',fontSize:34,fontWeight:600,letterSpacing:4}}>{state.label}</div>:null}
 </>;
};
/** Orthographic 2.5D table: every object stays fixed; only one camera transform changes. */
export const TableCameraComparison:React.FC<{spec:ComparisonSpec;frame:number;showLabels:boolean;legacyArt:boolean}>=({spec,frame,showLabels,legacyArt})=>{
 const cam=cameraAt(frame,spec.table.cameraKeys),[sx,sy]=spec.table.screenCenter;
 return <div style={{position:'absolute',left:sx,top:sy,transform:`scale(${cam.zoom}) translate(${-cam.x}px,${-cam.y}px)`,transformOrigin:'0 0'}}>
  <div style={{position:'absolute',left:-1800,top:-1800,width:5000,height:5000,background:'radial-gradient(ellipse at 35% 30%,#f8f4eb 0%,#f3efe5 55%,#ebe3d6 100%)'}}/>
  {spec.table.objects.map(object=>{
   const state=spec.states.find(s=>s.id===object.stateId);if(!state)throw Error('Missing object state '+object.stateId);

   return <React.Fragment key={state.id}>
    <LayeredObject spec={spec} state={state} center={object.center} size={spec.table.plateSize} legacyArt={legacyArt}/>
    {showLabels&&labelFits(object.center,cam,spec.table.plateSize,spec.table.screenCenter)?<div style={{position:'absolute',left:object.center[0]-200,top:object.center[1]-spec.table.plateSize*.63,width:400,textAlign:'center',fontSize:36,fontWeight:600,letterSpacing:3}}>{state.label}</div>:null}
   </React.Fragment>;
  })}
 </div>;
};
export const PlateComparison:React.FC<ComparisonProps>=({spec,variant,showLabels=true,legacyArt=false})=>{
 const f=useCurrentFrame(),{width}=useVideoConfig();
 return <AbsoluteFill style={{background:spec.style.paper,fontFamily:'"Noto Sans CJK TC",sans-serif',color:spec.style.ink,overflow:'hidden'}}>
  <div style={{position:'absolute',width:540,height:960,transform:`scale(${width/540})`,transformOrigin:'0 0',background:'radial-gradient(ellipse at 30% 10%,#faf7ee,#f3efe5 70%,#ece4d7)',overflow:'hidden'}}>
   {variant==='A'?<MatchCutComparison spec={spec} frame={f} showLabels={showLabels} legacyArt={legacyArt}/>:<TableCameraComparison spec={spec} frame={f} showLabels={showLabels} legacyArt={legacyArt}/>}
   {variant==='B'?<div style={{position:'absolute',bottom:0,left:0,right:0,height:76,background:'linear-gradient(transparent,#f3efe5 65%)'}}/>:null}
   <div style={{position:'absolute',bottom:30,left:0,right:0,textAlign:'center',fontSize:15,color:'#59656a'}}>概念示意</div>
  </div>
 </AbsoluteFill>;
};
