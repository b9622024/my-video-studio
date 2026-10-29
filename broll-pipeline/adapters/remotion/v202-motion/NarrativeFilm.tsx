import React from 'react';
import {AbsoluteFill,useCurrentFrame}from'remotion';
import {Tower,Skyline,Street,Chamber,Layer}from'./SceneObjects';
import {stateAt,cameraAt,phase}from'./MotionModel';
import config from './config.json';
const C={paper:'#F6F3EC',ink:'#182F40',gray:'#7B8589',gold:'#E3B35F'};
function MovingWind({frame}:{frame:number}){
 if(frame<9)return null;
 const p=((frame-9)/9)%3.0,head=-30+250*Math.min(1.2,p),tail=head-103;
 const opacity=p<=1.2?.56:Math.max(0,.56*(1-(p-1.2)/.35));
 return <g fill="none" stroke={C.gray} strokeWidth={1.45} opacity={opacity} strokeLinecap="round">
 {[323,418,533].map((y,i)=><g key={y} transform={`translate(${-i*9},0)`}><path d={`M${tail} ${y+5} Q${tail+48} ${y-3} ${head} ${y}`}/><path d={`M${head-7} ${y-4} l7 4 -7 4`}/></g>)}
 </g>;
}
function Comparison({frame,labels}:{frame:number;labels:boolean}){
 const s=stateAt(frame),scale=config.camera.comparison_scale,base=config.camera.comparison_base_y;
 return <AbsoluteFill style={{background:C.paper}}>
 <Layer camera={{target:[270,435],scale:.96}} z={0}><Skyline/></Layer>
 <AbsoluteFill style={{zIndex:1}}><svg viewBox="0 0 540 960" width="100%" height="100%">
 {config.camera.comparison_centers.map((cx,i)=><g key={cx}>
 <g transform={`translate(${cx},${base}) scale(${scale}) translate(-270,-747)`}>
 <MovingWind frame={frame}/><Tower top={i===0?s.referenceTop:s.top} reveal={i===1?1:0}/>
 {i===1&&<><Chamber top={s.top} relative={s.relative}/><Chamber top={s.top} relative={s.relative} front/></>}
 </g>
 <path d={Array.from({length:13},(_,j)=>{const f=Math.max(180,frame-12+j),old=stateAt(f),x=cx+scale*(i===0?old.referenceTop:old.top),y=base+(105-747)*scale;return`${j?'L':'M'}${x},${y}`}).join(' ')} stroke={i===0?C.gray:C.gold} strokeWidth={2.2} fill="none" opacity={.65}/>
 <circle cx={cx+scale*(i===0?s.referenceTop:s.top)} cy={base+(105-747)*scale} r={2.2} fill={i===0?C.gray:C.gold}/>
 {labels&&<text x={cx} y={812} textAnchor="middle" fill={C.ink} fontSize={18} fontFamily="Noto Sans CJK TC, sans-serif">{i===0?config.information.left:config.information.right}</text>}
 </g>)}
 <path d="M0 752 H540" stroke={C.ink} strokeWidth={1.3}/>
 </svg></AbsoluteFill>
 </AbsoluteFill>;
}
export function NarrativeFilm({labels=true}:{labels:boolean}){
 const frame=useCurrentFrame(),s=stateAt(frame),camera=cameraAt(frame),reveal=phase(frame,...config.geometry.section_reveal_frames as[number,number]);
 const bg={target:[270,435+(camera.target[1]-435)*.4],scale:1+(camera.scale-1)*.32};
 return <AbsoluteFill style={{background:C.paper}}>
 {frame>=180?<Comparison frame={frame} labels={labels}/>:<>
 <Layer camera={bg} z={0}><Skyline/></Layer>
 <Layer camera={camera} z={1}><MovingWind frame={frame}/></Layer>
 <Layer camera={camera} z={2}><Tower top={s.top} reveal={reveal}/></Layer>
 <Layer camera={camera} z={3}><Chamber top={s.top} relative={s.relative} reveal={reveal}/></Layer>
 <Layer camera={camera} z={4}><Chamber top={s.top} relative={s.relative} reveal={reveal} front/><Street/></Layer>
 </>}
 <div style={{position:'absolute',zIndex:10,left:24,bottom:24,padding:'6px 9px',fontFamily:'Noto Sans CJK TC, sans-serif',fontSize:13,color:C.gray,background:C.paper}}>{config.information.concept_notice}</div>
 </AbsoluteFill>;
}
