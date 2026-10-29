import React from 'react';
import content from './content.json';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {MilkPour,Glass,MilkCarton,Plate} from '../v201/Objects';
import {milkState,progress,lerp} from '../v201/MotionMath';
const ink='#182F40',paper='#F6F3EC';
export const story={fps:30,frames:450,shots:[{id:1,from:0,to:90},{id:2,from:90,to:180},{id:3,from:180,to:300},{id:4,from:300,to:450}]};
export function Beverage({x=255,y=590,scale=1,surface=525}:{x?:number;y?:number;scale?:number;surface?:number}){return <g transform={`translate(${x},${y}) scale(${scale}) translate(-255,-590)`}><Glass surface={surface}/></g>}
function Label({x,y,children,size=24}:{x:number;y:number;children:React.ReactNode;size?:number}){return <text x={x} y={y} fontSize={size} fill={ink} textAnchor="middle" fontWeight={500}>{children}</text>}
export function MilkStory(){
 const f=useCurrentFrame();const pouring=milkState(f,content.pour,content.timing);
 const compare=f>=180&&f<300,ending=f>=300;
 const unfold=progress(f,[304,348]);
 return <AbsoluteFill style={{background:paper,fontFamily:'Noto Sans CJK TC, sans-serif'}}><svg width="100%" height="100%" viewBox="0 0 540 960">
 <defs><linearGradient id="table" x2="0" y2="1"><stop stopColor="#E9E6DA"/><stop offset="1" stopColor={paper}/></linearGradient></defs>
 <text x="36" y="57" fill={ink} fontSize="14" letterSpacing="1.5">可樂吉健康研究所 ／ 飲食筆記</text>
 <path d="M0 741 Q270 709 540 741 V960 H0Z" fill="url(#table)"/>
 {!compare&&!ending&&<>
 <text x="36" y="143" fill={ink} fontSize="34" fontWeight="600">{content.opening[0]}</text><text x="36" y="190" fill={ink} fontSize="34" fontWeight="600">{content.opening[1]}</text>
 <g transform="translate(-8,12)"><MilkPour {...pouring} spout={[341,390]}/></g>
 <Label x={255} y={778} size={22}>{f<90?'先從一杯牛奶開始。':'倒入，看見實際份量。'}</Label>
 <text x="394" y="565" fill={ink} textAnchor="middle" fontSize="17">{content.product}</text>
 </>}
 {compare&&<>
 <text x="36" y="150" fill={ink} fontSize="32" fontWeight="600">{content.comparison_title}</text>
 <g transform="translate(0,-12)"><Beverage x={151} y={565} scale={.89}/><Beverage x={389} y={565} scale={.89}/></g>
 <Label x={151} y={700}>{content.comparison_labels[0]}</Label><Label x={389} y={700}>{content.comparison_labels[1]}</Label>
 <Label x={270} y={781} size={22}>考量份量，也考量營養需求。</Label>
 <Label x={270} y={829} size={14}>同規格杯示意；液位不代表營養數值</Label>
 </>}
 {ending&&<>
 <text x="36" y="143" fill={ink} fontSize="31" fontWeight="600">{content.conclusion}</text>
 <g transform={`translate(${lerp(270,356,unfold)},${lerp(565,677,unfold)}) scale(${lerp(.89,.53,unfold)}) translate(-255,-590)`}><Glass surface={525}/></g>
 <g transform={`translate(${lerp(-230,0,unfold)},${lerp(130,20,unfold)})`}><g transform="translate(-5,155) scale(.65)"><Plate/></g></g>
 <g opacity={unfold}><g transform="translate(325,455) scale(.67) translate(-341,-390)"><MilkCarton spout={[341,390]}/></g><text x="357" y="548" fill={ink} fontSize="14">{content.product}</text></g>
 <g opacity={progress(f,[353,367])}><Label x={270} y={793} size={27}>關鍵還是整體飲食安排。</Label><Label x={270} y={838} size={18}>份量 × 營養需求 × 一整天的飲食</Label></g>
 </>}
 <text x="36" y="916" fill={ink} opacity=".6" fontSize="12">KELEJI ／ 概念示意・非個人化飲食建議</text>
 </svg></AbsoluteFill>
}
