import React,{useEffect,useState,useId}from'react';
import{AbsoluteFill,staticFile,delayRender,continueRender,cancelRender}from'remotion';
import scene from'./scene.json';
const prefix='assets/';const url=(p:string)=>staticFile(prefix+p);
const files=['scene-interior.png','outer-facade-source.png','mass-gold.png','cradle-front.png','hydraulic-body.png'];
function useArt(){const[h]=useState(()=>delayRender('Decode original illustration assets'));useEffect(()=>{Promise.all(files.map(p=>{const im=new window.Image();im.src=url('original/'+p);return im.decode()})).then(()=>continueRender(h)).catch(cancelRender)},[h]);}
function NativeImage({file,rect=[0,0,1024,1536]}:{file:string;rect?:number[]}){return <image href={url(file)} x={rect[0]} y={rect[1]} width={rect[2]} height={rect[3]} preserveAspectRatio="none"/>}
export function Facade(){const id=useId().replace(/:/g,'');return <g><defs><clipPath id={id}><polygon points={scene.facade_polygon.map(p=>p.join(',')).join(' ')}/></clipPath></defs><g clipPath={`url(#${id})`}><NativeImage file="original/outer-facade-source.png"/></g></g>}
export function Foreground(){const id=useId().replace(/:/g,'');return <g><defs><clipPath id={id}>{scene.foreground_polygons.map((p,i)=><polygon key={i} points={p.map(a=>a.join(',')).join(' ')}/>)}</clipPath></defs><g clipPath={`url(#${id})`}><NativeImage file="original/scene-interior.png"/></g></g>}
export function Suspension(){const A=scene.anchors;return <g>{[[A.ceiling_left,A.mass_rig_left],[A.ceiling_right,A.mass_rig_right]].flatMap(([a,b],i)=>[-4,4].map((dx,j)=><g key={`${i}-${j}`}><path d={`M${a[0]+dx} ${a[1]} L${b[0]+dx} ${b[1]}`} stroke="#263D48" strokeWidth={4.4}/><path d={`M${a[0]+dx-.5} ${a[1]} L${b[0]+dx-.5} ${b[1]}`} stroke="#B5C2C0" strokeWidth={2.2}/><path d={`M${a[0]+dx-1.3} ${a[1]} L${b[0]+dx-1.3} ${b[1]}`} stroke="#E5E1CB" strokeWidth={.65}/></g>))}</g>}
export function MassShadow(){const id=useId().replace(/:/g,'');return <g><defs><filter id={id} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={19}/></filter></defs><ellipse cx={573} cy={887} rx={160} ry={150} fill="#102C35" opacity={.14} filter={`url(#${id})`}/></g>}
function Hydraulic({a,b}:{a:number[];b:number[]}){const spec=scene.objects.cylinder,gain=spec.world_axis_length/(spec.local_outlet[0]-spec.local_mount[0]),angle=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI,len=Math.hypot(b[0]-a[0],b[1]-a[1]);return <g transform={`translate(${a[0]},${a[1]}) rotate(${angle})`}>
 <path d={`M95 0 H${len}`} stroke="#344C54" strokeWidth={14}/><path d={`M95 -1 H${len}`} stroke="#BBC6C5" strokeWidth={9}/><path d={`M96 -3 H${len}`} stroke="#EEE7CC" strokeWidth={2.4}/>
 <NativeImage file={spec.file} rect={[-spec.local_mount[0]*gain,-spec.local_mount[1]*gain,spec.native[0]*gain,spec.native[1]*gain]}/>
 <circle cx={len} r={9} fill="#BEA779" stroke="#465B5E" strokeWidth={2}/><circle cx={len} r={4} fill="#283B42"/>
 </g>}
export function Rods(){const A=scene.anchors;return <g><Hydraulic a={A.base_left} b={A.mass_rig_left}/><Hydraulic a={A.base_right} b={A.mass_rig_right}/></g>}
export function LayerArt({kind}:{kind:string}){useArt();return <AbsoluteFill><svg width="100%" height="100%" viewBox="0 0 1024 1536">{kind==='facade'?<Facade/>:kind==='foreground'?<Foreground/>:kind==='suspension'?<Suspension/>:kind==='rods'?<Rods/>:<MassShadow/>}</svg></AbsoluteFill>}
export function AssetFirstKey({id='C'}:{id:string}){useArt();const key=scene.key_art.find(s=>s.id===id)!;const clip=useId().replace(/:/g,'');return <AbsoluteFill style={{background:'#F6F3EC'}}><svg width="100%" height="100%" viewBox="0 0 1080 1920">
 <defs><clipPath id={clip}><rect x={153+(822-153)*key.reveal} y={480} width={1100} height={680}/></clipPath></defs>
 <g transform={`translate(540,960) scale(${key.camera.scale}) translate(${-key.camera.center[0]},${-key.camera.center[1]})`}>
 <NativeImage file="original/scene-interior.png"/><MassShadow/><Suspension/>
 <NativeImage file={scene.objects.mass.file} rect={scene.objects.mass.rect}/><NativeImage file={scene.objects.cradle.file} rect={scene.objects.cradle.rect}/><Rods/>
 <g clipPath={`url(#${clip})`}><Facade/></g><Foreground/>
 </g></svg><div style={{position:'absolute',bottom:30,left:32,padding:'7px 11px',background:'rgba(246,243,236,.86)',fontFamily:'Noto Sans CJK TC, sans-serif',fontSize:20,color:'#42585E'}}>原創插畫・概念示意</div></AbsoluteFill>}
